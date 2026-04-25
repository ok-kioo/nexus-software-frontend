import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 bg-primary/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 bg-accent/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
        <Card className="shadow-xl">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                  N
                </div>
              </div>
              <h1 className="text-3xl font-bold">
                <span className="text-primary">Nex</span>
                <span className="text-accent">us</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-4">Plataforma de Monitoramento Acadêmico</p>
            </div>

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
                    className="mt-1.5 bg-muted/30 h-11"
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
                      className="bg-muted/30 h-11 pr-11"
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
          </CardContent>
          <Separator />
          <CardFooter className="flex-col p-6 pt-4">
            <p className="text-[11px] text-muted-foreground text-center">
              O acesso é por convite. Solicite ao administrador ou ao seu gestor.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
