import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiRequest } from "@/lib/api/client";

export type ImportJobStatus =
  | "queued"
  | "parsing"
  | "validating"
  | "persisting"
  | "completed"
  | "failed"
  | "cancelled";

export interface ImportJob {
  id: string;
  user_id: string;
  status: ImportJobStatus;
  progress_pct: number;
  current_step: string | null;
  file_name: string;
  file_size_bytes: number;
  total_rows: number | null;
  processed_rows: number;
  total_chunks: number | null;
  processed_chunks: number;
  inserted_count: number;
  skipped_count: number;
  validation_errors: unknown;
  result_summary: unknown;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export const TERMINAL_STATUSES: ImportJobStatus[] = ["completed", "failed", "cancelled"];

function getApiBase() {
  return import.meta.env.VITE_API_URL ?? "http://localhost:3000";
}

/**
 * Acompanha um job de importação via Server-Sent Events (SSE).
 */
export function useImportJob(jobId: string | null) {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();
    let cleanupRealtime: (() => void) | undefined;
    setError(null);

    async function hydrateOnce() {
      try {
        const data = await apiRequest<ImportJob>(`/v1/importacao/jobs/${jobId}`);
        if (!cancelled) setJob(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }

    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token ?? "";
      
      if (cancelled) return;

      const url = `${getApiBase()}/v1/importacao/jobs/${jobId}/events`;

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
          signal: abortController.signal,
        });

        if (!res.ok || !res.body) {
          await hydrateOnce();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (!cancelled) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          
          buffer = events.pop() ?? "";

          for (const evt of events) {
            const dataLine = evt.split("\n").find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            
            const payload = dataLine.slice(5).trim();
            if (!payload || payload === "1") continue;

            try {
              const parsed = JSON.parse(payload) as ImportJob;
              if (!cancelled) setJob(parsed);
              
              if (TERMINAL_STATUSES.includes(parsed.status)) {
                abortController.abort();
                return;
              }
            } catch {
              // Ignora falhas de parse de linhas isoladas
            }
          }
        }
      } catch (e: any) {
        if (e.name === "AbortError" || abortController.signal.aborted) {
          return;
        }
        if (!cancelled) setError(e.message);
        await hydrateOnce();
      }
    })();

    // Fallback: Realtime
    const channel = supabase
      .channel(`import-job-${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "import_jobs", filter: `id=eq.${jobId}` },
        (payload) => {
          if (!cancelled) {
            const next = payload.new as ImportJob;
            setJob(next);
            if (TERMINAL_STATUSES.includes(next.status)) {
               abortController.abort();
            }
          }
        },
      )
      .subscribe();
      
    cleanupRealtime = () => supabase.removeChannel(channel);

    return () => {
      cancelled = true;
      abortController.abort();
      cleanupRealtime?.();
    };
  }, [jobId]);

  return {
    job,
    error,
    isTerminal: job ? TERMINAL_STATUSES.includes(job.status) : false,
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES DA API (RESTAURADAS)
// ============================================================================

/**
 * Sobe o arquivo .xlsx para o backend que dispara um job assíncrono.
 */
export async function startBackendImport(
  file: File,
  options?: { mode?: "single" | "batched"; entities?: string[] },
): Promise<{ job_id: string }> {
  const baseUrl = getApiBase();
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token ?? null;
  const fd = new FormData();
  fd.append("file", file);
  if (options?.mode) fd.append("mode", options.mode);
  if (options?.entities && options.entities.length > 0) {
    fd.append("entities", options.entities.join(","));
  }
  const res = await fetch(`${baseUrl}/v1/importacao/jobs`, {
    method: "POST",
    body: fd,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(
      payload?.error ?? payload?.message ?? `Falha ao enviar arquivo (HTTP ${res.status})`,
    );
  }
  return payload;
}

export async function cancelImportJob(jobId: string): Promise<void> {
  await apiRequest(`/v1/importacao/jobs/${jobId}`, { method: "DELETE" });
}

/** Recupera o job ATIVO mais recente do usuário (uma única chamada). */
export async function fetchActiveImportJob(): Promise<ImportJob | null> {
  try {
    const data = await apiRequest<{ job: ImportJob | null }>("/v1/importacao/jobs/active");
    return data.job;
  } catch {
    return null;
  }
}

/** Indica se a base ainda exige a primeira importação completa. */
export async function fetchImportStatus(): Promise<{ initialImportRequired: boolean }> {
  try {
    return await apiRequest<{ initialImportRequired: boolean }>("/v1/importacao/status");
  } catch {
    return { initialImportRequired: true };
  }
}