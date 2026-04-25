import { useEffect, useMemo, useState } from "react";
import { Plus, Mail, Copy, Trash2, RefreshCw, ExternalLink, Send, Link2, MessageCircle, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { createInvite, fetchInvites, resendInvite, cancelInvite as cancelInviteApi } from "@/lib/api/invites";
import { listResource } from "@/lib/api/cadastros";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/data/mockData";

interface InviteRow {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  expires_at: string;
  created_at: string;
  token: string;
  turma_ids: string[];
}

interface TurmaRow {
  id: string;
  nome_turma: string;
}

const roleLabel: Record<UserRole, string> = {
  administrador: "Administrador",
  gestor: "Gestor",
  professor: "Professor",
};

const statusStyles: Record<string, string> = {
  pendente: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  aceito: "bg-green-500/15 text-green-600 border-green-500/30",
  expirado: "bg-muted text-muted-foreground border-border",
  cancelado: "bg-destructive/10 text-destructive border-destructive/30",
};

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  aceito: "Aceito",
  expirado: "Expirado",
  cancelado: "Cancelado",
};

const statusIcon: Record<string, React.ElementType> = {
  pendente: Clock,
  aceito: CheckCircle2,
  expirado: AlertTriangle,
  cancelado: XCircle,
};

/** Devolve o status efetivo: convite pendente com expires_at no passado vira "expirado". */
function effectiveStatus(status: string, expiresAt: string): string {
  if (status === "pendente" && new Date(expiresAt).getTime() < Date.now()) return "expirado";
  return status;
}

