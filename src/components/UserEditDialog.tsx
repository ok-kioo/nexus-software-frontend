import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { fetchUserById, updateUser } from "@/lib/api/users";
import { listResource } from "@/lib/api/cadastros";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/data/mockData";
import { ApiError } from "@/lib/api/client";

interface TurmaRow {
  id: string;
  nome_turma: string;
}

interface Props {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "administrador", label: "Administrador" },
  { value: "gestor", label: "Gestor" },
  { value: "professor", label: "Professor" },
];

export function UserEditDialog({ userId, open, onOpenChange, onSaved }: Props) {
  const { role: myRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [role, setRole] = useState<UserRole>("professor");
  const [turmas, setTurmas] = useState<TurmaRow[]>([]);
  const [selectedTurmas, setSelectedTurmas] = useState<Set<string>>(new Set());

  const isAdmin = myRole === "administrador";

  useEffect(() => {
    if (!open || !userId) return;
    let active = true;
    setLoading(true);
    Promise.all([
      fetchUserById(userId),
      listResource<TurmaRow & { status: string }>("turmas", {
        pageSize: 500,
        filters: { status: "ativa" },
      }),
    ])
      .then(([detail, turmasRes]) => {
        if (!active) return;
        setName(detail.name);
        setEmail(detail.email);
        setOriginalEmail(detail.email);
        setRole((detail.role as UserRole) ?? "professor");
        setSelectedTurmas(new Set(detail.turma_ids));
        setTurmas(turmasRes.rows.map((t) => ({ id: t.id, nome_turma: t.nome_turma })));
      })
      .catch((err) => {
        toast.error((err as Error).message ?? "Falha ao carregar usuário.");
        onOpenChange(false);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, userId, onOpenChange]);

  const toggleTurma = (id: string) => {
    setSelectedTurmas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!userId) return;
    if (!name.trim()) {
      toast.error("Informe o nome.");
      return;
    }
    setSaving(true);
    try {
      const patch: Record<string, unknown> = { name: name.trim(), role };
      if (isAdmin && email.trim() && email.trim() !== originalEmail) {
        patch.email = email.trim();
      }
      if (role === "professor") {
        patch.turma_ids = Array.from(selectedTurmas);
      } else {
        patch.turma_ids = [];
      }
      await updateUser(userId, patch);
      toast.success("Usuário atualizado.");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : (err as Error).message ?? "Falha ao salvar.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>
            Altere os dados do usuário. Apenas administradores podem trocar e-mail.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isAdmin}
              />
              {!isAdmin && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Somente administradores podem alterar o e-mail.
                </p>
              )}
            </div>

            <div>
              <Label>Perfil</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.filter((o) => {
                    // Gestor só pode atribuir professor.
                    if (myRole === "gestor") return o.value === "professor";
                    return true;
                  }).map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {role === "professor" && (
              <div>
                <Label>Turmas atribuídas</Label>
                <ScrollArea className="h-44 rounded-md border border-border p-2 mt-1.5">
                  {turmas.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      Nenhuma turma ativa cadastrada.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {turmas.map((t) => (
                        <label
                          key={t.id}
                          className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/40 px-2 py-1 rounded"
                        >
                          <Checkbox
                            checked={selectedTurmas.has(t.id)}
                            onCheckedChange={() => toggleTurma(t.id)}
                          />
                          <span>{t.nome_turma}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {selectedTurmas.size} turma(s) selecionada(s).
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
