import { supabase } from "./supabase";

export interface SubscribeOptions {
  schema?: string;
  table: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
}

/**
 * Inscreve-se em mudanças de uma tabela via Realtime do Lovable Cloud.
 * RLS continua sendo aplicada — o canal usa o JWT da sessão atual.
 * Retorna uma função para cancelar a inscrição.
 */
export function subscribeToTable(
  channelName: string,
  opts: SubscribeOptions,
  handler: () => void,
): () => void {
  const channel = supabase
    .channel(channelName)
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: opts.event ?? "*", schema: opts.schema ?? "public", table: opts.table },
      handler,
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
