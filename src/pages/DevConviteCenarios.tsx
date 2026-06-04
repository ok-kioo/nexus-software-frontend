import { useState } from "react";
import { createTestInvite, deleteTestInvites } from "@/lib/api/invites";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, Trash2, Copy } from "lucide-react";
import { PageHeader } from "@/components/reusable/PageHeader";

type Scenario =
  | { id: "missing"; kind: "static"; title: string; expectedTitle: string; expectedAction: string; description: string; url: string }
  | { id: "invalid-format"; kind: "static"; title: string; expectedTitle: string; expectedAction: string; description: string; url: string }
  | { id: "nonexistent"; kind: "static"; title: string; expectedTitle: string; expectedAction: string; description: string; url: string }
  | { id: "expirado" | "cancelado" | "aceito"; kind: "backend"; title: string; expectedTitle: string; expectedAction: string; description: string };

const SCENARIOS: Scenario[] = [
  {
    id: "missing",
    kind: "static",
    title: "1. Token ausente",
    description: "Abre /aceitar-convite sem nenhum parâmetro de token na URL.",
    expectedTitle: "Link de convite incompleto",
    expectedAction: "Mensagem orientando a abrir o link completo do e-mail.",
    url: "/aceitar-convite",
  },
  {
    id: "invalid-format",
    kind: "static",
    title: "2. Token com formato inválido",
    description: "Abre /aceitar-convite com um token que não é um UUID válido.",
    expectedTitle: "Convite não encontrado",
    expectedAction: "Card vermelho pedindo para conferir o link com quem convidou.",
    url: "/aceitar-convite?token=abc-nao-uuid",
  },
  {
    id: "nonexistent",
    kind: "static",
    title: "3. Token inexistente (UUID válido)",
    description: "UUID com formato correto mas que não corresponde a nenhum convite.",
    expectedTitle: "Convite não encontrado",
    expectedAction: "Mesmo card de convite não encontrado.",
    url: "/aceitar-convite?token=00000000-0000-0000-0000-000000000000",
  },
  {
    id: "expirado",
    kind: "backend",
    title: "4. Convite expirado",
    description: "Cria no banco um convite real com expires_at = agora - 1h.",
    expectedTitle: "Convite expirado",
    expectedAction: "Card âmbar pedindo para solicitar um novo convite.",
  },
  {
    id: "cancelado",
    kind: "backend",
    title: "5. Convite cancelado",
    description: "Cria no banco um convite com status = 'cancelado'.",
    expectedTitle: "Convite cancelado",
    expectedAction: "Card vermelho orientando a contatar quem convidou.",
  },
  {
    id: "aceito",
    kind: "backend",
    title: "6. Convite já utilizado",
    description: "Cria um convite com status = 'aceito' (já consumido).",
    expectedTitle: "Convite já utilizado",
    expectedAction: "Mensagem dizendo que a conta já existe e indicando o login.",
  },
];

export default function DevConviteCenarios() {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [generated, setGenerated] = useState<{ scenario: string; url: string }[]>([]);

  const openStatic = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const generateAndOpen = async (scenario: "expirado" | "cancelado" | "aceito") => {
    setBusy(scenario);
    try {
      const data = await createTestInvite(scenario);
      if (!data?.accept_url) {
        toast({
          title: "Falha ao gerar convite",
          description: "Erro desconhecido.",
          variant: "destructive",
        });
        return;
      }
      setGenerated((prev) => [{ scenario, url: data.accept_url }, ...prev].slice(0, 10));
      window.open(data.accept_url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({
        title: "Falha ao gerar convite",
        description: error instanceof Error ? error.message : "Erro desconhecido.",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const cleanup = async () => {
    setCleaning(true);
    try {
      const result = await deleteTestInvites();
      setGenerated([]);
      toast({
        title: "Convites de teste removidos",
        description: `${result.deleted ?? 0} registro(s) apagado(s).`,
      });
    } finally {
      setCleaning(false);
    }
  };

  const copy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="QA — Cenários de convite"
        subtitle="Página interna para validar visualmente as mensagens da tela de aceitar convite. Os convites gerados ficam marcados como teste e podem ser apagados em lote."
        action={
          <Button variant="outline" onClick={cleanup} disabled={cleaning}>
            {cleaning ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Limpar convites de teste
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {SCENARIOS.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="text-base">{s.title}</CardTitle>
              <CardDescription>{s.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs space-y-1">
                <p>
                  <span className="text-muted-foreground">Esperado:</span>{" "}
                  <strong>{s.expectedTitle}</strong>
                </p>
                <p className="text-muted-foreground">{s.expectedAction}</p>
              </div>
              {s.kind === "static" ? (
                <Button onClick={() => openStatic(s.url)} className="w-full" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em nova aba
                </Button>
              ) : (
                <Button
                  onClick={() => generateAndOpen(s.id)}
                  disabled={busy === s.id}
                  className="w-full"
                >
                  {busy === s.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Gerando…
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Gerar e abrir
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {generated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Links gerados nesta sessão</CardTitle>
            <CardDescription>Útil para reabrir ou compartilhar com outro QA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {generated.map((g, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border border-border/60 p-2 text-xs"
              >
                <span className="font-medium capitalize w-20 shrink-0">{g.scenario}</span>
                <code className="flex-1 truncate text-muted-foreground">{g.url}</code>
                <Button size="sm" variant="ghost" onClick={() => copy(g.url)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(g.url, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}