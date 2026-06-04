import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { friendlyAuthError } from "@/lib/authErrors";
import { Loader2, MailCheck } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOLDOWN_SECONDS = 30;

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const sendEmail = async () => {
    setSubmitting(true);
    const { error } = await requestPasswordReset(email, "/redefinir-senha");
    setSubmitting(false);
    if (error) {
      const friendly = friendlyAuthError(error.message);
      toast({ title: friendly.title, description: friendly.description, variant: "destructive" });
      return;
    }
    setSent(true);
    setCooldown(COOLDOWN_SECONDS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || cooldown > 0) return;
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setEmailError("Digite um e-mail válido (ex.: nome@empresa.com).");
      return;
    }
    setEmailError(null);
    setEmail(trimmed);
    await sendEmail();
  };

  const handleResend = async () => {
    if (cooldown > 0 || submitting) return;
    await sendEmail();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-xl">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Recuperar senha</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Enviaremos um link para você criar uma nova senha.
              </p>
            </div>
            {sent ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MailCheck className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold">Verifique seu e-mail</h2>
                  <p className="text-sm text-muted-foreground">
                    Se <strong className="text-foreground">{email}</strong> estiver cadastrado, você
                    receberá um link em instantes. Verifique também a caixa de spam. O link expira
                    em 1 hora.
                  </p>
                </div>
                <Button
                  onClick={handleResend}
                  disabled={cooldown > 0 || submitting}
                  variant="outline"
                  className="w-full h-11"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reenviando…
                    </span>
                  ) : cooldown > 0 ? (
                    `Reenviar em ${cooldown}s`
                  ) : (
                    "Reenviar e-mail"
                  )}
                </Button>
                <div className="space-y-2 text-center text-sm">
                  <Link to="/login" className="block text-primary font-medium hover:underline">
                    Voltar ao login
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Não recebeu nada? Peça a um administrador ou gestor para enviar um novo
                    convite.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <fieldset disabled={submitting} className="space-y-4 disabled:opacity-70">
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      required
                      aria-invalid={!!emailError}
                      className={`mt-1.5 bg-muted/30 h-11 ${
                        emailError ? "border-destructive focus-visible:ring-destructive" : ""
                      }`}
                    />
                    {emailError && (
                      <p className="mt-1.5 text-xs text-destructive">{emailError}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={submitting}>
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando…
                      </span>
                    ) : (
                      "Enviar link"
                    )}
                  </Button>
                  <p className="text-center text-sm">
                    <Link to="/login" className="text-primary font-medium hover:underline">
                      Voltar ao login
                    </Link>
                  </p>
                </fieldset>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}