import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/data/mockData";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">Carregando…</div>
    </div>
  );
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role, loading } = useAuth();

  // Ainda resolvendo sessão.
  if (loading) return <LoadingScreen />;

  // Sessão resolvida e não autenticado → manda pro login.
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Autenticado mas perfil/role ainda não chegou: evita a janela de race onde
  // o componente filho renderizaria sem permissão e depois um Navigate disparado
  // tardiamente deixaria o <main> em branco. Esperamos o role aparecer.
  if (allowedRoles && !role) return <LoadingScreen />;

  // Role carregado e não está na lista permitida → redireciona para a home do papel.
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={role === "professor" ? "/professor" : "/dashboard"} replace />;
  }

  return <>{children}</>;
}
