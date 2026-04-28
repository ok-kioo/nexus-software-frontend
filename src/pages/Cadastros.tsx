import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Building2, BookOpen, Users, Loader2, Upload, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Aluno, Curso, Unidade,
  useAlunosPaged, useCursosPaged, useUnidadesPaged, useTurmasPagedJoin, DEFAULT_PAGE_SIZE,
  useDeleteAluno, useDeleteCurso, useDeleteUnidade, useDeleteTurma,
} from "@/hooks/useEntities";
import { UnidadeForm } from "@/components/crud/UnidadeForm";
import { CursoForm } from "@/components/crud/CursoForm";
import { TurmaForm } from "@/components/crud/TurmaForm";
import { AlunoForm } from "@/components/crud/AlunoForm";
import { ConfirmDelete } from "@/components/crud/ConfirmDelete";
import { useAuth } from "@/contexts/AuthContext";
import { SearchInput } from "@/components/reusable/SearchInput";
import { PaginationBar } from "@/components/reusable/PaginationBar";
import { useDebounce } from "@/hooks/useDebounce";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/reusable/EmptyState";
import { TableSkeleton } from "@/components/reusable/TableSkeleton";
import { ErrorState } from "@/components/reusable/ErrorState";

function StatusPill({ status }: { status: string }) {
  const isActive = ["ativa", "ativo"].includes(status);
  return (
    <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15 border-emerald-500/20" : ""}>
      {status}
    </Badge>
  );
}

export default function Cadastros() {
  const { role } = useAuth();
  const canManage = role === "administrador" || role === "gestor";
  const canDelete = role === "administrador";
  const [tab, setTab] = useState("unidades");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const placeholder = tab === "unidades"
    ? "Buscar por nome, cidade ou estado…"
    : tab === "cursos"
    ? "Buscar por nome ou categoria…"
    : tab === "turmas"
    ? "Buscar por nome da turma…"
    : "Buscar por nome, CPF ou e-mail…";

  return (
    <div>
      <PageHeader
        title="Cadastros"
        subtitle="Gestão de unidades, cursos, turmas e alunos"
        icon={<Building2 className="h-5 w-5" />}
      />

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setSearch(""); }}>
        <TabsList>
          <TabsTrigger value="unidades" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />Unidades</TabsTrigger>
          <TabsTrigger value="cursos" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Cursos</TabsTrigger>
          <TabsTrigger value="turmas" className="gap-1.5"><GraduationCap className="h-3.5 w-3.5" />Turmas</TabsTrigger>
          <TabsTrigger value="alunos" className="gap-1.5"><Users className="h-3.5 w-3.5" />Alunos</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex gap-2 mb-4">
              <SearchInput value={search} onChange={setSearch} placeholder={placeholder} className="flex-1" />
            </div>

            <TabsContent value="unidades" className="m-0">
              <UnidadesTab search={debouncedSearch} canManage={canManage} canDelete={canDelete} />
            </TabsContent>
            <TabsContent value="cursos" className="m-0">
              <CursosTab search={debouncedSearch} canManage={canManage} canDelete={canDelete} />
            </TabsContent>
            <TabsContent value="turmas" className="m-0">
              <TurmasTab search={debouncedSearch} canManage={canManage} canDelete={canDelete} />
            </TabsContent>
            <TabsContent value="alunos" className="m-0">
              <AlunosTab search={debouncedSearch} canManage={canManage} canDelete={canDelete} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

/* ────────────── Unidades ────────────── */
function UnidadesTab({ search, canManage, canDelete }: { search: string; canManage: boolean; canDelete: boolean }) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search]);
  const { data, isLoading, isFetching, isError, error, refetch } = useUnidadesPaged({ page, search });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const del = useDeleteUnidade();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Unidade | null>(null);
  const [confirm, setConfirm] = useState<Unidade | null>(null);

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
          {total} unidade(s){search && " (filtrado)"}
          {isFetching && !isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
        </p>
        {canManage && (
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nova Unidade
          </Button>
        )}
      </div>
      {isLoading ? <TableSkeleton columns={5} rows={6} /> : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-7 w-7 text-muted-foreground" />}
            title={search ? "Nenhum resultado para sua busca" : "Nenhuma unidade cadastrada"}
            description={search ? "Tente outros termos ou limpe a busca." : "Comece adicionando a primeira unidade da rede."}
            action={!search && canManage && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Nova Unidade
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/importar"><Upload className="h-4 w-4 mr-1" /> Importar Dados</Link>
                </Button>
              </div>
            )}
          />
        ) : (
          <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Cidade</TableHead><TableHead>Estado</TableHead>
              <TableHead>Status</TableHead><TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id} className="group hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium">{u.nome_unidade}</TableCell>
                <TableCell>{u.cidade}</TableCell>
                <TableCell>{u.estado}</TableCell>
                <TableCell><StatusPill status={u.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex opacity-60 group-hover:opacity-100 transition-opacity">
                    {canManage && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => { setEditing(u); setOpen(true); }} aria-label={`Editar ${u.nome_unidade}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => setConfirm(u)} className="text-destructive hover:text-destructive" aria-label={`Excluir ${u.nome_unidade}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationBar page={page} pageSize={DEFAULT_PAGE_SIZE} total={total} onPageChange={setPage} loading={isFetching} />
        </>
        )}
        </>
      )}
      <UnidadeForm open={open} onOpenChange={setOpen} unidade={editing} />
      <ConfirmDelete
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Excluir unidade?"
        description={`Tem certeza que deseja excluir "${confirm?.nome_unidade}"? Turmas vinculadas serão afetadas.`}
        loading={del.isPending}
        onConfirm={async () => { if (confirm) { await del.mutateAsync(confirm.id); setConfirm(null); } }}
      />
    </>
  );
}

