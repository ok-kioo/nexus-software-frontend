import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, Monitor, Lock, Info, Eye, EyeOff } from "lucide-react";

export default function Configuracoes() {
  const { user, role } = useAuth();
  const { mode, theme, setMode } = useTheme();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [notifications, setNotifications] = useState({
    evasao: true, frequencia: true, desempenho: false, importacoes: true,
  });

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const isAdmin = role === "administrador";

  const handleSave = () => {
    toast({ title: "Configurações salvas", description: "Suas preferências foram atualizadas." });
  };

  const handlePasswordSave = async () => {
    if (!currentPassword) {
      toast({ title: "Erro", description: "Informe a senha atual.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Erro", description: "A nova senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    await new Promise((r) => setTimeout(r, 800));
    setSavingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast({ title: "Senha alterada", description: "Sua senha foi atualizada com sucesso." });
  };

  const themeOptions = [
    { value: "light" as const, label: "Claro", icon: Sun },
    { value: "dark" as const, label: "Escuro", icon: Moon },
    { value: "auto" as const, label: "Automático", icon: Monitor },
  ];

  const notificationItems = role === "professor"
    ? [{ key: "frequencia" as const, label: "Frequência Crítica" }]
    : [
        { key: "evasao" as const, label: "Risco de Evasão" },
        { key: "frequencia" as const, label: "Frequência Crítica" },
        { key: "desempenho" as const, label: "Queda de Desempenho" },
        { key: "importacoes" as const, label: "Novas Importações" },
      ];

  const PasswordInput = ({ value, onChange, show, onToggle, id, placeholder }: {
    value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; id: string; placeholder: string;
  }) => (
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
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

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
            <Button onClick={handleSave}>
              Salvar Alterações
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
                <PasswordInput id="newPw" value={newPassword} onChange={setNewPassword} show={showNewPw} onToggle={() => setShowNewPw(!showNewPw)} placeholder="Mínimo 6 caracteres" />
                {newPassword && newPassword.length < 6 && (
                  <p className="text-xs text-destructive mt-1">Mínimo de 6 caracteres</p>
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

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <Label htmlFor={item.key}>{item.label}</Label>
                <Switch
                  id={item.key}
                  checked={notifications[item.key]}
                  onCheckedChange={(v) => setNotifications((prev) => ({ ...prev, [item.key]: v }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Danger zone — admin only */}
        {isAdmin && (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Zona de perigo</CardTitle>
              <CardDescription>Esta ação irá limpar todos os dados de demonstração.</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Limpar dados de demonstração</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => toast({ title: "Dados limpos", description: "Os dados de demonstração foram removidos." })}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
