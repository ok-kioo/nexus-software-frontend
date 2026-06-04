import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Turma, useCreateTurma, useUpdateTurma, useUnidades, useCursos } from "@/hooks/useEntities";
import { Combobox } from "@/components/reusable/Combobox";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  turma?: Turma | null;
}

export function TurmaForm({ open, onOpenChange, turma }: Props) {
  const { data: unidades = [] } = useUnidades();
  const { data: cursos = [] } = useCursos();
  const [form, setForm] = useState({
    nome_turma: "", unidade_id: "", curso_id: "", capacidade: 30,
    periodo: "", turno: "matutino", status: "ativa",
  });
  const create = useCreateTurma();
  const update = useUpdateTurma();
  const isEdit = !!turma;
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (turma) setForm({
      nome_turma: turma.nome_turma, unidade_id: turma.unidade_id, curso_id: turma.curso_id,
      capacidade: turma.capacidade, periodo: turma.periodo ?? "", turno: turma.turno ?? "matutino", status: turma.status,
    });
    else setForm({ nome_turma: "", unidade_id: "", curso_id: "", capacidade: 30, periodo: "", turno: "matutino", status: "ativa" });
  }, [turma, open]);

  useEffect(() => {
    if (open) setTimeout(() => firstRef.current?.focus(), 50);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unidade_id || !form.curso_id) return;
    const payload = { ...form, periodo: form.periodo || null };
    if (isEdit && turma) await update.mutateAsync({ id: turma.id, ...payload });
    else await create.mutateAsync(payload);
    onOpenChange(false);
  };

  const loading = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Turma" : "Nova Turma"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4 disabled:opacity-70">
          <div>
            <Label htmlFor="nome">Nome da Turma *</Label>
            <Input ref={firstRef} id="nome" required placeholder="ex.: ENF-2024A" value={form.nome_turma} onChange={(e) => setForm({ ...form, nome_turma: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Unidade *</Label>
              <Combobox
                options={unidades.map((u) => ({ value: u.id, label: u.nome_unidade, hint: u.estado }))}
                value={form.unidade_id}
                onChange={(v) => setForm({ ...form, unidade_id: v })}
                placeholder="Selecione"
                searchPlaceholder="Buscar unidade…"
              />
            </div>
            <div>
              <Label>Curso *</Label>
              <Combobox
                options={cursos.map((c) => ({ value: c.id, label: c.nome_curso }))}
                value={form.curso_id}
                onChange={(v) => setForm({ ...form, curso_id: v })}
                placeholder="Selecione"
                searchPlaceholder="Buscar curso…"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="cap">Capacidade *</Label>
              <Input id="cap" type="number" min={1} required value={form.capacidade} onChange={(e) => setForm({ ...form, capacidade: Number(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="per">Período</Label>
              <Input id="per" placeholder="2024.1" value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })} />
            </div>
            <div>
              <Label>Turno</Label>
              <Select value={form.turno} onValueChange={(v) => setForm({ ...form, turno: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="matutino">Matutino</SelectItem>
                  <SelectItem value="vespertino">Vespertino</SelectItem>
                  <SelectItem value="noturno">Noturno</SelectItem>
                  <SelectItem value="integral">Integral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="completa">Completa</SelectItem>
                <SelectItem value="encerrada">Encerrada</SelectItem>
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