import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Unidade, useCreateUnidade, useUpdateUnidade } from "@/hooks/useEntities";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  unidade?: Unidade | null;
}

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export function UnidadeForm({ open, onOpenChange, unidade }: Props) {
  const [form, setForm] = useState({ nome_unidade: "", cidade: "", estado: "PE", status: "ativa" });
  const create = useCreateUnidade();
  const update = useUpdateUnidade();
  const isEdit = !!unidade;
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (unidade) setForm({ nome_unidade: unidade.nome_unidade, cidade: unidade.cidade, estado: unidade.estado, status: unidade.status });
    else setForm({ nome_unidade: "", cidade: "", estado: "PE", status: "ativa" });
  }, [unidade, open]);

  useEffect(() => {
    if (open) setTimeout(() => firstRef.current?.focus(), 50);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && unidade) {
      await update.mutateAsync({ id: unidade.id, ...form });
    } else {
      await create.mutateAsync(form);
    }
    onOpenChange(false);
  };

  const loading = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Unidade" : "Nova Unidade"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4 disabled:opacity-70">
          <div>
            <Label htmlFor="nome">Nome da Unidade *</Label>
            <Input ref={firstRef} id="nome" required value={form.nome_unidade} onChange={(e) => setForm({ ...form, nome_unidade: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cidade">Cidade *</Label>
              <Input id="cidade" required value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="estado">Estado *</Label>
              <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="inativa">Inativa</SelectItem>
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