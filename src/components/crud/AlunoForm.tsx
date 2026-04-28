import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/reusable/Combobox";
import {
  Aluno,
  useCreateAluno,
  useUpdateAluno,
  useCreateMatricula,
  useTurmasComJoin,
} from "@/hooks/useEntities";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  aluno?: Aluno | null;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export function AlunoForm({ open, onOpenChange, aluno }: Props) {
  const [form, setForm] = useState({ nome_aluno: "", documento: "", email: "", telefone: "", data_nascimento: "", status: "ativo" });
  const [linkTurma, setLinkTurma] = useState(false);
  const [matricula, setMatricula] = useState({ turma_id: "", numero_matricula: "", data_inicio: todayIso() });
  const create = useCreateAluno();
  const update = useUpdateAluno();
  const createMatricula = useCreateMatricula();
  const { data: turmasJoin = [] } = useTurmasComJoin();
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
    setLinkTurma(false);
    setMatricula({ turma_id: "", numero_matricula: "", data_inicio: todayIso() });
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

    if (isEdit && aluno) {
      await update.mutateAsync({ id: aluno.id, ...payload });
      onOpenChange(false);
      return;
    }

    // Validação do bloco opcional
    if (linkTurma) {
      if (!matricula.turma_id) {
        toast.error("Selecione a turma para a matrícula");
        return;
      }
      if (!matricula.numero_matricula.trim()) {
        toast.error("Informe o número da matrícula");
        return;
      }
    }

    let createdAluno: any;
    try {
      createdAluno = await create.mutateAsync(payload);
    } catch {
      return; // toast já exibido pelo hook
    }

    if (linkTurma && createdAluno?.id) {
      try {
        await createMatricula.mutateAsync({
          aluno_id: createdAluno.id,
          turma_id: matricula.turma_id,
          numero_matricula: matricula.numero_matricula.trim(),
          data_inicio: matricula.data_inicio || null,
          status: "ativa",
        });
      } catch (err) {
        // Aluno foi criado mas matrícula falhou — não há rollback automático.
        toast.error(`Aluno criado, mas falha ao vincular turma: ${(err as Error).message}`);
      }
    }

    onOpenChange(false);
  };

  const loading = create.isPending || update.isPending || createMatricula.isPending;
  const turmaOptions = (turmasJoin as any[]).map((t) => ({
    value: t.id,
    label: t.nome_turma,
    hint: t.unidade?.nome_unidade,
  }));

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

          {!isEdit && (
            <div className="border rounded-md p-3 space-y-3 bg-muted/30">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <Checkbox
                  checked={linkTurma}
                  onCheckedChange={(v) => setLinkTurma(v === true)}
                />
                Vincular a uma turma agora (opcional)
              </label>
              {linkTurma && (
                <div className="space-y-3 pl-6">
                  <div>
                    <Label>Turma *</Label>
                    <Combobox
                      options={turmaOptions}
                      value={matricula.turma_id}
                      onChange={(v) => setMatricula({ ...matricula, turma_id: v })}
                      placeholder="Selecione a turma"
                      searchPlaceholder="Buscar turma…"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="num_mat">Nº matrícula *</Label>
                      <Input
                        id="num_mat"
                        value={matricula.numero_matricula}
                        onChange={(e) => setMatricula({ ...matricula, numero_matricula: e.target.value })}
                        placeholder="ex.: 2024001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dt_ini">Data início</Label>
                      <Input
                        id="dt_ini"
                        type="date"
                        value={matricula.data_inicio}
                        onChange={(e) => setMatricula({ ...matricula, data_inicio: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
