import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Aluno, useCreateAluno, useUpdateAluno } from "@/hooks/useEntities";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  aluno?: Aluno | null;
}

export function AlunoForm({ open, onOpenChange, aluno }: Props) {
  const [form, setForm] = useState({ nome_aluno: "", documento: "", email: "", telefone: "", data_nascimento: "", status: "ativo" });
  const create = useCreateAluno();
  const update = useUpdateAluno();
  const isEdit = !!aluno;
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aluno) setForm({
      nome_aluno: aluno.nome_aluno,
      documento: aluno.documento,
      email: aluno.email ?? "",
      telefone: aluno.telefone ?? "",
      data_nascimento: aluno.data_nascimento ?? "",
      status: aluno.status,
    });
    else setForm({ nome_aluno: "", documento: "", email: "", telefone: "", data_nascimento: "", status: "ativo" });
  }, [aluno, open]);

  useEffect(() => {
    if (open) setTimeout(() => firstFieldRef.current?.focus(), 50);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      email: form.email || null,
      telefone: form.telefone || null,
      data_nascimento: form.data_nascimento || null,
    };
    if (isEdit && aluno) await update.mutateAsync({ id: aluno.id, ...payload });
    else await create.mutateAsync(payload);
    onOpenChange(false);
  };

  const loading = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Aluno" : "Novo Aluno"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4 disabled:opacity-70">
          <div>
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input ref={firstFieldRef} id="nome" required autoComplete="off" value={form.nome_aluno} onChange={(e) => setForm({ ...form, nome_aluno: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="doc">CPF *</Label>
              <Input id="doc" required placeholder="000.000.000-00" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="dn">Data de Nascimento</Label>
              <Input id="dn" type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="tel">Telefone</Label>
              <Input id="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? (<span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Salvando…</span>) : "Salvar"}
            </Button>
          </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}