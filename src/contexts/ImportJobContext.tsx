import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import {
  fetchActiveImportJob,
  type ImportJob,
  TERMINAL_STATUSES,
} from "@/hooks/useImportJob";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "nexus-active-import-job";

interface ImportJobContextValue {
  activeJobId: string | null;
  setActiveJobId: (id: string | null) => void;
  activeJob: ImportJob | null;
}

const Ctx = createContext<ImportJobContextValue | null>(null);

/**
 * Provider único, montado acima das rotas autenticadas.
 * - Hidrata o job ativo do usuário ao entrar na app (1 request).
 * - Mantém o jobId em memória + localStorage como bridge entre reloads.
 * - Inscreve realtime para limpar o estado quando o job termina.
 * - Sem polling.
 */
export function ImportJobProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeJobId, setActiveJobIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });
  const [activeJob, setActiveJob] = useState<ImportJob | null>(null);

  const setActiveJobId = useCallback((id: string | null) => {
    setActiveJobIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage indisponível */
    }
  }, []);

  // Hidratação inicial: pergunta uma única vez ao backend qual é o job ativo do usuário.
  useEffect(() => {
    if (!user?.id) {
      setActiveJob(null);
      return;
    }
    let cancelled = false;
    fetchActiveImportJob().then((job) => {
      if (cancelled) return;
      if (job) {
        setActiveJobIdState(job.id);
        setActiveJob(job);
        try { localStorage.setItem(STORAGE_KEY, job.id); } catch { /* noop */ }
      } else {
        // Não há job ativo no servidor — limpa eventual referência local.
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
        setActiveJobIdState(null);
        setActiveJob(null);
      }
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Realtime: atualiza o job em memória conforme o backend grava progresso.
  useEffect(() => {
    if (!activeJobId) {
      setActiveJob(null);
      return;
    }
    const channel = supabase
      .channel(`active-import-${activeJobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "import_jobs", filter: `id=eq.${activeJobId}` },
        (payload) => {
          const next = payload.new as ImportJob;
          setActiveJob(next);
          if (TERMINAL_STATUSES.includes(next.status)) {
            // Mantém visível brevemente; consumidor decide quando limpar.
            // Aqui só removemos do storage para não ressuscitar após reload.
            try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeJobId]);

  return (
    <Ctx.Provider value={{ activeJobId, setActiveJobId, activeJob }}>
      {children}
    </Ctx.Provider>
  );
}

export function useActiveImportJob() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useActiveImportJob deve ser usado dentro de <ImportJobProvider>");
  return ctx;
}
