import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Captura todas as queries que o app dispara contra o Supabase para garantir
// que (a) usam o client autenticado padrão (sem service-role) e (b) não passam
// nenhum filtro que tente bypassar RLS — o escopo de turma é imposto pela
// policy do banco, então o frontend só precisa SELECT * normal.
const fromCalls: { table: string; filters: string[] }[] = [];

function makeChain(table: string) {
  const filters: string[] = [];
  fromCalls.push({ table, filters });

  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn((col: string) => {
      filters.push(`eq:${col}`);
      return chain;
    }),
    in: vi.fn((col: string) => {
      filters.push(`in:${col}`);
      return chain;
    }),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: (resolve: any) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve),
  };
  return chain;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => makeChain(table)),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "prof-1", role: "professor", email: "p@x.com", name: "Prof" },
    role: "professor",
    isAuthenticated: true,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useCursos, useUnidades } from "./useEntities";
import { useAvisos } from "./useNovasFeatures";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("Escopo RLS no client — leituras de professor", () => {
  beforeEach(() => {
    fromCalls.length = 0;
  });

  it("useCursos consulta a tabela 'cursos' deixando o filtro de escopo para a RLS", async () => {
    const { result } = renderHook(() => useCursos(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    const call = fromCalls.find((c) => c.table === "cursos");
    expect(call).toBeDefined();
    // O frontend NÃO deve adicionar filtros tentando emular RLS — isso é responsabilidade
    // exclusiva da policy cursos_select_professor no banco.
    expect(call!.filters.filter((f) => f.startsWith("eq:") || f.startsWith("in:"))).toEqual([]);
  });

  it("useUnidades consulta a tabela 'unidades' sem bypass de escopo", async () => {
    const { result } = renderHook(() => useUnidades(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    const call = fromCalls.find((c) => c.table === "unidades");
    expect(call).toBeDefined();
    expect(call!.filters.filter((f) => f.startsWith("eq:") || f.startsWith("in:"))).toEqual([]);
  });

  it("useAvisos consulta a tabela 'avisos' — RLS aplica filtro publico_alvo", async () => {
    const { result } = renderHook(() => useAvisos(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    const call = fromCalls.find((c) => c.table === "avisos");
    expect(call).toBeDefined();
    // Sem filtros publico_alvo no client — quem decide é a policy avisos_select_all
    expect(call!.filters.filter((f) => f.includes("publico_alvo"))).toEqual([]);
  });
});