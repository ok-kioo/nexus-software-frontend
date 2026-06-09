import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api/client";
import { capeloApi, type CapeloMessage } from "@/lib/api/capelo";

export type { CapeloMessage } from "@/lib/api/capelo";

export const PAGE_SIZE = 30;
export const MAX_LENGTH = 4000;

function validate(content: string): string | null {
  if (!content) return "Mensagem não pode ser vazia";
  if (content.length > MAX_LENGTH) return `Mensagem excede ${MAX_LENGTH} caracteres`;
  return null;
}

function sanitize(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "");
}

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isNetworkError) return "Não foi possível conectar ao servidor.";
    if (err.status === 429) return "Muitas mensagens em pouco tempo. Aguarde alguns segundos.";
    if (err.status === 401) return "Sua sessão expirou. Faça login novamente.";
    if (err.status === 502 || err.status === 504) return err.message || "O Capelo está indisponível agora.";
    return err.message || "Erro ao falar com o Capelo.";
  }
  return err instanceof Error ? err.message : "Erro desconhecido";
}

export function useCapeloChat(enabled: boolean) {
  const { user } = useAuth();
  const userId = user?.id;
  const [messages, setMessages] = useState<CapeloMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
  const loadedRef = useRef(false);

  // Carga inicial: últimas PAGE_SIZE mensagens em ordem cronológica.
  useEffect(() => {
    if (!enabled || !userId || loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);
    capeloApi
      .list({ limit: PAGE_SIZE })
      .then((res) => {
        setMessages(res.rows);
        setHasMore(res.hasMore);
      })
      .catch((err) => {
        toast({
          title: "Erro ao carregar conversa",
          description: describeError(err),
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [enabled, userId]);

  const loadMore = useCallback(async () => {
    if (!userId || loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const res = await capeloApi.list({ limit: PAGE_SIZE, before: messages[0].created_at });
      setMessages((prev) => [...res.rows, ...prev]);
      setHasMore(res.hasMore);
    } catch (err) {
      toast({
        title: "Erro ao carregar mensagens anteriores",
        description: describeError(err),
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  }, [userId, loadingMore, hasMore, messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const cleaned = sanitize(text).trim();
      const err = validate(cleaned);
      if (err) {
        toast({
          title: "Mensagem inválida",
          description: err,
          variant: "destructive",
        });
        return;
      }
      if (!userId || sending) return;
      setSending(true);
      setError(null);



      const content = cleaned;
      const tempId = `tmp-${Date.now()}`;
      const optimistic: CapeloMessage = {
        id: tempId,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, optimistic]);

      try {
        const { user: userMsg, assistant } = await capeloApi.send(content);
        setMessages((m) => {
          const without = m.filter((x) => x.id !== tempId);
          return [...without, userMsg, assistant];
        });
        setLastFailedInput(null);
      } catch (err) {
        // Mensagem do usuário pode ter sido persistida (erro veio do n8n).
        // Removemos a mensagem otimista — quando reabrir/carregar o histórico ela aparece.
        setMessages((m) => m.filter((x) => x.id !== tempId));
        setError(describeError(err));
        setLastFailedInput(content);
        // Não logar conteúdo da mensagem; apenas o status.
        if (err instanceof ApiError) {
          // eslint-disable-next-line no-console
          console.warn("[capelo] send failed", { status: err.status });
        }
      } finally {
        setSending(false);
      }
    },
    [userId, sending],
  );

  const retryLast = useCallback(() => {
    if (lastFailedInput) {
      const text = lastFailedInput;
      setLastFailedInput(null);
      void sendMessage(text);
    }
  }, [lastFailedInput, sendMessage]);

  const dismissError = useCallback(() => {
    setError(null);
    setLastFailedInput(null);
  }, []);

  const clearConversation = useCallback(async () => {
    if (!userId) return;
    try {
      await capeloApi.clear();
      setMessages([]);
      setHasMore(false);
      setError(null);
      setLastFailedInput(null);
    } catch (err) {
      toast({
        title: "Erro ao limpar conversa",
        description: describeError(err),
        variant: "destructive",
      });
    }
  }, [userId]);

  return {
    messages,
    loading,
    loadingMore,
    sending,
    hasMore,
    error,
    canRetry: !!lastFailedInput,
    sendMessage,
    retryLast,
    dismissError,
    clearConversation,
    loadMore,
  };
}
