import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthChange, getSession, updatePassword, signOut } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PasswordStrength, isPasswordValid } from "@/components/auth/PasswordStrength";
import { friendlyAuthError } from "@/lib/authErrors";
import { Loader2, Eye, EyeOff, AlertTriangle } from "lucide-react";

const READY_TIMEOUT_MS = 3000;

export default function RedefinirSenha() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordsMismatch = confirm.length > 0 && password !== confirm;
  const passwordsMatch = confirm.length > 0 && password === confirm && password.length > 0;

  useEffect(() => {
    let resolved = false;
    const unsubscribe = onAuthChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        resolved = true;
        setReady(true);
      }
    });
    getSession().then((session) => {
      if (session) {
        resolved = true;
        setReady(true);
      }
    });
    const timer = setTimeout(() => {
      if (!resolved) setLinkInvalid(true);
    }, READY_TIMEOUT_MS);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!isPasswordValid(password)) {
      toast({
        title: "Senha não atende aos requisitos",
        description: "Use ao menos 8 caracteres com letras, números e símbolos.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirm) {
      toast({
        title: "As senhas não coincidem",
        description: "Digite a mesma senha nos dois campos.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) {
      const friendly = friendlyAuthError(error.message);
      toast({ title: friendly.title, description: friendly.description, variant: "destructive" });
      return;
    }
    toast({ title: "Senha atualizada!", description: "Faça login com a nova senha." });
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-xl">
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-center mb-6">Definir nova senha</h1>

            {linkInvalid && !ready ? (
              <div className="space-y-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  <h2 className="text-base font-semibold">Link inválido ou expirado</h2>
                  <p className="text-sm text-muted-foreground">
                    Este link de redefinição não é mais válido. Eles costumam expirar em 1 hora ou
                    quando outro link é solicitado depois.
                  </p>
                  <div className="mt-1 w-full rounded-md border border-border/60 bg-muted/30 p-3 text-left text-xs">
                    <p className="font-medium mb-1">O que fazer agora</p>
                    <p className="text-muted-foreground">
                      Solicite um novo link de redefinição informando seu e-mail.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    to="/esqueci-senha"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Solicitar novo link
                  </Link>
                  <Link to="/login" className="text-primary text-sm font-medium hover:underline">
                    Voltar ao login
                  </Link>
                </div>
              </div>
            ) : !ready ? (
              <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-sm">Validando link…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <fieldset disabled={submitting} className="space-y-4 disabled:opacity-70">
                  <div>
                    <Label htmlFor="pw">Nova senha</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="pw"
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
                    <Label htmlFor="confirm">Confirmar nova senha</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="confirm"
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        aria-invalid={passwordsMismatch}
                        aria-describedby="confirm-help"
                        className={`bg-muted/30 h-11 pr-10 ${
                          passwordsMismatch ? "border-destructive focus-visible:ring-destructive" : ""
                        }`}
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
                        As senhas não coincidem.
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
                    disabled={submitting || passwordsMismatch || !password || !confirm}
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando…
                      </span>
                    ) : (
                      "Salvar nova senha"
                    )}
                  </Button>
                </fieldset>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}