import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, Monitor, Lock, Info, Eye, EyeOff } from "lucide-react";
import { updateMe, changeOwnPassword } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";

type PasswordInputProps = {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  id: string;
  placeholder: string;
};

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  id,
  placeholder,
}: PasswordInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 bg-muted/50 pr-10"
      />

      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
      >
        {show ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export default function Configuracoes() {
  const { user, role, refreshUser } = useAuth();
  const { mode, theme, setMode } = useTheme();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Sincroniza nome quando o user carrega (assíncrono).
  useEffect(() => {
    if (user?.name && !name) setName(user.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name]);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const isAdmin = role === "administrador";

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Erro", description: "Informe seu nome.", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    try {
      await updateMe({ name: name.trim() });
      await refreshUser();
      toast({ title: "Perfil atualizado", description: "Suas informações foram salvas." });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : (err as Error).message;
      toast({ title: "Erro", description: msg ?? "Falha ao salvar.", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!currentPassword) {
      toast({ title: "Erro", description: "Informe a senha atual.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 8 caracteres, com letras e números.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      await changeOwnPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Senha alterada", description: "Sua senha foi atualizada com sucesso." });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : (err as Error).message;
      toast({ title: "Erro", description: msg ?? "Falha ao alterar senha.", variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  const themeOptions = [
    { value: "light" as const, label: "Claro", icon: Sun },
    { value: "dark" as const, label: "Escuro", icon: Moon },
    { value: "auto" as const, label: "Automático", icon: Monitor },
  ];

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Gerencie seu perfil e preferências" />

      <div className="space-y-6 max-w-2xl">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil</CardTitle>
            {!isAdmin && (
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <Info className="h-3.5 w-3.5" />
                Campos bloqueados só podem ser alterados por um administrador.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 bg-muted/50" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  E-mail
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Input value={user?.email || ""} disabled className="mt-1.5 bg-muted/30 opacity-70 cursor-not-allowed" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  Cargo
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Input value={user?.role || ""} disabled className="mt-1.5 bg-muted/30 opacity-70 capitalize cursor-not-allowed" />
              </div>
              {/* Unit field: hidden for admin, read-only for others */}
              {!isAdmin && (
                <div>
                  <Label className="flex items-center gap-1.5">
                    Unidade
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <Input value="Bezerros/PE" disabled className="mt-1.5 bg-muted/30 opacity-70 cursor-not-allowed" />
                </div>
              )}
            </div>
            <Button onClick={handleSave} disabled={savingProfile}>
              {savingProfile ? "Salvando…" : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alterar Senha</CardTitle>
            <CardDescription className="text-xs">Mantenha sua conta segura atualizando sua senha regularmente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="currentPw">Senha Atual</Label>
                <PasswordInput id="currentPw" value={currentPassword} onChange={setCurrentPassword} show={showCurrentPw} onToggle={() => setShowCurrentPw(!showCurrentPw)} placeholder="Digite sua senha atual" />
              </div>
              <div>
                <Label htmlFor="newPw">Nova Senha</Label>
                <PasswordInput id="newPw" value={newPassword} onChange={setNewPassword} show={showNewPw} onToggle={() => setShowNewPw(!showNewPw)} placeholder="Mínimo 8 caracteres, letras e números" />
                {newPassword && (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) && (
                  <p className="text-xs text-destructive mt-1">Mínimo 8 caracteres, com letras e números</p>
                )}
              </div>
              <div>
                <Label htmlFor="confirmPw">Confirmar Nova Senha</Label>
                <PasswordInput id="confirmPw" value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPw} onToggle={() => setShowConfirmPw(!showConfirmPw)} placeholder="Repita a nova senha" />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive mt-1">As senhas não coincidem</p>
                )}
              </div>
            </div>
            <Button onClick={handlePasswordSave} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}>
              {savingPassword ? "Salvando..." : "Alterar Senha"}
            </Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aparência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((opt) => {
                const active = mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}
                    aria-label={`Tema ${opt.label}`}
                    aria-pressed={active}
                  >
                    <opt.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="rounded-md border border-border p-3 bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Tema ativo: <span className="font-medium text-foreground capitalize">{theme}</span>
                {mode === "auto" && " (detectado pelo sistema)"}
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
