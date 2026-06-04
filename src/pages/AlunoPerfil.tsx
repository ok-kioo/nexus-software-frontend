import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, User, Phone, Mail, Calendar, TrendingUp, MessageSquare, Plus } from "lucide-react";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlunoPerfil, useCreateContato } from "@/hooks/useNovasFeatures";

export default function AlunoPerfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useAlunoPerfil(id);
  const createContato = useCreateContato();
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState("anotacao");
  const [descricao, setDescricao] = useState("");

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Perfil do Aluno" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { aluno, matriculas, frequencias, notas, contatos } = data;
  if (!aluno) {
    return (
      <div>
        <PageHeader title="Aluno não encontrado" />
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1"/> Voltar</Button>
      </div>
    );
  }

  const turmaAtiva = matriculas.find((m: any) => m.status === "ativa") ?? matriculas[0];
  const totalAulas = frequencias.length;
  const presencas = frequencias.filter((f: any) => f.presente).length;
  const freqPct = totalAulas ? Math.round((presencas / totalAulas) * 100) : 0;

  const todasNotas = notas.flatMap((n: any) =>
    [n.nota_1, n.nota_2, n.nota_3, n.nota_4].filter((v) => v !== null && v !== undefined),
  );
  const media = todasNotas.length
    ? (todasNotas.reduce((a: number, b: number) => a + Number(b), 0) / todasNotas.length).toFixed(1)
    : "—";

  const risco = freqPct < 75 || (Number(media) < 6 && media !== "—") ? "Alto" : freqPct < 85 ? "Médio" : "Baixo";
  const riscoColor = risco === "Alto" ? "bg-destructive/15 text-destructive" : risco === "Médio" ? "bg-warning/15 text-warning" : "bg-success/15 text-success";

  const ultimos90 = frequencias.slice(0, 90);

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>
      <PageHeader
        title={aluno.nome_aluno}
        subtitle={`Documento: ${aluno.documento}`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1"/> Registrar contato</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo contato/anotação</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anotacao">Anotação</SelectItem>
                      <SelectItem value="ligacao">Ligação</SelectItem>
                      <SelectItem value="reuniao">Reunião</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} maxLength={1000} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button
                  onClick={async () => {
                    if (!descricao.trim()) return;
                    await createContato.mutateAsync({ aluno_id: aluno.id, tipo, descricao });
                    setDescricao(""); setTipo("anotacao"); setOpen(false);
                  }}
                >Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold mb-3">
              {aluno.nome_aluno.charAt(0)}
            </div>
            <h2 className="font-semibold">{aluno.nome_aluno}</h2>
            <Badge variant="outline" className="mt-1">{aluno.status}</Badge>
            <div className="text-xs text-muted-foreground mt-3 space-y-1 w-full text-left">
              {aluno.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3"/> {aluno.email}</div>}
              {aluno.telefone && <div className="flex items-center gap-1"><Phone className="h-3 w-3"/> {aluno.telefone}</div>}
              {aluno.data_nascimento && <div className="flex items-center gap-1"><Calendar className="h-3 w-3"/> {new Date(aluno.data_nascimento).toLocaleDateString("pt-BR")}</div>}
            </div>
          </CardContent>
        </Card>

        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Média geral</div>
          <div className="text-2xl font-bold mt-1">{media}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Frequência</div>
          <div className="text-2xl font-bold mt-1">{freqPct}%</div>
          <div className="text-[10px] text-muted-foreground">{presencas}/{totalAulas} aulas</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Risco</div>
          <div className={`mt-2 inline-block px-2 py-1 rounded text-sm font-medium ${riscoColor}`}>{risco}</div>
          {turmaAtiva && (
            <div className="text-[10px] text-muted-foreground mt-2">Turma: {turmaAtiva.turma?.nome_turma}</div>
          )}
        </CardContent></Card>
      </div>

      <Tabs defaultValue="frequencia">
        <TabsList>
          <TabsTrigger value="frequencia">Frequência</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
          <TabsTrigger value="matriculas">Matrículas</TabsTrigger>
          <TabsTrigger value="contatos">Contatos ({contatos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="frequencia">
          <Card><CardHeader><CardTitle className="text-base">Últimos 90 registros</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-15 gap-1" style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
                {ultimos90.map((f: any) => (
                  <div
                    key={f.id}
                    title={`${new Date(f.data).toLocaleDateString("pt-BR")} — ${f.presente ? "Presente" : "Falta"}`}
                    className={`h-6 rounded ${f.presente ? "bg-success/60" : "bg-destructive/60"}`}
                  />
                ))}
                {ultimos90.length === 0 && <div className="text-xs text-muted-foreground col-span-full">Sem registros de frequência.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notas">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Matrícula</TableHead><TableHead>N1</TableHead><TableHead>N2</TableHead><TableHead>N3</TableHead><TableHead>N4</TableHead><TableHead>Média</TableHead></TableRow></TableHeader>
              <TableBody>
                {notas.map((n: any) => {
                  const arr = [n.nota_1, n.nota_2, n.nota_3, n.nota_4].filter((v) => v !== null);
                  const m = arr.length ? (arr.reduce((a: number, b: number) => a + Number(b), 0) / arr.length).toFixed(1) : "—";
                  return (
                    <TableRow key={n.id}>
                      <TableCell className="text-xs">{n.matricula_id.slice(0,8)}</TableCell>
                      <TableCell>{n.nota_1 ?? "—"}</TableCell>
                      <TableCell>{n.nota_2 ?? "—"}</TableCell>
                      <TableCell>{n.nota_3 ?? "—"}</TableCell>
                      <TableCell>{n.nota_4 ?? "—"}</TableCell>
                      <TableCell className="font-medium">{m}</TableCell>
                    </TableRow>
                  );
                })}
                {notas.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm">Sem notas registradas.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="matriculas">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Turma</TableHead><TableHead>Curso</TableHead><TableHead>Unidade</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {matriculas.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">{m.numero_matricula}</TableCell>
                    <TableCell>{m.turma?.nome_turma}</TableCell>
                    <TableCell>{m.turma?.curso?.nome_curso}</TableCell>
                    <TableCell>{m.turma?.unidade?.nome_unidade}</TableCell>
                    <TableCell><Badge variant="outline">{m.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="contatos">
          <div className="space-y-2">
            {contatos.map((c: any) => (
              <Card key={c.id}><CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-primary"/>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{c.tipo}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{c.descricao}</p>
                  </div>
                </div>
              </CardContent></Card>
            ))}
            {contatos.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">Nenhum contato registrado.</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}