/* ────────────── Cursos ────────────── */
function CursosTab({ search, canManage, canDelete }: { search: string; canManage: boolean; canDelete: boolean }) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search]);
  const { data, isLoading, isFetching, isError, error, refetch } = useCursosPaged({ page, search });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const del = useDeleteCurso();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Curso | null>(null);
  const [confirm, setConfirm] = useState<Curso | null>(null);

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
          {total} curso(s){search && " (filtrado)"}
          {isFetching && !isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
        </p>
        {canManage && (
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Novo Curso
          </Button>
        )}
      </div>
      {isLoading ? <TableSkeleton columns={5} rows={6} /> : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
        {rows.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-7 w-7 text-muted-foreground" />}
            title={search ? "Nenhum resultado para sua busca" : "Nenhum curso cadastrado"}
            description={search ? "Tente outros termos ou limpe a busca." : "Adicione cursos para vincular às turmas."}
            action={!search && canManage && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Curso
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/importar"><Upload className="h-4 w-4 mr-1" /> Importar Dados</Link>
                </Button>
              </div>
            )}
          />
        ) : (
          <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Curso</TableHead><TableHead>Categoria</TableHead><TableHead>Carga Horária</TableHead>
              <TableHead>Status</TableHead><TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id} className="group hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium">{c.nome_curso}</TableCell>
                <TableCell>{c.categoria}</TableCell>
                <TableCell>{c.carga_horaria ? `${c.carga_horaria}h` : "—"}</TableCell>
                <TableCell><StatusPill status={c.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex opacity-60 group-hover:opacity-100 transition-opacity">
                    {canManage && (
                      <Tooltip><TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }} aria-label={`Editar ${c.nome_curso}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip><TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => setConfirm(c)} className="text-destructive hover:text-destructive" aria-label={`Excluir ${c.nome_curso}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationBar page={page} pageSize={DEFAULT_PAGE_SIZE} total={total} onPageChange={setPage} loading={isFetching} />
        </>
        )}
        </>
      )}
      <CursoForm open={open} onOpenChange={setOpen} curso={editing} />
      <ConfirmDelete
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Excluir curso?"
        description={`Tem certeza que deseja excluir "${confirm?.nome_curso}"?`}
        loading={del.isPending}
        onConfirm={async () => { if (confirm) { await del.mutateAsync(confirm.id); setConfirm(null); } }}
      />
    </>
  );
}

