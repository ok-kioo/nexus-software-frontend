import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const { login, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);
    if (result.ok) {
      navigate("/");
    } else {
      toast({
        title: "Não foi possível entrar",
        description: result.error || "Verifique seu e-mail e senha e tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthLayout
      subtitle="Plataforma de Monitoramento Acadêmico"
      footer={
        <p className="text-[11px] text-muted-foreground text-center">
          O acesso é por convite. Solicite ao administrador ou ao seu gestor.
        </p>
      }
    >
      {authError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Servidor indisponível</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed flex flex-col items-start gap-1">
            <span>{authError}</span>
            <button
              type="button"
              onClick={clearAuthError}
              className="underline hover:no-underline text-left"
            >
              Fechar
            </button>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <fieldset disabled={submitting} className="space-y-4 disabled:opacity-70">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              ref={emailRef}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 bg-background/40 backdrop-blur-sm h-11"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                to="/esqueci-senha"
                className="text-xs text-primary hover:underline"
                tabIndex={submitting ? -1 : 0}
              >
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative mt-1.5">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={(e) => setCapsLock(e.getModifierState && e.getModifierState("CapsLock"))}
                onKeyDown={(e) => setCapsLock(e.getModifierState && e.getModifierState("CapsLock"))}
                className="bg-background/40 backdrop-blur-sm h-11 pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {capsLock && (
              <p className="mt-1.5 text-xs text-warning-foreground bg-warning/30 border border-warning/40 rounded-md px-2 py-1 inline-flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Caps Lock está ativo
              </p>
            )}
          </div>
          <Button type="submit" className="w-full h-11" disabled={submitting}>
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando…
              </span>
            ) : (
              "Entrar"
            )}
          </Button>
        </fieldset>
      </form>
    </AuthLayout>
  );
}
