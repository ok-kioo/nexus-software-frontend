import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUnidades, useCursos, useTurmas } from "@/hooks/useEntities";
import { periods } from "@/data/mockData";

export interface FilterConfig {
  unit?: boolean;
  course?: boolean;
  period?: boolean;
  turma?: boolean;
  status?: boolean;
  severity?: boolean;
}

interface FilterBarProps {
  config: FilterConfig;
  onFilterChange?: (key: string, value: string) => void;
  values?: Partial<Record<"unit" | "course" | "turma" | "period" | "status" | "severity", string>>;
}

export function FilterBar({ config, onFilterChange, values }: FilterBarProps) {
  const { data: unidades = [] } = useUnidades();
  const { data: cursos = [] } = useCursos();
  const { data: turmas = [] } = useTurmas();

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {config.unit && (
        <Select value={values?.unit} onValueChange={(v) => onFilterChange?.("unit", v)}>
          <SelectTrigger className="w-[200px] bg-card border-border">
            <SelectValue placeholder="Todas as unidades" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todas as unidades</SelectItem>
            {unidades.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.nome_unidade}/{u.estado}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {config.course && (
        <Select value={values?.course} onValueChange={(v) => onFilterChange?.("course", v)}>
          <SelectTrigger className="w-[220px] bg-card border-border">
            <SelectValue placeholder="Todos os cursos" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todos os cursos</SelectItem>
            {cursos.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nome_curso}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {config.turma && (
        <Select value={values?.turma} onValueChange={(v) => onFilterChange?.("turma", v)}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Todas as turmas" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todas as turmas</SelectItem>
            {turmas.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.nome_turma}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {config.period && (
        <Select value={values?.period} onValueChange={(v) => onFilterChange?.("period", v)}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todos os períodos</SelectItem>
            {periods.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {config.status && (
        <Select value={values?.status} onValueChange={(v) => onFilterChange?.("status", v)}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ativa">Ativa</SelectItem>
            <SelectItem value="trancada">Trancada</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      )}
      {config.severity && (
        <Select value={values?.severity} onValueChange={(v) => onFilterChange?.("severity", v)}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Severidade" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="critico">Crítico</SelectItem>
            <SelectItem value="atencao">Atenção</SelectItem>
            <SelectItem value="informativo">Informativo</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
