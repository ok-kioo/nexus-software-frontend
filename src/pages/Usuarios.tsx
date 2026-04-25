import { useEffect, useState } from "react";
import { Mail, Pencil, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { fetchUsers } from "@/lib/api/users";
import type { UserRole } from "@/data/mockData";
import { TableSkeleton } from "@/components/reusable/TableSkeleton";
import { EmptyState } from "@/components/reusable/EmptyState";
import { ErrorState } from "@/components/reusable/ErrorState";

interface Row { id: string; name: string; email: string; role: UserRole | null; }

const roleBadge = (role: UserRole | null) => {
  if (!role) return <Badge variant="outline" className="text-[10px]">—</Badge>;
  const styles: Record<UserRole, string> = {
    administrador: "bg-accent/15 text-accent border-accent/30",
    gestor: "bg-primary/15 text-primary border-primary/30",
    professor: "bg-secondary/15 text-secondary border-secondary/30",
  };
  const labels: Record<UserRole, string> = { administrador: "Administrador", gestor: "Gestor", professor: "Professor" };
  return <Badge variant="outline" className={`text-[10px] ${styles[role]}`}>{labels[role]}</Badge>;
};

export default function Usuarios() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers();
      setRows(res.rows.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader
        title="Gestão de Usuários"
        subtitle="Usuários cadastrados na plataforma"
        action={<Button onClick={() => navigate("/convites")}><Mail className="h-4 w-4 mr-1" /> Convidar usuário</Button>}
      />

      <Card>
        <CardContent className="p-0">
          {loading ? <TableSkeleton columns={4} rows={5} /> : error ? (
            <ErrorState error={error} onRetry={load} compact />
          ) : rows.length === 0 ? (
            <EmptyState
              compact
              icon={<Users className="h-6 w-6 text-muted-foreground" />}
              title="Nenhum usuário cadastrado"
              description="Convide usuários por e-mail para começar a usar a plataforma."
              action={
                <Button size="sm" onClick={() => navigate("/convites")}>
                  <Mail className="h-4 w-4 mr-1" /> Convidar usuário
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{roleBadge(u.role)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10" onClick={() => toast.info(`Edição de ${u.name} em breve`)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
