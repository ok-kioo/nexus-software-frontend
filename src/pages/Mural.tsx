import { useState } from "react";
import { Megaphone, Pin, Trash2, Plus } from "lucide-react";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAvisos, useCreateAviso, useDeleteAviso, useMarcarLido, useMinhasLeituras } from "@/hooks/useNovasFeatures";
import { useAuth } from "@/contexts/AuthContext";

export default function Mural() {
  const { role } = useAuth();
  const podeCriar = role === "administrador" || role === "gestor";
  const { data: avisos, isLoading } = useAvisos();
  const { data: lidos } = useMinhasLeituras();
  const create = useCreateAviso();
  const del = useDeleteAviso();
  const marcar = useMarcarLido();

  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [publico, setPublico] = useState("todos");
  const [fixado, setFixado] = useState(false);

  return (
    <div>
      <PageHeader
        title="Mural"
        subtitle="Comunicados internos da equipe"
        action={podeCriar && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/> Novo aviso</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Publicar aviso</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={150}/></div>
                <div><Label>Corpo</Label><Textarea value={corpo} onChange={(e) => setCorpo(e.target.value)} rows={5} maxLength={2000}/></div>
                <div>
                  <Label>Público-alvo</Label>
                  <Select value={publico} onValueChange={setPublico}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="professores">Professores</SelectItem>
                      <SelectItem value="gestores">Gestores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2"><Switch checked={fixado} onCheckedChange={setFixado}/><Label>Fixar no topo</Label></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={async () => {
                  if (!titulo.trim() || !corpo.trim()) return;
                  await create.mutateAsync({ titulo, corpo, publico_alvo: publico, fixado });
                  setTitulo(""); setCorpo(""); setPublico("todos"); setFixado(false); setOpen(false);
                }}>Publicar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      {isLoading ? <Skeleton className="h-32" /> : (
        <div className="space-y-3">
          {(avisos ?? []).map((a) => {
            const isLido = lidos?.has(a.id);
            return (
              <Card key={a.id} className={a.fixado ? "border-primary/40" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Megaphone className="h-5 w-5 text-primary mt-0.5"/>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {a.fixado && <Pin className="h-3 w-3 text-primary"/>}
                        <h3 className="font-medium text-sm">{a.titulo}</h3>
                        <Badge variant="outline" className="text-[10px]">{a.publico_alvo}</Badge>
                        {!isLido && <Badge className="text-[10px] bg-accent text-accent-foreground">Novo</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.corpo}</p>
                      <div className="text-[10px] text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString("pt-BR")}</div>
                    </div>
                    <div className="flex gap-1">
                      {!isLido && <Button size="sm" variant="ghost" onClick={() => marcar.mutate(a.id)}>Marcar lido</Button>}
                      {podeCriar && <Button size="icon" variant="ghost" onClick={() => del.mutate(a.id)}><Trash2 className="h-4 w-4"/></Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {(avisos ?? []).length === 0 && <div className="text-sm text-muted-foreground text-center py-8">Nenhum aviso publicado.</div>}
        </div>
      )}
    </div>
  );
}