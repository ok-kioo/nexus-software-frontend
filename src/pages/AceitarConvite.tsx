import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { acceptInvite, fetchInviteByToken } from "@/lib/api/invites";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PasswordStrength, isPasswordValid } from "@/components/auth/PasswordStrength";
import { AlertTriangle, XCircle, Clock, Ban, Loader2, Eye, EyeOff } from "lucide-react";
import { friendlyAuthError } from "@/lib/authErrors";

type InviteInfo = {
  email: string;
  role: "administrador" | "gestor" | "professor";
  status: string;
  expires_at: string;
};

type ErrorKind = "missing" | "invalid" | "expired" | "used" | "cancelled" | "network";

const ERROR_META: Record<ErrorKind, { title: string; message: string; action: string; icon: React.ElementType; tone: string }> = {
  missing:   { title: "Link de convite incompleto", message: "O endereço aberto não contém o código do convite. Isso costuma acontecer quando o link é copiado pela metade ou cortado pelo cliente de e-mail.", action: "Abra o link completo enviado no e-mail ou peça a quem te convidou para reenviar.", icon: AlertTriangle, tone: "text-destructive" },
  invalid:   { title: "Convite não encontrado", message: "Este link não corresponde a nenhum convite ativo no sistema.", action: "Confirme com quem te convidou se o link está correto ou solicite um novo convite.", icon: XCircle,        tone: "text-destructive" },
  expired:   { title: "Convite expirado",    message: "Este convite já passou da data de validade e não pode mais ser usado.", action: "Peça a um administrador ou gestor para gerar um novo convite para o seu e-mail.", icon: Clock,         tone: "text-amber-600 dark:text-amber-400" },
  used:      { title: "Convite já utilizado", message: "Este convite já foi aceito anteriormente — sua conta já existe.", action: "Use a tela de login com o e-mail e a senha cadastrados. Se esqueceu a senha, use \"Esqueci minha senha\".", icon: Ban,           tone: "text-muted-foreground" },
  cancelled: { title: "Convite cancelado",   message: "Este convite foi cancelado por um administrador antes de ser aceito.", action: "Entre em contato com a pessoa que te convidou para receber um novo convite.", icon: Ban,           tone: "text-destructive" },
  network:   { title: "Falha ao validar convite", message: "Não conseguimos confirmar este convite no servidor agora.", action: "Verifique sua conexão com a internet e tente novamente em instantes.", icon: AlertTriangle, tone: "text-destructive" },
};

export default function AceitarConvite() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordsMismatch = confirm.length > 0 && password !== confirm;
  const passwordsMatch = confirm.length > 0 && password === confirm && password.length > 0;

  const validateToken = async () => {
    setLoading(true);
    setErrorKind(null);
    setInvite(null);

    if (!token) {
      setErrorKind("missing");
      setLoading(false);
      return;
    }

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(token)) {
      setErrorKind("invalid");
      setLoading(false);
      return;
    }

    try {
      const inv = (await fetchInviteByToken(token)).invite;

      if (inv.status === "cancelado") setErrorKind("cancelled");
      else if (inv.status === "aceito") setErrorKind("used");
      else if (inv.status !== "pendente") setErrorKind("invalid");
      else if (new Date(inv.expires_at).getTime() < Date.now()) setErrorKind("expired");
      else setInvite(inv);
    } catch (error) {
      if (error instanceof Error && error.message === "invalid") setErrorKind("invalid");
      else if ((error as { status?: number } | undefined)?.status === 404) setErrorKind("invalid");
      else setErrorKind("network");
    }

    setLoading(false);
  };

  useEffect(() => {
    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!invite) {
      toast({ title: "Convite inválido", description: "Não é possível concluir sem um convite válido.", variant: "destructive" });
      return;
    }
    if (!name.trim() || name.trim().length < 2) {
      toast({ title: "Informe seu nome", description: "Digite seu nome completo com pelo menos 2 caracteres.", variant: "destructive" });
      return;
    }
    if (!isPasswordValid(password)) {
      toast({ title: "Senha não atende aos requisitos", description: "Use ao menos 8 caracteres incluindo maiúsculas, minúsculas, números e símbolos.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "As senhas não coincidem", description: "Digite a mesma senha nos dois campos para confirmar.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await acceptInvite({ token, name: name.trim(), password });
    } catch (error) {
      const friendly = friendlyAuthError(error instanceof Error ? error.message : "Erro ao criar conta.");
      toast({ title: friendly.title, description: friendly.description, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    toast({ title: "Conta criada!", description: "Faça login para continuar." });
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 bg-primary/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 bg-accent/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <Card className="shadow-xl">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">N</div>
              </div>
              <h1 className="text-2xl font-bold">
                <span className="text-primary">Nex</span>
                <span className="text-accent">us</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-3">Aceitar convite</p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-sm">Validando convite…</p>
              </div>
            ) : errorKind ? (
              (() => {
                const meta = ERROR_META[errorKind];
                const Icon = meta.icon;
                const canRetry = errorKind === "network";
                return (
                  <div className="space-y-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                        <Icon className={`h-6 w-6 ${meta.tone}`} />
                      </div>
                      <h2 className="text-base font-semibold">{meta.title}</h2>
                      <p className="text-sm text-muted-foreground">{meta.message}</p>
                      <div className="mt-1 w-full rounded-md border border-border/60 bg-muted/30 p-3 text-left text-xs text-foreground">
                        <p className="font-medium mb-1">O que fazer agora</p>
                        <p className="text-muted-foreground">{meta.action}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {canRetry && (
                        <Button onClick={validateToken} className="w-full h-11">Tentar novamente</Button>
                      )}
                      <Link to="/login" className="text-primary text-sm font-medium hover:underline">
                        Voltar ao login
                      </Link>
                    </div>
                  </div>
                );
              })()
            ) : invite ? (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <fieldset disabled={submitting} className="space-y-4 disabled:opacity-70">
                  <div className="rounded-md bg-muted/40 p-3 text-xs">
                    <p><span className="text-muted-foreground">E-mail:</span> <strong>{invite.email}</strong></p>
                    <p><span className="text-muted-foreground">Perfil:</span> <strong className="capitalize">{invite.role}</strong></p>
                  </div>
                  <div>
                    <Label htmlFor="name">Seu nome</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} className="mt-1.5 bg-muted/30 h-11" />
                  </div>
                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-muted/30 h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="mt-2"><PasswordStrength password={password} /></div>
                  </div>
                  <div>
                    <Label htmlFor="confirm">Confirmar senha</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="confirm"
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        aria-invalid={passwordsMismatch}
                        aria-describedby="confirm-help"
                        className={`bg-muted/30 h-11 pr-10 ${passwordsMismatch ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordsMismatch && (
                      <p id="confirm-help" className="mt-1.5 text-xs text-destructive">
                        As senhas não coincidem. Digite a mesma senha nos dois campos.
                      </p>
                    )}
                    {passwordsMatch && (
                      <p id="confirm-help" className="mt-1.5 text-xs text-primary">
                        As senhas coincidem.
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={submitting || passwordsMismatch || !password || !confirm || !name.trim()}
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Criando conta…
                      </span>
                    ) : (
                      "Criar conta"
                    )}
                  </Button>
                  {submitting && (
                    <p className="text-center text-xs text-muted-foreground">
                      Estamos configurando seu acesso. Isso pode levar alguns segundos — não feche esta janela.
                    </p>
                  )}
                </fieldset>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
