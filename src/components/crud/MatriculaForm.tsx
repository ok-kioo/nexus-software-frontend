import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Matricula, useAlunos, useCreateMatricula, useTurmas, useUpdateMatricula } from "@/hooks/useEntities";
import { Combobox } from "@/components/reusable/Combobox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isValidIsoDate } from "@/lib/dates";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  matricula?: Matricula | null;
}

export function MatriculaForm({ open, onOpenChange, matricula }: Props) {
  const { data: alunos = [] } = useAlunos();
  const { data: turmas = [] } = useTurmas();
  const [form, setForm] = useState({
    aluno_id: "", turma_id: "", numero_matricula: "",
    data_inicio: "", data_fim: "", status: "ativa",
  });
  const create = useCreateMatricula();
  const update = useUpdateMatricula();
  const isEdit = !!matricula;

  useEffect(() => {
    if (matricula) setForm({
      aluno_id: matricula.aluno_id, turma_id: matricula.turma_id,
      numero_matricula: matricula.numero_matricula,
      data_inicio: matricula.data_inicio ?? "", data_fim: matricula.data_fim ?? "",
      status: matricula.status,
    });
    else setForm({
      aluno_id: "", turma_id: "", numero_matricula: `MAT-${Date.now().toString().slice(-8)}`,
      data_inicio: new Date().toISOString().slice(0, 10), data_fim: "", status: "ativa",
    });
  }, [matricula, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.aluno_id) { toast.error("Selecione o aluno."); return; }
    if (!form.turma_id) { toast.error("Selecione a turma."); return; }
    if (!form.numero_matricula.trim()) { toast.error("Informe o número da matrícula."); return; }
    if (form.data_inicio && !isValidIsoDate(form.data_inicio)) { toast.error("Data de início inválida."); return; }
    if (form.data_fim && !isValidIsoDate(form.data_fim)) { toast.error("Data de encerramento inválida."); return; }
    if (form.data_inicio && form.data_fim && form.data_fim < form.data_inicio) {
      toast.error("A data de encerramento deve ser igual ou posterior à de início.");
      return;
    }
    const payload = {
      ...form,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
    };
    if (isEdit && matricula) await update.mutateAsync({ id: matricula.id, ...payload });
    else await create.mutateAsync(payload);
    onOpenChange(false);
  };

  const loading = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Matrícula" : "Nova Matrícula"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4 disabled:opacity-70">
          <div>
            <Label>Aluno *</Label>
            <Combobox
              options={alunos.map((a) => ({ value: a.id, label: a.nome_aluno, hint: a.documento }))}
              value={form.aluno_id}
              onChange={(v) => setForm({ ...form, aluno_id: v })}
              placeholder="Selecione um aluno"
              searchPlaceholder="Buscar aluno por nome ou documento…"
            />
          </div>
          <div>
            <Label>Turma *</Label>
            <Combobox
              options={turmas.map((t) => ({ value: t.id, label: t.nome_turma }))}
              value={form.turma_id}
              onChange={(v) => setForm({ ...form, turma_id: v })}
              placeholder="Selecione uma turma"
              searchPlaceholder="Buscar turma…"
            />
          </div>
          <div>
            <Label htmlFor="num">Número da Matrícula *</Label>
            <Input id="num" required value={form.numero_matricula} onChange={(e) => setForm({ ...form, numero_matricula: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ini">Data de Início</Label>
              <Input id="ini" type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="fim">Data de Encerramento</Label>
              <Input id="fim" type="date" min={form.data_inicio || undefined} value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="trancada">Trancada</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
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