import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { fetchExportSection } from "@/lib/api/exportacao";

export type SectionId = "matriculas" | "turmas" | "academico" | "permanencia";
export type ExportFormat = "PDF" | "Excel" | "CSV";

export interface SectionDataset {
  id: SectionId;
  label: string;
  columns: string[];
  rows: (string | number)[][];
}

/* ───────── Coleta de dados ───────── */
async function fetchMatriculas(): Promise<SectionDataset> {
  const { rows: data } = await fetchExportSection<any>("matriculas");
  return {
    id: "matriculas",
    label: "Matrículas",
    columns: ["Nº Matrícula", "Aluno", "CPF", "Turma", "Curso", "Unidade", "Início", "Status"],
    rows: data.map((m: any) => [
      m.numero_matricula,
      m.aluno?.nome_aluno ?? "—",
      m.aluno?.documento ?? "—",
      m.turma?.nome_turma ?? "—",
      m.turma?.curso?.nome_curso ?? "—",
      m.turma?.unidade ? `${m.turma.unidade.nome_unidade}/${m.turma.unidade.estado}` : "—",
      m.data_inicio ?? "—",
      m.status,
    ]),
  };
}

async function fetchTurmas(): Promise<SectionDataset> {
  const { rows: data } = await fetchExportSection<any>("turmas");
  return {
    id: "turmas",
    label: "Turmas",
    columns: ["Turma", "Curso", "Unidade", "Capacidade", "Matriculados", "Ocupação", "Turno", "Status"],
    rows: data.map((t: any) => {
      const enrolled = (t.matriculas ?? []).filter((m: any) => m.status === "ativa").length;
      const pct = t.capacidade ? Math.round((enrolled / t.capacidade) * 100) : 0;
      return [
        t.nome_turma,
        t.curso?.nome_curso ?? "—",
        t.unidade ? `${t.unidade.nome_unidade}/${t.unidade.estado}` : "—",
        t.capacidade,
        enrolled,
        `${pct}%`,
        t.turno ?? "—",
        t.status,
      ];
    }),
  };
}

async function fetchAcademico(): Promise<SectionDataset> {
  const { rows: data } = await fetchExportSection<any>("academico");
  return {
    id: "academico",
    label: "Acadêmico",
    columns: ["Aluno", "Matrícula", "Turma", "Curso", "Nota 1", "Nota 2", "Nota 3", "Nota 4", "Média"],
    rows: data.map((n: any) => {
      const notas = [n.nota_1, n.nota_2, n.nota_3, n.nota_4].filter((x) => x !== null && x !== undefined);
      const media = notas.length ? (notas.reduce((a: number, b: number) => a + Number(b), 0) / notas.length).toFixed(2) : "—";
      return [
        n.matricula?.aluno?.nome_aluno ?? "—",
        n.matricula?.numero_matricula ?? "—",
        n.matricula?.turma?.nome_turma ?? "—",
        n.matricula?.turma?.curso?.nome_curso ?? "—",
        n.nota_1 ?? "—",
        n.nota_2 ?? "—",
        n.nota_3 ?? "—",
        n.nota_4 ?? "—",
        media,
      ];
    }),
  };
}

async function fetchPermanencia(): Promise<SectionDataset> {
  // Calcula permanência = % de presença por matrícula
  const { rows: data } = await fetchExportSection<any>("permanencia");

  const map = new Map<string, { aluno: string; matricula: string; turma: string; unidade: string; status: string; total: number; presentes: number }>();
  data.forEach((f: any) => {
    const key = f.matricula?.numero_matricula;
    if (!key) return;
    const cur = map.get(key) ?? {
      aluno: f.matricula?.aluno?.nome_aluno ?? "—",
      matricula: key,
      turma: f.matricula?.turma?.nome_turma ?? "—",
      unidade: f.matricula?.turma?.unidade ? `${f.matricula.turma.unidade.nome_unidade}/${f.matricula.turma.unidade.estado}` : "—",
      status: f.matricula?.status ?? "—",
      total: 0,
      presentes: 0,
    };
    cur.total += 1;
    if (f.presente) cur.presentes += 1;
    map.set(key, cur);
  });

  return {
    id: "permanencia",
    label: "Permanência",
    columns: ["Aluno", "Matrícula", "Turma", "Unidade", "Aulas", "Presenças", "Frequência", "Status"],
    rows: [...map.values()].map((r) => [
      r.aluno, r.matricula, r.turma, r.unidade,
      r.total, r.presentes,
      r.total ? `${Math.round((r.presentes / r.total) * 100)}%` : "—",
      r.status,
    ]),
  };
}

const FETCHERS: Record<SectionId, () => Promise<SectionDataset>> = {
  matriculas: fetchMatriculas,
  turmas: fetchTurmas,
  academico: fetchAcademico,
  permanencia: fetchPermanencia,
};

export async function collectSections(ids: SectionId[]): Promise<SectionDataset[]> {
  return Promise.all(ids.map((id) => FETCHERS[id]()));
}

/* ───────── Geração ───────── */
const stamp = () => new Date().toISOString().slice(0, 10);

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function generatePDF(sections: SectionDataset[]): { filename: string; size: number } {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const generated = new Date().toLocaleString("pt-BR");

  sections.forEach((section, idx) => {
    if (idx > 0) doc.addPage();
    doc.setFontSize(16);
    doc.text(`Relatório — ${section.label}`, 40, 40);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Gerado em ${generated}  ·  ${section.rows.length} registro(s)`, 40, 56);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 70,
      head: [section.columns],
      body: section.rows.length ? section.rows.map((r) => r.map((c) => String(c))) : [["Sem dados"]],
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [56, 82, 180], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 252] },
      margin: { left: 40, right: 40 },
    });
  });

  const blob = doc.output("blob");
  const filename = `relatorio_${stamp()}.pdf`;
  downloadBlob(blob, filename);
  return { filename, size: blob.size };
}

export function generateExcel(sections: SectionDataset[]): { filename: string; size: number } {
  const wb = XLSX.utils.book_new();
  sections.forEach((section) => {
    const aoa = [section.columns, ...section.rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, section.label.slice(0, 31));
  });
  const arr = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const blob = new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const filename = `relatorio_${stamp()}.xlsx`;
  downloadBlob(blob, filename);
  return { filename, size: blob.size };
}

export function generateCSV(sections: SectionDataset[]): { filename: string; size: number } {
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blocks = sections.map((section) => {
    const header = `# ${section.label}`;
    const cols = section.columns.map(escape).join(";");
    const lines = section.rows.map((r) => r.map(escape).join(";"));
    return [header, cols, ...lines].join("\n");
  });
  const csv = "\uFEFF" + blocks.join("\n\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const filename = `relatorio_${stamp()}.csv`;
  downloadBlob(blob, filename);
  return { filename, size: blob.size };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}