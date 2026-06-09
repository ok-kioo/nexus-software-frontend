import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { X, Send, RotateCcw, Loader2, AlertCircle, ChevronUp } from "lucide-react";
import { useCapeloChat, MAX_LENGTH } from "@/hooks/useCapeloChat";
import { NexusLogoMark } from "@/components/NexusLogoMark";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CapeloChatPanel({ open, onClose }: Props) {
  const {
    messages,
    loading,
    loadingMore,
    sending,
    hasMore,
    error,
    canRetry,
    sendMessage,
    retryLast,
    dismissError,
    clearConversation,
    loadMore,
  } = useCapeloChat(open);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevScrollHeightRef = useRef<number | null>(null);
  const firstIdRef = useRef<string | null>(null);

  // Auto-scroll para o fim quando há mensagens novas (não em prepend).
  useEffect(() => {
    if (!scrollRef.current) return;
    const currentFirst = messages[0]?.id ?? null;
    if (prevScrollHeightRef.current != null && firstIdRef.current !== currentFirst) {
      // Foi um prepend: preservar posição.
      // Tratado em useLayoutEffect abaixo.
    } else {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    firstIdRef.current = currentFirst;
  }, [messages, sending, open]);

  // Preserva posição de scroll após prepend de mensagens antigas.
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current != null && scrollRef.current) {
      const diff = scrollRef.current.scrollHeight - prevScrollHeightRef.current;
      scrollRef.current.scrollTop = diff;
      prevScrollHeightRef.current = null;
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => textareaRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleLoadMore = () => {
    if (scrollRef.current) {
      prevScrollHeightRef.current = scrollRef.current.scrollHeight;
    }
    void loadMore();
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    await sendMessage(text);
    textareaRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (!open) return null;

  const showCounter = input.length > MAX_LENGTH - 500;

  return (
    <div
      className={cn(
        "fixed z-50 bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden",
        "animate-fade-in-up",
        "bottom-4 right-4 sm:bottom-6 sm:right-6",
        "w-[calc(100vw-2rem)] max-w-[400px]",
        "h-[calc(100dvh-6rem)] max-h-[640px]",
      )}
      role="dialog"
      aria-label="Chat com o Capelo"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
          <NexusLogoMark className="w-5 h-5" imgClassName="brightness-0 invert" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-foreground leading-tight">Capelo</div>
          <div className="text-[11px] text-muted-foreground leading-tight">
            Assistente de planos de ação
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={clearConversation}
          title="Nova conversa"
          aria-label="Nova conversa"
          disabled={sending || messages.length === 0}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
          title="Fechar"
          aria-label="Fechar chat"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-background/40">
        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="h-8 text-xs"
            >
              {loadingMore ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
              Carregar mensagens anteriores
            </Button>
          </div>
        )}
        {loading && (
          <div className="flex justify-center text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando conversa…
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center py-8 px-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-3">
              <NexusLogoMark className="w-7 h-7" imgClassName="brightness-0 invert" />
            </div>
            <div className="font-semibold text-sm text-foreground mb-1">Olá! Sou o Capelo.</div>
            <p className="text-xs text-muted-foreground">
              Posso ajudar a formular planos de ação, sugerir estratégias, prazos e próximos
              passos. Conte-me a situação que você quer trabalhar.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] text-sm whitespace-pre-wrap break-words",
                m.role === "user"
                  ? "rounded-2xl rounded-br-sm px-3.5 py-2 bg-primary text-primary-foreground"
                  : "text-foreground",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
              </span>
              Capelo está pensando…
            </div>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="border-t border-destructive/30 bg-destructive/10 px-3 py-2 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-destructive">{error}</div>
          {canRetry && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={retryLast}
              disabled={sending}
            >
              Tentar novamente
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={dismissError}
            aria-label="Fechar aviso de erro"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-border p-3 bg-card">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Pergunte ao Capelo…"
            rows={1}
            maxLength={MAX_LENGTH}
            className="resize-none min-h-[40px] max-h-32 text-sm"
            disabled={sending}
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            aria-label="Enviar mensagem"
            className="h-10 w-10 shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[10px] text-muted-foreground">
            Enter envia · Shift+Enter quebra linha
          </span>
          {showCounter && (
            <span
              className={cn(
                "text-[10px] tabular-nums",
                input.length >= MAX_LENGTH ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {input.length}/{MAX_LENGTH}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default CapeloChatPanel;
