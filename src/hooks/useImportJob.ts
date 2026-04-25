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

const TERMINAL: ImportJobStatus[] = ["completed", "failed", "cancelled"];

/**
 * Acompanha um job de importação em tempo real (Supabase Realtime) com
 * fallback de polling a cada 4s caso o canal não atualize.
 */
export function useImportJob(jobId: string | null) {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }
    let cancelled = false;
    setLoading(true);

    const fetchOnce = async () => {
      try {
        const data = await apiRequest<ImportJob>(`/v1/importacao/jobs/${jobId}`);
        if (!cancelled) {
          setJob(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOnce();

    const channel = supabase
      .channel(`import-job-${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "import_jobs", filter: `id=eq.${jobId}` },
        (payload) => {
          if (!cancelled) setJob(payload.new as ImportJob);
        },
      )
      .subscribe();

    const interval = setInterval(() => {
      if (cancelled) return;
      if (job && TERMINAL.includes(job.status)) return;
      fetchOnce();
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  return { job, loading, error, isTerminal: job ? TERMINAL.includes(job.status) : false };
}

export async function startBackendImport(file: File): Promise<{ job_id: string }> {
  const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token ?? null;
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${baseUrl}/v1/importacao/jobs`, {
    method: "POST",
    body: fd,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(payload?.error ?? `Falha ao enviar arquivo (HTTP ${res.status})`);
  }
  return payload;
}

export async function cancelImportJob(jobId: string): Promise<void> {
  await apiRequest(`/v1/importacao/jobs/${jobId}`, { method: "DELETE" });
}

/** Última job ativa ou recente do usuário, para o indicador da sidebar. */
export function useLatestImportJob(pollMs = 8000): ImportJob | null {
  const [latest, setLatest] = useState<ImportJob | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchLatest = async () => {
      try {
        const data = await apiRequest<{ rows: ImportJob[]; total: number }>(
          "/v1/importacao/jobs?page=1&pageSize=1",
        );
        if (!cancelled) setLatest(data.rows?.[0] ?? null);
      } catch {
        /* silencioso — indicador é não-crítico */
      }
    };
    fetchLatest();
    const id = setInterval(fetchLatest, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs]);

  return latest;
}