/** "em 2 dias", "em 5 horas", "expirou há 1 dia". */
function formatRelative(expiresAt: string): { label: string; expired: boolean; soon: boolean } {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  const expired = diffMs <= 0;
  const abs = Math.abs(diffMs);
  const minutes = Math.floor(abs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let label = "";
  if (days >= 1) label = `${days} dia${days > 1 ? "s" : ""}`;
  else if (hours >= 1) label = `${hours} hora${hours > 1 ? "s" : ""}`;
  else label = `${Math.max(minutes, 1)} min`;

  return {
    label: expired ? `expirou há ${label}` : `em ${label}`,
    expired,
    soon: !expired && diffMs <= 48 * 60 * 60 * 1000,
  };
}

export default function Convites() {
  const { role } = useAuth();
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [turmas, setTurmas] = useState<TurmaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; email: string; url: string; expiresAt?: string }>({
    open: false,
    email: "",
    url: "",
  });
  const [sendStatus, setSendStatus] = useState<{ sent: boolean; error?: string } | null>(null);

  const [form, setForm] = useState<{ email: string; role: UserRole; turma_ids: string[] }>({
    email: "",
    role: "professor",
    turma_ids: [],
  });

  const allowedRoles: UserRole[] = role === "administrador"
    ? ["administrador", "gestor", "professor"]
    : ["professor"];

  const load = async () => {
    setLoading(true);
    try {
      const [invRes, turRes] = await Promise.all([
        fetchInvites(),
        listResource<TurmaRow & { status: string }>("turmas", { pageSize: 200, filters: { status: "ativa" } }),
      ]);
      setInvites((invRes.rows ?? []) as InviteRow[]);
      setTurmas(((turRes.rows ?? []) as TurmaRow[]).sort((a, b) => a.nome_turma.localeCompare(b.nome_turma)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar convites");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showLink = (
    email: string,
    url: string,
    expiresAt?: string,
    status?: { sent: boolean; error?: string },
  ) => {
    setLinkDialog({ open: true, email, url, expiresAt });
    setSendStatus(status ?? null);
  };

  const handleSubmit = async () => {
    if (!form.email) { toast.error("Informe o e-mail"); return; }
    setSubmitting(true);
    let data: { accept_url?: string; expires_at?: string; email_sent?: boolean; email_error?: string } | null = null;
    try {
      data = await createInvite({
        email: form.email,
        role: form.role,
        turma_ids: form.role === "professor" ? form.turma_ids : [],
      });
    } catch (error) {
      setSubmitting(false);
      toast.error(error instanceof Error ? error.message : "Falha ao enviar convite");
      return;
    }
    setSubmitting(false);
    const acceptUrl = data?.accept_url;
    const expiresAt = data?.expires_at;
    const emailSent = data?.email_sent;
    const emailError = data?.email_error;
    if (emailSent) {
      toast.success(`E-mail enviado para ${form.email}`);
    } else {
      toast.warning("Convite criado, mas o e-mail não foi enviado", {
        description: emailError ?? "Compartilhe o link manualmente.",
      });
    }
    if (acceptUrl) showLink(form.email, acceptUrl, expiresAt, { sent: !!emailSent, error: emailError });
    setOpen(false);
    setForm({ email: "", role: allowedRoles[0], turma_ids: [] });
    load();
  };

  const handleResend = async (invite: InviteRow) => {
    setResendingId(invite.id);
    let data: { accept_url?: string; expires_at?: string; email_sent?: boolean; email_error?: string } | null = null;
    try {
      data = await resendInvite(invite.id, { email: invite.email, role: invite.role });
    } catch (error) {
      setResendingId(null);
      toast.error(error instanceof Error ? error.message : "Falha ao reenviar convite");
      return;
    }
    setResendingId(null);
    const acceptUrl = data?.accept_url;
    const expiresAt = data?.expires_at;
    const emailSent = data?.email_sent;
    const emailError = data?.email_error;
    if (emailSent) {
      toast.success(`E-mail reenviado para ${invite.email} — prazo renovado por 7 dias`);
    } else {
      toast.warning("Convite renovado, mas o e-mail não foi enviado", {
        description: emailError ?? "Compartilhe o link manualmente.",
      });
    }
    if (acceptUrl) showLink(invite.email, acceptUrl, expiresAt, { sent: !!emailSent, error: emailError });
    load();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/aceitar-convite?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };

  const buildAcceptUrl = (token: string) =>
    `${window.location.origin}/aceitar-convite?token=${token}`;

  const cancelInvite = async (id: string) => {
    try {
      await cancelInviteApi(id);
      toast.success("Convite cancelado");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao cancelar convite");
    }
  };

  const turmaName = useMemo(() => {
    const map = new Map(turmas.map((t) => [t.id, t.nome_turma]));
    return (id: string) => map.get(id) ?? "—";
  }, [turmas]);

  return (
    <div>
      <PageHeader
        title="Convites"
        subtitle="Convide novos usuários por e-mail"
        action={
          <Button onClick={() => { setForm({ email: "", role: allowedRoles[0], turma_ids: [] }); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Novo convite
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
          ) : invites.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum convite enviado ainda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Turmas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((i) => {
                  const eff = effectiveStatus(i.status, i.expires_at);
                  const StatusIcon = statusIcon[eff] ?? Clock;
                  const rel = formatRelative(i.expires_at);
                  const showSoon = eff === "pendente" && rel.soon;
                  return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{roleLabel[i.role]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {i.turma_ids?.length ? i.turma_ids.map(turmaName).join(", ") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className={`text-[10px] gap-1 ${statusStyles[eff] ?? ""}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusLabel[eff] ?? eff}
                        </Badge>
                        {showSoon && (
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1 bg-amber-500/15 text-amber-700 border-amber-500/40 dark:text-amber-400"
                            title="Este convite expirará em breve"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Expira em breve
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col">
                        <span className="text-foreground">
                          {new Date(i.expires_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span
                          className={
                            rel.expired
                              ? "text-destructive"
                              : showSoon
                              ? "text-amber-600 dark:text-amber-400 font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {rel.label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {eff === "pendente" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => showLink(i.email, buildAcceptUrl(i.token), i.expires_at)}
                              title="Ver link de aceite"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResend(i)}
                              disabled={resendingId === i.id}
                              title="Reenviar (renova prazo)"
                            >
                              {resendingId === i.id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => cancelInvite(i.id)} title="Cancelar">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {i.status === "expirado" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResend(i)}
                            disabled={resendingId === i.id}
                            title="Reenviar (gera novo prazo)"
                          >
                            {resendingId === i.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo convite</DialogTitle>
            <DialogDescription>
              {role === "gestor"
                ? "Como gestor, você pode convidar professores e atribuir turmas."
                : "Selecione o perfil e, opcionalmente, as turmas para professores."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>E-mail *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 bg-muted/30" />
            </div>
            <div>
              <Label>Perfil *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole, turma_ids: [] })}>
                <SelectTrigger className="mt-1.5 bg-muted/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allowedRoles.map((r) => (
                    <SelectItem key={r} value={r}>{roleLabel[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.role === "professor" && (
              <div>
                <Label>Turmas (opcional)</Label>
                <ScrollArea className="mt-1.5 h-40 rounded-md border bg-muted/20 p-2">
                  {turmas.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">Nenhuma turma ativa cadastrada.</p>
                  ) : turmas.map((t) => {
                    const checked = form.turma_ids.includes(t.id);
                    return (
                      <label key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/40 cursor-pointer">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => {
                            setForm((f) => ({
                              ...f,
                              turma_ids: c ? [...f.turma_ids, t.id] : f.turma_ids.filter((x) => x !== t.id),
                            }));
                          }}
                        />
                        <span className="text-sm">{t.nome_turma}</span>
                      </label>
                    );
                  })}
                </ScrollArea>
                <p className="text-[11px] text-muted-foreground mt-1.5">Você poderá editar as turmas depois em Usuários.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              <RefreshCw className={`h-4 w-4 mr-1 ${submitting ? "animate-spin" : "hidden"}`} />
              {submitting ? "Enviando…" : "Enviar convite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialog.open} onOpenChange={(o) => setLinkDialog((s) => ({ ...s, open: o }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Link de aceite do convite</DialogTitle>
            <DialogDescription>
              {sendStatus?.sent
                ? <>Enviamos o e-mail para <strong>{linkDialog.email}</strong>. Você também pode compartilhar este link manualmente.</>
                : <>Não foi possível enviar o e-mail automaticamente. Compartilhe este link com <strong>{linkDialog.email}</strong>.</>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {sendStatus && (
              <div
                className={`flex items-start gap-2 rounded-md border p-2.5 text-xs ${
                  sendStatus.sent
                    ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                }`}
              >
                {sendStatus.sent ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="font-medium">
                    {sendStatus.sent ? "E-mail enviado com sucesso" : "Falha no envio automático"}
                  </p>
                  {!sendStatus.sent && sendStatus.error && (
                    <p className="opacity-80 mt-0.5 break-words">{sendStatus.error}</p>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-md border bg-muted/30 p-3 break-all text-xs font-mono">
              {linkDialog.url}
            </div>
            {linkDialog.expiresAt && (
              <p className="text-[11px] text-muted-foreground">
                Válido até {new Date(linkDialog.expiresAt).toLocaleString("pt-BR")}.
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(linkDialog.url);
                  toast.success("Link copiado");
                }}
              >
                <Copy className="h-4 w-4 mr-1.5" /> Copiar
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(linkDialog.url, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-4 w-4 mr-1.5" /> Abrir
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const text = `Olá! Você foi convidado para acessar a Nexus. Crie sua conta neste link: ${linkDialog.url}`;
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(text)}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                const subject = encodeURIComponent("Convite para acessar a Nexus");
                const body = encodeURIComponent(
                  `Olá!\n\nVocê foi convidado para acessar a plataforma Nexus.\nCrie sua conta acessando o link abaixo:\n\n${linkDialog.url}\n\nEste link é pessoal e expira em 7 dias.`,
                );
                window.location.href = `mailto:${linkDialog.email}?subject=${subject}&body=${body}`;
              }}
            >
              <Mail className="h-4 w-4 mr-1.5" /> Abrir e-mail no meu app
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={() => setLinkDialog((s) => ({ ...s, open: false }))}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}