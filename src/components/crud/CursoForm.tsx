import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Curso, useCreateCurso, useUpdateCurso } from "@/hooks/useEntities";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  curso?: Curso | null;
}

const CATEGORIAS = ["Saúde", "Administração", "Tecnologia", "Indústria", "Construção Civil", "Educação", "Serviços"];

export function CursoForm({ open, onOpenChange, curso }: Props) {
  const [form, setForm] = useState({ nome_curso: "", categoria: "Saúde", carga_horaria: 0, status: "ativo" });
  const create = useCreateCurso();
  const update = useUpdateCurso();
  const isEdit = !!curso;
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (curso) setForm({ nome_curso: curso.nome_curso, categoria: curso.categoria, carga_horaria: curso.carga_horaria ?? 0, status: curso.status });
    else setForm({ nome_curso: "", categoria: "Saúde", carga_horaria: 0, status: "ativo" });
  }, [curso, open]);

  useEffect(() => {
    if (open) setTimeout(() => firstRef.current?.focus(), 50);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, carga_horaria: form.carga_horaria || null };
    if (isEdit && curso) await update.mutateAsync({ id: curso.id, ...payload });
    else await create.mutateAsync(payload);
    onOpenChange(false);
  };

  const loading = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Curso" : "Novo Curso"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4 disabled:opacity-70">
          <div>
            <Label htmlFor="nome">Nome do Curso *</Label>
            <Input ref={firstRef} id="nome" required value={form.nome_curso} onChange={(e) => setForm({ ...form, nome_curso: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cat">Categoria *</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ch">Carga Horária</Label>
              <Input id="ch" type="number" min={0} value={form.carga_horaria} onChange={(e) => setForm({ ...form, carga_horaria: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
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