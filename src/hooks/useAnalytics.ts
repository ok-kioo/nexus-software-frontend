import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";

/* ─── Tipos crus ─── */
interface RawMatricula {
  id: string; status: string; data_inicio: string | null; data_fim: string | null;
  aluno: { id: string; nome_aluno: string; documento: string } | null;
  turma: {
    id: string; nome_turma: string; capacidade: number; periodo: string | null; status: string;
    curso: { id: string; nome_curso: string } | null;
    unidade: { id: string; nome_unidade: string; estado: string; cidade: string } | null;
  } | null;
}
interface RawFreq { presente: boolean; data: string; matricula_id: string; }
interface RawNota { matricula_id: string; nota_1: number | null; nota_2: number | null; nota_3: number | null; nota_4: number | null; }

/* ─── Fetch base (sempre via API) ─── */
async function fetchBase() {
  const data = await analyticsApi.base();
  return {
    matriculas: (data.matriculas ?? []) as unknown as RawMatricula[],
    freq: (data.freq ?? []) as RawFreq[],
    notas: (data.notas ?? []) as RawNota[],
  };
}

/* ─── Derivações ─── */
const fmtPct = (n: number) => `${n.toFixed(1).replace(".", ",")}%`;
const fmtNum = (n: number) => n.toFixed(1).replace(".", ",");

function computeAvg(notas: RawNota[]) {
  const byMat = new Map<string, number>();
  notas.forEach((n) => {
    const arr = [n.nota_1, n.nota_2, n.nota_3, n.nota_4].filter((v): v is number => v !== null && v !== undefined);
    if (arr.length) byMat.set(n.matricula_id, arr.reduce((a, b) => a + Number(b), 0) / arr.length);
  });
  return byMat;
}
function computePresence(freq: RawFreq[]) {
  const map = new Map<string, { total: number; pres: number; lastAbsents: number; lastDate?: string }>();
  // ordena por data desc
  const sorted = [...freq].sort((a, b) => b.data.localeCompare(a.data));
  sorted.forEach((f) => {
    const cur = map.get(f.matricula_id) ?? { total: 0, pres: 0, lastAbsents: 0, lastDate: undefined };
    cur.total += 1;
    if (f.presente) cur.pres += 1;
    map.set(f.matricula_id, cur);
  });
  // faltas consecutivas mais recentes
  const consec = new Map<string, { absents: number; lastPresent?: string }>();
  const grouped = new Map<string, RawFreq[]>();
  sorted.forEach((f) => {
    const arr = grouped.get(f.matricula_id) ?? [];
    arr.push(f);
    grouped.set(f.matricula_id, arr);
  });
  grouped.forEach((arr, id) => {
    let absents = 0; let lastPresent: string | undefined;
    for (const f of arr) {
      if (f.presente) { lastPresent = f.data; break; }
      absents += 1;
    }
    consec.set(id, { absents, lastPresent });
  });
  return { map, consec };
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics-base", "api"],
    queryFn: fetchBase,
    staleTime: 30_000,
  });
}

/* ─── Seletores derivados (puros) ─── */
export function deriveDashboard(base: Awaited<ReturnType<typeof fetchBase>>) {
  const { matriculas, freq, notas } = base;
  const ativas = matriculas.filter((m) => m.status === "ativa");
  const total = matriculas.length;
  const evadidos = matriculas.filter((m) => m.status === "cancelada").length;
  const evasao = total ? (evadidos / total) * 100 : 0;
  const fpres = freq.length ? (freq.filter((f) => f.presente).length / freq.length) * 100 : 0;
  const avgMap = computeAvg(notas);
  const medias = [...avgMap.values()];
  const mediaGeral = medias.length ? medias.reduce((a, b) => a + b, 0) / medias.length : 0;

  const kpis = [
    { label: "Total de Alunos", value: total.toLocaleString("pt-BR"), delta: undefined as number | undefined },
    { label: "Taxa de Evasão", value: fmtPct(evasao) },
    { label: "Frequência Média", value: fmtPct(fpres) },
    { label: "Média de Desempenho", value: fmtNum(mediaGeral) },
  ];

  // Comparativo por unidade
  const uMap = new Map<string, { unit: string; matriculas: number; presentes: number; aulas: number; somaNota: number; nNota: number }>();
  matriculas.forEach((m) => {
    const uName = m.turma?.unidade?.nome_unidade ?? "—";
    const cur = uMap.get(uName) ?? { unit: uName, matriculas: 0, presentes: 0, aulas: 0, somaNota: 0, nNota: 0 };
    cur.matriculas += 1;
    const media = avgMap.get(m.id);
    if (media !== undefined) { cur.somaNota += media; cur.nNota += 1; }
    uMap.set(uName, cur);
  });
  const matToUnit = new Map<string, string>();
  matriculas.forEach((m) => matToUnit.set(m.id, m.turma?.unidade?.nome_unidade ?? "—"));
  freq.forEach((f) => {
    const u = matToUnit.get(f.matricula_id); if (!u) return;
    const cur = uMap.get(u); if (!cur) return;
    cur.aulas += 1; if (f.presente) cur.presentes += 1;
  });
  const unitComparison = [...uMap.values()].map((u) => ({
    unit: u.unit,
    matriculas: u.matriculas,
    frequencia: u.aulas ? Math.round((u.presentes / u.aulas) * 100) : 0,
    desempenho: u.nNota ? Number((u.somaNota / u.nNota).toFixed(1)) : 0,
  })).sort((a, b) => a.unit.localeCompare(b.unit));

  // Risco (top 5)
  const presence = computePresence(freq);
  const risco = matriculas
    .filter((m) => m.status === "ativa" && m.aluno && m.turma)
    .map((m) => {
      const p = presence.map.get(m.id);
      const freqPct = p?.total ? (p.pres / p.total) * 100 : 100;
      const media = avgMap.get(m.id) ?? null;
      const consec = presence.consec.get(m.id)?.absents ?? 0;
      // score 0-100: peso freq 50, nota 30, faltas consec 20
      const fScore = Math.max(0, 100 - freqPct);
      const nScore = media === null ? 30 : Math.max(0, (10 - media) * 10);
      const cScore = Math.min(100, consec * 15);
      const risk = Math.round(fScore * 0.5 + nScore * 0.3 + cScore * 0.2);
      return {
        id: m.id,
        name: m.aluno!.nome_aluno,
        unit: `${m.turma!.unidade?.nome_unidade ?? "—"}/${m.turma!.unidade?.estado ?? ""}`,
        turma: m.turma!.nome_turma,
        risk,
        frequencia: Math.round(freqPct),
        ultimaNota: media === null ? null : Number(media.toFixed(1)),
        faltasConsec: consec,
      };
    })
    .sort((a, b) => b.risk - a.risk);

  return { kpis, unitComparison, risco, ativas, total, evasao, fpres, mediaGeral, avgMap, presence, matToUnit };
}

