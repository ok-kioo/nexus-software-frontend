import { useState } from "react";
import { Shield, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuditoria } from "@/hooks/useNovasFeatures";
import {
  CRITICAL_OPERATIONS,
  type CriticalOperation,
} from "@/data/criticalOperations";
import { TableSkeleton } from "@/components/reusable/TableSkeleton";
import { EmptyState } from "@/components/reusable/EmptyState";

const acaoColor: Record<string, string> = {
  INSERT: "bg-success/15 text-success",
  UPDATE: "bg-secondary/15 text-secondary",
  DELETE: "bg-destructive/15 text-destructive",
};

export default function Auditoria() {
  const [entidade, setEntidade] = useState<string>("todas");
  const [acao, setAcao] = useState<string>("todas");

  const { data: logs, isLoading } = useAuditoria({
    entidade: entidade !== "todas" ? entidade : undefined,
    acao: acao !== "todas" ? acao : undefined,
  });

  return (
    <div>
      <PageHeader title="Auditoria & Logs" subtitle="Rastreabilidade de alterações no sistema" />

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="logs">Histórico de alterações</TabsTrigger>
          <TabsTrigger value="seguranca">
            <Lock className="h-3.5 w-3.5 mr-1.5" />
            Operações críticas & permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
      <div className="flex gap-2">
        <Select value={entidade} onValueChange={setEntidade}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Entidade"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas entidades</SelectItem>
            <SelectItem value="alunos">Alunos</SelectItem>
            <SelectItem value="matriculas">Matrículas</SelectItem>
            <SelectItem value="notas">Notas</SelectItem>
            <SelectItem value="frequencia">Frequência</SelectItem>
          </SelectContent>
        </Select>
        <Select value={acao} onValueChange={setAcao}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Ação"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas ações</SelectItem>
            <SelectItem value="INSERT">Criar</SelectItem>
            <SelectItem value="UPDATE">Atualizar</SelectItem>
            <SelectItem value="DELETE">Remover</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-0"><TableSkeleton columns={5} rows={6} /></CardContent></Card>
      ) : (logs ?? []).length === 0 ? (
        <EmptyState
          icon={<Shield className="h-7 w-7 text-muted-foreground" />}
          title="Nenhum registro de auditoria"
          description={entidade !== "todas" || acao !== "todas" ? "Ajuste os filtros para ver mais registros." : "Ações no sistema serão registradas aqui automaticamente."}
        />
      ) : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Quando</TableHead><TableHead>Usuário</TableHead><TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead><TableHead>Registro</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(logs ?? []).map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-xs">{l.user_email ?? l.user_id?.slice(0,8) ?? "sistema"}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${acaoColor[l.acao]}`}>{l.acao}</Badge></TableCell>
                  <TableCell className="text-xs">{l.entidade}</TableCell>
                  <TableCell className="text-xs font-mono">{l.registro_id?.slice(0,8)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
        </TabsContent>

        <TabsContent value="seguranca">
          <SecurityCatalog />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SecurityCatalog() {
  const grouped: Record<string, CriticalOperation[]> = {};
  for (const op of CRITICAL_OPERATIONS) {
    (grouped[op.group] ??= []).push(op);
  }

  return (
    <div className="space-y-4">
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Catálogo de operações sensíveis</p>
            <p className="text-muted-foreground">
              Lista as operações críticas do sistema (papéis, convites, importações), o nível de
              privilégio exigido e o retorno esperado quando um usuário sem permissão tenta
              executá-las. Use como referência ao auditar incidentes ou validar o comportamento
              após mudanças.
            </p>
          </div>
        </CardContent>
      </Card>

      {Object.entries(grouped).map(([group, ops]) => (
        <Card key={group}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[26%]">Operação</TableHead>
                  <TableHead className="w-[28%]">Endpoint / Recurso</TableHead>
                  <TableHead className="w-[18%]">Quem pode</TableHead>
                  <TableHead className="w-[14%]">Sem permissão</TableHead>
                  <TableHead>Como é registrado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ops.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="align-top">
                      <div className="font-medium text-sm">{op.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {op.description}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <code className="text-[11px] font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                        {op.endpoint}
                      </code>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-wrap gap-1">
                        {op.allowedRoles.map((r) => (
                          <Badge
                            key={r}
                            variant="outline"
                            className="text-[10px] capitalize"
                          >
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge
                        className={`text-[10px] ${
                          op.unauthorizedStatus === 403
                            ? "bg-destructive/15 text-destructive"
                            : op.unauthorizedStatus === 404
                              ? "bg-muted text-muted-foreground"
                              : "bg-secondary/15 text-secondary"
                        }`}
                      >
                        HTTP {op.unauthorizedStatus} · {op.unauthorizedLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top text-xs text-muted-foreground">
                      {op.audit ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          {op.audit}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}