/* ────────────── Alunos ────────────── */
function AlunosTab({ search, canManage, canDelete }: { search: string; canManage: boolean; canDelete: boolean }) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search]);
  const { data, isLoading, isFetching, isError, error, refetch } = useAlunosPaged({ page, search });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const del = useDeleteAluno();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Aluno | null>(null);
  const [confirm, setConfirm] = useState<Aluno | null>(null);

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
          {total} aluno(s){search && " (filtrado)"}
          {isFetching && !isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
        </p>
        {canManage && (
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Novo Aluno
          </Button>
        )}
      </div>
      {isLoading ? <TableSkeleton columns={6} rows={6} /> : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7 text-muted-foreground" />}
            title={search ? "Nenhum resultado para sua busca" : "Nenhum aluno cadastrado"}
            description={search ? "Tente outros termos ou limpe a busca." : "Cadastre alunos manualmente ou use Importar para carregar uma planilha."}
            action={!search && canManage && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Aluno
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/importar"><Upload className="h-4 w-4 mr-1" /> Importar Dados</Link>
                </Button>
              </div>
            )}
          />
        ) : (
          <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>CPF</TableHead><TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead><TableHead>Status</TableHead><TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id} className="group hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium">{a.nome_aluno}</TableCell>
                <TableCell>{a.documento}</TableCell>
                <TableCell>{a.email ?? "—"}</TableCell>
                <TableCell>{a.telefone ?? "—"}</TableCell>
                <TableCell><StatusPill status={a.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex opacity-60 group-hover:opacity-100 transition-opacity">
                    {canManage && (
                      <Tooltip><TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(a); setOpen(true); }} aria-label={`Editar ${a.nome_aluno}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip><TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => setConfirm(a)} className="text-destructive hover:text-destructive" aria-label={`Excluir ${a.nome_aluno}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationBar page={page} pageSize={DEFAULT_PAGE_SIZE} total={total} onPageChange={setPage} loading={isFetching} />
        </>
        )}
        </>
      )}
      <AlunoForm open={open} onOpenChange={setOpen} aluno={editing} />
      <ConfirmDelete
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Excluir aluno?"
        description={`Tem certeza que deseja excluir "${confirm?.nome_aluno}"? Matrículas vinculadas também serão removidas.`}
        loading={del.isPending}
        onConfirm={async () => { if (confirm) { await del.mutateAsync(confirm.id); setConfirm(null); } }}
      />
    </>
  );
}

/* ────────────── Turmas ────────────── */
type TurmaJoinRow = {
  id: string;
  nome_turma: string;
  capacidade: number;
  periodo: string | null;
  turno: string | null;
  status: string;
  unidade_id: string;
  curso_id: string;
  unidade?: { id: string; nome_unidade: string; estado: string };
  curso?: { id: string; nome_curso: string };
};

function TurmasTab({ search, canManage, canDelete }: { search: string; canManage: boolean; canDelete: boolean }) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search]);
  const { data, isLoading, isFetching, isError, error, refetch } = useTurmasPagedJoin({ page, search });
  const rows = (data?.rows ?? []) as TurmaJoinRow[];
  const total = data?.total ?? 0;
  const del = useDeleteTurma();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TurmaJoinRow | null>(null);
  const [confirm, setConfirm] = useState<TurmaJoinRow | null>(null);

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
          {total} turma(s){search && " (filtrado)"}
          {isFetching && !isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
        </p>
        {canManage && (
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nova Turma
          </Button>
        )}
      </div>
      {isLoading ? <TableSkeleton columns={7} rows={6} /> : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
        {rows.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="h-7 w-7 text-muted-foreground" />}
            title={search ? "Nenhum resultado para sua busca" : "Nenhuma turma cadastrada"}
            description={search ? "Tente outros termos ou limpe a busca." : "Cadastre turmas para vincular alunos via matrícula."}
            action={!search && canManage && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Nova Turma
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/importar"><Upload className="h-4 w-4 mr-1" /> Importar Dados</Link>
                </Button>
              </div>
            )}
          />
        ) : (
          <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Turma</TableHead><TableHead>Unidade</TableHead><TableHead>Curso</TableHead>
              <TableHead>Turno</TableHead><TableHead>Período</TableHead><TableHead>Capacidade</TableHead>
              <TableHead>Status</TableHead><TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => (
              <TableRow key={t.id} className="group hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium">{t.nome_turma}</TableCell>
                <TableCell>{t.unidade?.nome_unidade ?? "—"}</TableCell>
                <TableCell>{t.curso?.nome_curso ?? "—"}</TableCell>
                <TableCell className="capitalize">{t.turno ?? "—"}</TableCell>
                <TableCell>{t.periodo ?? "—"}</TableCell>
                <TableCell>{t.capacidade}</TableCell>
                <TableCell><StatusPill status={t.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex opacity-60 group-hover:opacity-100 transition-opacity">
                    {canManage && (
                      <Tooltip><TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }} aria-label={`Editar ${t.nome_turma}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip><TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => setConfirm(t)} className="text-destructive hover:text-destructive" aria-label={`Excluir ${t.nome_turma}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationBar page={page} pageSize={DEFAULT_PAGE_SIZE} total={total} onPageChange={setPage} loading={isFetching} />
        </>
        )}
        </>
      )}
      <TurmaForm
        open={open}
        onOpenChange={setOpen}
        turma={editing as any}
      />
      <ConfirmDelete
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Excluir turma?"
        description={`Tem certeza que deseja excluir "${confirm?.nome_turma}"? Matrículas e vínculos de professores serão afetados.`}
        loading={del.isPending}
        onConfirm={async () => { if (confirm) { await del.mutateAsync(confirm.id); setConfirm(null); } }}
      />
    </>
  );
}