export function deriveAcademico(base: Awaited<ReturnType<typeof fetchBase>>) {
  const { matriculas, freq, notas } = base;
  const avgMap = computeAvg(notas);

  // Média por curso
  const cursoMap = new Map<string, { soma: number; n: number }>();
  matriculas.forEach((m) => {
    const media = avgMap.get(m.id); if (media === undefined) return;
    const c = m.turma?.curso?.nome_curso ?? "—";
    const cur = cursoMap.get(c) ?? { soma: 0, n: 0 };
    cur.soma += media; cur.n += 1; cursoMap.set(c, cur);
  });
  const gradesByCourse = [...cursoMap.entries()].map(([course, v]) => ({ course, media: Number((v.soma / v.n).toFixed(2)) }))
    .sort((a, b) => b.media - a.media);

  // Frequência por unidade nos últimos 6 meses
  const monthMap = new Map<string, Map<string, { pres: number; total: number }>>();
  const matToUnit = new Map<string, string>();
  matriculas.forEach((m) => matToUnit.set(m.id, m.turma?.unidade?.nome_unidade ?? "—"));
  freq.forEach((f) => {
    const ym = f.data.slice(0, 7);
    const u = matToUnit.get(f.matricula_id); if (!u) return;
    const byU = monthMap.get(ym) ?? new Map(); monthMap.set(ym, byU);
    const cur = byU.get(u) ?? { pres: 0, total: 0 };
    cur.total += 1; if (f.presente) cur.pres += 1; byU.set(u, cur);
  });
  const meses = [...monthMap.keys()].sort();
  const attendanceOverTime = meses.map((ym) => {
    const byU = monthMap.get(ym)!;
    const row: Record<string, string | number> = { month: ym };
    byU.forEach((v, u) => { row[u] = v.total ? Math.round((v.pres / v.total) * 100) : 0; });
    return row;
  });

  // Top / Bottom alunos (por média)
  const todos = matriculas
    .filter((m) => m.aluno && avgMap.has(m.id))
    .map((m) => {
      const media = avgMap.get(m.id)!;
      const presence = computePresence(freq);
      const p = presence.map.get(m.id);
      const freqPct = p?.total ? (p.pres / p.total) * 100 : 0;
      return {
        name: m.aluno!.nome_aluno,
        unit: `${m.turma?.unidade?.nome_unidade ?? "—"}/${m.turma?.unidade?.estado ?? ""}`,
        turma: m.turma?.nome_turma ?? "—",
        media: Number(media.toFixed(1)),
        frequencia: Math.round(freqPct),
        trend: "stable" as "up" | "down" | "stable",
      };
    });
  const top = [...todos].sort((a, b) => b.media - a.media).slice(0, 10);
  const bottom = [...todos].sort((a, b) => a.media - b.media).slice(0, 10);

  // KPIs
  const medias = [...avgMap.values()];
  const mediaGeral = medias.length ? medias.reduce((a, b) => a + b, 0) / medias.length : 0;
  const turmaMap = new Map<string, { soma: number; n: number; nome: string }>();
  matriculas.forEach((m) => {
    const media = avgMap.get(m.id); if (media === undefined || !m.turma) return;
    const cur = turmaMap.get(m.turma.id) ?? { soma: 0, n: 0, nome: m.turma.nome_turma };
    cur.soma += media; cur.n += 1; turmaMap.set(m.turma.id, cur);
  });
  const turmasMedia = [...turmaMap.values()].map((v) => ({ nome: v.nome, media: v.soma / v.n }));
  const melhor = turmasMedia.sort((a, b) => b.media - a.media)[0];
  const pior = [...turmasMedia].sort((a, b) => a.media - b.media)[0];
  const abaixo = todos.filter((t) => t.media < 6).length;

  const kpis = [
    { label: "Média Geral da Rede", value: fmtNum(mediaGeral) },
    { label: "Melhor Turma", value: melhor ? `${melhor.nome} (${fmtNum(melhor.media)})` : "—" },
    { label: "Pior Turma", value: pior ? `${pior.nome} (${fmtNum(pior.media)})` : "—" },
    { label: "Alunos Abaixo da Média", value: abaixo.toString() },
  ];

  // Progresso por período
  const periodoMap = new Map<string, { soma: number; n: number }>();
  matriculas.forEach((m) => {
    const media = avgMap.get(m.id); if (media === undefined) return;
    const p = m.turma?.periodo ?? "—";
    const cur = periodoMap.get(p) ?? { soma: 0, n: 0 };
    cur.soma += media; cur.n += 1; periodoMap.set(p, cur);
  });
  const academicProgress = [...periodoMap.entries()].map(([semester, v]) => ({ semester, media: Number((v.soma / v.n).toFixed(2)) }))
    .sort((a, b) => a.semester.localeCompare(b.semester));

  return { kpis, gradesByCourse, attendanceOverTime, top, bottom, academicProgress };
}

