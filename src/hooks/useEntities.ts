import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createResource,
  deleteResource,
  listMatriculasWithRelations,
  listResource,
  listTurmasWithRelations,
  updateResource,
  type MatriculasJoinParams,
} from "@/lib/api/cadastros";

export const DEFAULT_PAGE_SIZE = 20;

export interface PagedResult<T> {
  rows: T[];
  total: number;
}

export interface PagedQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

/* ───────── Tipos de domínio ───────── */
export interface Unidade {
  id: string;
  nome_unidade: string;
  cidade: string;
  estado: string;
  status: string;
  created_at: string;
}

export interface Curso {
  id: string;
  nome_curso: string;
  categoria: string;
  carga_horaria: number | null;
  status: string;
}

export interface Turma {
  id: string;
  nome_turma: string;
  unidade_id: string;
  curso_id: string;
  capacidade: number;
  periodo: string | null;
  turno: string | null;
  status: string;
}

export interface Aluno {
  id: string;
  nome_aluno: string;
  documento: string;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  status: string;
}

export interface Matricula {
  id: string;
  aluno_id: string;
  turma_id: string;
  numero_matricula: string;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
}

/* ───────── Helpers genéricos ───────── */
function makeListHook<T>(table: string, key: string) {
  return () =>
    useQuery({
      queryKey: [key, "api"],
      queryFn: async () => {
        const res = await listResource<T>(table, { pageSize: 200 });
        return res.rows;
      },
    });
}

function makeMutationHooks(table: string, key: string, label: string) {
  const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
    qc.invalidateQueries({ queryKey: [key] });
    qc.invalidateQueries({ queryKey: [`${key}-paged`] });
    qc.invalidateQueries({ queryKey: [`${key}-paged-join`] });
    qc.invalidateQueries({ queryKey: [`${key}-join`] });
  };

  const useCreate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (payload: Record<string, any>) => createResource(table, payload),
      onSuccess: () => {
        invalidate(qc);
        toast.success(`${label} criado(a) com sucesso`);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  const useUpdate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, ...payload }: { id: string } & Record<string, any>) =>
        updateResource(table, id, payload),
      onSuccess: () => {
        invalidate(qc);
        toast.success(`${label} atualizado(a) com sucesso`);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  const useDelete = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        await deleteResource(table, id);
      },
      onSuccess: () => {
        invalidate(qc);
        toast.success(`${label} excluído(a) com sucesso`);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  return { useCreate, useUpdate, useDelete };
}

/* ───────── Hooks por entidade ───────── */
export const useUnidades = makeListHook<Unidade>("unidades", "unidades");
export const { useCreate: useCreateUnidade, useUpdate: useUpdateUnidade, useDelete: useDeleteUnidade } = makeMutationHooks("unidades", "unidades", "Unidade");

export const useCursos = makeListHook<Curso>("cursos", "cursos");
export const { useCreate: useCreateCurso, useUpdate: useUpdateCurso, useDelete: useDeleteCurso } = makeMutationHooks("cursos", "cursos", "Curso");

export const useTurmas = makeListHook<Turma>("turmas", "turmas");
export const { useCreate: useCreateTurma, useUpdate: useUpdateTurma, useDelete: useDeleteTurma } = makeMutationHooks("turmas", "turmas", "Turma");

export const useAlunos = makeListHook<Aluno>("alunos", "alunos");
export const { useCreate: useCreateAluno, useUpdate: useUpdateAluno, useDelete: useDeleteAluno } = makeMutationHooks("alunos", "alunos", "Aluno");

export const useMatriculas = makeListHook<Matricula>("matriculas", "matriculas");
export const { useCreate: useCreateMatricula, useUpdate: useUpdateMatricula, useDelete: useDeleteMatricula } = makeMutationHooks("matriculas", "matriculas", "Matrícula");

/* ───────── Hooks com joins ───────── */
export function useMatriculasComJoin() {
  return useQuery({
    queryKey: ["matriculas-join", "api"],
    queryFn: async () => {
      const res = await listMatriculasWithRelations({ pageSize: 200 });
      return res.rows;
    },
  });
}

export function useTurmasComJoin() {
  return useQuery({
    queryKey: ["turmas-join", "api"],
    queryFn: async () => {
      const res = await listTurmasWithRelations();
      return res.rows;
    },
  });
}

/* ───────── Hooks paginados (server-side via API) ───────── */
function makePagedHook<T>(table: string, key: string) {
  return ({ page = 1, pageSize = DEFAULT_PAGE_SIZE, search = "" }: PagedQueryParams) =>
    useQuery({
      queryKey: [`${key}-paged`, page, pageSize, search, "api"],
      queryFn: async (): Promise<PagedResult<T>> => {
        const res = await listResource<T>(table, { page, pageSize, search });
        return { rows: res.rows, total: res.total };
      },
    });
}

export const useUnidadesPaged = makePagedHook<Unidade>("unidades", "unidades");
export const useCursosPaged = makePagedHook<Curso>("cursos", "cursos");
export const useAlunosPaged = makePagedHook<Aluno>("alunos", "alunos");

export function useTurmasPagedJoin({ page = 1, pageSize = DEFAULT_PAGE_SIZE, search = "" }: PagedQueryParams) {
  return useQuery({
    queryKey: ["turmas-paged-join", page, pageSize, search, "api"],
    queryFn: async () => {
      // /with-relations não pagina; aplicamos filtragem/paginação client-side para manter contrato.
      const res = await listTurmasWithRelations();
      const all = (res.rows as any[]) ?? [];
      const filtered = search
        ? all.filter((t) => String(t.nome_turma ?? "").toLowerCase().includes(search.toLowerCase()))
        : all;
      const from = (page - 1) * pageSize;
      return { rows: filtered.slice(from, from + pageSize), total: filtered.length };
    },
  });
}

export interface MatriculasPagedParams extends PagedQueryParams {
  dataInicio?: string;
  dataFim?: string;
  status?: string;
  unidadeId?: string;
  cursoId?: string;
  turmaId?: string;
}

export function useMatriculasPagedJoin(params: MatriculasPagedParams) {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search = "", dataInicio, dataFim, status, unidadeId, cursoId, turmaId } = params;
  return useQuery({
    queryKey: ["matriculas-paged-join", page, pageSize, search, dataInicio, dataFim, status, unidadeId, cursoId, turmaId, "api"],
    queryFn: async () => {
      const res = await listMatriculasWithRelations({
        page, pageSize, search, status, dataInicio, dataFim, unidadeId, cursoId, turmaId,
      } as MatriculasJoinParams);
      return { rows: res.rows, total: res.total };
    },
  });
}
