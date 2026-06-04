import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { alertasApi, type AlertaStatus } from "@/lib/api/alertas";

export function useAlertas(filters: { status?: AlertaStatus } = {}) {
  return useQuery({
    queryKey: ["alertas", filters, "api"],
    queryFn: () => alertasApi.list(filters).then((r) => r.rows),
    staleTime: 30_000,
  });
}

export function useAlertaDetalhe(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["alerta-detalhe", id, "api"],
    queryFn: () => alertasApi.detail(id!),
  });
}

export function useUpdateAlertaStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Exclude<AlertaStatus, "convertido"> }) =>
      alertasApi.updateStatus(id, status),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["alertas"] });
      qc.invalidateQueries({ queryKey: ["alerta-detalhe", vars.id] });
      toast.success("Alerta atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePromoteAlerta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof alertasApi.promote>[1] }) =>
      alertasApi.promote(id, body),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["alertas"] });
      qc.invalidateQueries({ queryKey: ["alerta-detalhe", vars.id] });
      qc.invalidateQueries({ queryKey: ["planos-acao"] });
      toast.success("Plano de ação criado a partir do alerta");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}