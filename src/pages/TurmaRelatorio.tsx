import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Users } from "lucide-react";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useRelatorioTurma } from "@/hooks/useNovasFeatures";
import { toast } from "sonner";

export default function TurmaRelatorio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useRelatorioTurma(id);

  if (isLoading || !data) {
    return <div><PageHeader title="Relatório da Turma"/><Skeleton className="h-64"/></div>;
  }

  const { turma, matriculas, frequencias, notas, professores } = data;
  if (!turma) {
    return <div><PageHeader title="Turma não encontrada"/><Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1"/> Voltar</Button></div>;
  }

  // Por aluno
  const linhas = matriculas.map((m: any) => {
    const fs = frequencias.filter((f: any) => f.matricula_id === m.id);
    const presentes = fs.filter((f: any) => f.presente).length;
    const freqPct = fs.length ? Math.round((presentes / fs.length) * 100) : 0;
    const ns = notas.filter((n: any) => n.matricula_id === m.id);
    const vals = ns.flatMap((n: any) => [n.nota_1, n.nota_2, n.nota_3, n.nota_4].filter((v) => v !== null));
    const media = vals.length ? (vals.reduce((a: number, b: number) => a + Number(b), 0) / vals.length) : null;
    return { id: m.id, alunoId: m.aluno?.id, nome: m.aluno?.nome_aluno ?? "—", documento: m.aluno?.documento, freqPct, media, status: m.status };
  });

  // Média por avaliação
  const avalChart = [1,2,3,4].map((i) => {
    const vals = notas.map((n: any) => n[`nota_${i}`]).filter((v: any) => v !== null);
    const media = vals.length ? vals.reduce((a: number, b: number) => a + Number(b), 0) / vals.length : 0;
    return { aval: `N${i}`, media: Number(media.toFixed(1)) };
  });

  // Presença consolidada por mês
  const porMes: Record<string, { p: number; t: number }> = {};
  frequencias.forEach((f: any) => {
    const k = f.data.slice(0,7);
    if (!porMes[k]) porMes[k] = { p: 0, t: 0 };
    porMes[k].t++;
    if (f.presente) porMes[k].p++;
  });
  const presChart = Object.entries(porMes).sort().map(([mes, v]) => ({ mes, presenca: Math.round((v.p / v.t) * 100) }));

  const ocupacao = turma.capacidade ? Math.round((matriculas.length / turma.capacidade) * 100) : 0;

  const exportarPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Relatório da Turma ${turma.nome_turma}`, 14, 18);
      doc.setFontSize(10);
      doc.text(`Curso: ${turma.curso?.nome_curso ?? "—"}  |  Unidade: ${turma.unidade?.nome_unidade ?? "—"}`, 14, 26);
      doc.text(`Alunos: ${matriculas.length}/${turma.capacidade} (${ocupacao}%)`, 14, 32);
      autoTable(doc, {
        startY: 40,
        head: [["Aluno", "Documento", "Média", "Frequência", "Status"]],
        body: linhas.map((l) => [l.nome, l.documento ?? "—", l.media?.toFixed(1) ?? "—", `${l.freqPct}%`, l.status]),
      });
      doc.save(`turma_${turma.nome_turma}_${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success("PDF gerado");
    } catch (e: any) {
      toast.error("Erro ao exportar: " + e.message);
    }
  };

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3"><ArrowLeft className="h-4 w-4 mr-1"/> Voltar</Button>
      <PageHeader
        title={`Turma ${turma.nome_turma}`}
        subtitle={`${turma.curso?.nome_curso} · ${turma.unidade?.nome_unidade}`}
        action={<Button onClick={exportarPDF}><Download className="h-4 w-4 mr-1"/> Exportar PDF</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Alunos</div><div className="text-2xl font-bold">{matriculas.length}</div><div className="text-[10px] text-muted-foreground">de {turma.capacidade}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Ocupação</div><div className="text-2xl font-bold">{ocupacao}%</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Turno</div><div className="text-base font-medium mt-2">{turma.turno ?? "—"}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Professores</div><div className="text-base font-medium mt-2">{professores.length > 0 ? professores.map((p: any) => p.name).join(", ") : "—"}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card><CardHeader><CardTitle className="text-sm">Média por avaliação</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={avalChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="aval"/><YAxis domain={[0,10]}/><Tooltip/>
                <Bar dataKey="media" fill="hsl(var(--primary))" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-sm">Presença por mês (%)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={presChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes"/><YAxis domain={[0,100]}/><Tooltip/>
                <Bar dataKey="presenca" fill="hsl(var(--accent))" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4"/> Alunos da turma</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Aluno</TableHead><TableHead>Documento</TableHead><TableHead>Média</TableHead><TableHead>Frequência</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.nome}</TableCell>
                  <TableCell className="text-xs">{l.documento ?? "—"}</TableCell>
                  <TableCell>{l.media?.toFixed(1) ?? "—"}</TableCell>
                  <TableCell>{l.freqPct}%</TableCell>
                  <TableCell><Badge variant="outline">{l.status}</Badge></TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => l.alunoId && navigate(`/alunos/${l.alunoId}`)}>Ver perfil</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}