export function derivePermanencia(base: Awaited<ReturnType<typeof fetchBase>>) {
  const { matriculas } = base;
  const total = matriculas.length;
  const cancelados = matriculas.filter((m) => m.status === "cancelada");
  const evasao = total ? (cancelados.length / total) * 100 : 0;
  const retencao = 100 - evasao;
  const dash = deriveDashboard(base);
  const risco = dash.risco;
  const emRisco = risco.filter((r) => r.risk >= 60).length;

  // Desistências por mês (data_fim de canceladas)
  const evolMap = new Map<string, number>();
  cancelados.forEach((m) => {
    if (!m.data_fim) return;
    const ym = m.data_fim.slice(0, 7);
    evolMap.set(ym, (evolMap.get(ym) ?? 0) + 1);
  });
  const dropoutEvolution = [...evolMap.entries()].sort().map(([month, taxa]) => ({ month, taxa }));

  const byUnit = new Map<string, number>();
  cancelados.forEach((m) => {
    const u = `${m.turma?.unidade?.nome_unidade ?? "—"}/${m.turma?.unidade?.estado ?? ""}`;
    byUnit.set(u, (byUnit.get(u) ?? 0) + 1);
  });
  const dropoutByUnit = [...byUnit.entries()].map(([unit, desistencias]) => ({ unit, desistencias }))
    .sort((a, b) => b.desistencias - a.desistencias);

  const byCourse = new Map<string, number>();
  cancelados.forEach((m) => {
    const c = m.turma?.curso?.nome_curso ?? "—";
    byCourse.set(c, (byCourse.get(c) ?? 0) + 1);
  });
  const dropoutByCourse = [...byCourse.entries()].map(([course, desistencias]) => ({ course, desistencias }))
    .sort((a, b) => b.desistencias - a.desistencias);

  const desistMes = dropoutEvolution.length ? dropoutEvolution[dropoutEvolution.length - 1].taxa : 0;

  const kpis = [
    { label: "Taxa de Evasão", value: fmtPct(evasao) },
    { label: "Taxa de Retenção", value: fmtPct(retencao) },
    { label: "Alunos em Risco", value: emRisco.toString() },
    { label: "Desistências no Mês", value: desistMes.toString() },
  ];

  return { kpis, dropoutEvolution, dropoutByUnit, dropoutByCourse, risco };
}

/* ─── Alertas dinâmicos: movido para o backend (módulo `alertas`).
 *    Use `useAlertas()` em `@/hooks/useAlertas`. ─── */

/* ─── Cores por unidade (estável por nome) ─── */
const PALETTE = ["#3852B4", "#5E7AC4", "#F08D39", "#F3BE7A", "#22c55e", "#a855f7", "#ec4899"];
export function unitColorFor(name: string, idx: number) {
  return PALETTE[idx % PALETTE.length];
}

/* ─── Hook professor: turmas atribuídas + alunos ─── */
export function useTurmasDoProfessor(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: ["turmas-professor", userId, "api"],
    queryFn: async () => {
      const res = await analyticsApi.turmasDoProfessor();
      return res.rows;
    },
  });
}

export function useMatriculasDaTurma(turmaId: string | undefined) {
  return useQuery({
    enabled: !!turmaId,
    queryKey: ["matriculas-turma", turmaId, "api"],
    queryFn: async () => {
      const res = await analyticsApi.matriculasDaTurma(turmaId!);
      return res.rows;
    },
  });
}