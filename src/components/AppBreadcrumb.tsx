import { Link, matchPath, useLocation } from "react-router-dom";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/contexts/AuthContext";

type Crumb = { label: string; path?: string };
type RouteEntry = { label: string; parents?: Crumb[] };

const staticRoutes: Record<string, RouteEntry> = {
  "/dashboard": { label: "Visão Geral" },
  "/alertas": { label: "Alertas" },
  "/matriculas": { label: "Matrículas", parents: [{ label: "Acadêmico" }] },
  "/turmas": { label: "Turmas", parents: [{ label: "Acadêmico" }] },
  "/academico": { label: "Desempenho", parents: [{ label: "Acadêmico" }] },
  "/permanencia": { label: "Permanência", parents: [{ label: "Acadêmico" }] },
  "/planos-acao": { label: "Planos de Ação", parents: [{ label: "Acadêmico" }] },
  "/mural": { label: "Mural", parents: [{ label: "Comunicação" }] },
  "/calendario": { label: "Calendário", parents: [{ label: "Comunicação" }] },
  "/cadastros": { label: "Cadastros", parents: [{ label: "Dados" }] },
  "/importar": { label: "Importar", parents: [{ label: "Dados" }] },
  "/exportar": { label: "Exportar", parents: [{ label: "Dados" }] },
  "/usuarios": { label: "Usuários", parents: [{ label: "Administração" }] },
  "/convites": { label: "Convites", parents: [{ label: "Administração" }, { label: "Usuários", path: "/usuarios" }] },
  "/auditoria": { label: "Auditoria", parents: [{ label: "Administração" }] },
  "/configuracoes": { label: "Configurações", parents: [{ label: "Conta" }] },
  "/ajuda": { label: "Ajuda", parents: [{ label: "Conta" }] },
  "/professor": { label: "Minhas Turmas" },
  "/frequencia": { label: "Frequência", parents: [{ label: "Sala de Aula" }, { label: "Minhas Turmas", path: "/professor" }] },
  "/notas": { label: "Notas", parents: [{ label: "Sala de Aula" }, { label: "Minhas Turmas", path: "/professor" }] },
};

const dynamicRoutes: { pattern: string; entry: RouteEntry }[] = [
  {
    pattern: "/alunos/:id",
    entry: { label: "Perfil do Aluno", parents: [{ label: "Dados" }, { label: "Cadastros", path: "/cadastros" }] },
  },
  {
    pattern: "/turmas/:id/relatorio",
    entry: { label: "Relatório", parents: [{ label: "Acadêmico" }, { label: "Turmas", path: "/turmas" }] },
  },
];

function resolveRoute(pathname: string): RouteEntry | null {
  if (staticRoutes[pathname]) return staticRoutes[pathname];
  for (const { pattern, entry } of dynamicRoutes) {
    if (matchPath(pattern, pathname)) return entry;
  }
  return null;
}

export function AppBreadcrumb() {
  const { pathname } = useLocation();
  const { role } = useAuth();
  const route = resolveRoute(pathname);

  if (!route) return null;

  const homePath = role === "professor" ? "/professor" : "/dashboard";
  const isHome = pathname === homePath;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {isHome ? (
            <BreadcrumbPage className="text-sm">Visão Geral</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild className="text-muted-foreground hover:text-foreground text-sm">
              <Link to={homePath}>Visão Geral</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {!isHome && route.parents?.map((p) => (
          <span key={p.path ?? p.label} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {p.path ? (
                <BreadcrumbLink asChild className="text-muted-foreground hover:text-foreground text-sm">
                  <Link to={p.path}>{p.label}</Link>
                </BreadcrumbLink>
              ) : (
                <span className="text-muted-foreground text-sm">{p.label}</span>
              )}
            </BreadcrumbItem>
          </span>
        ))}

        {!isHome && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm">{route.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
