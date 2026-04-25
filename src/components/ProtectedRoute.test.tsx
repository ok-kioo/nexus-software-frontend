import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import type { UserRole } from "@/data/mockData";

const authState: {
  isAuthenticated: boolean;
  loading: boolean;
  role: UserRole | null;
} = { isAuthenticated: true, loading: false, role: "professor" };

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

function renderAt(initial: string, allowed?: UserRole[]) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route
          path="/cursos"
          element={
            <ProtectedRoute allowedRoles={allowed}>
              <div>conteudo cursos</div>
            </ProtectedRoute>
          }
        />
        <Route path="/professor" element={<div>painel professor</div>} />
        <Route path="/dashboard" element={<div>painel admin</div>} />
        <Route path="/login" element={<div>tela login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute — escopo por papel", () => {
  beforeEach(() => {
    authState.isAuthenticated = true;
    authState.loading = false;
    authState.role = "professor";
  });

  it("professor é redirecionado quando rota exige admin/gestor", () => {
    authState.role = "professor";
    renderAt("/cursos", ["administrador", "gestor"]);
    expect(screen.getByText(/painel professor/i)).toBeInTheDocument();
    expect(screen.queryByText(/conteudo cursos/i)).not.toBeInTheDocument();
  });

  it("gestor é redirecionado quando rota exige só admin", () => {
    authState.role = "gestor";
    renderAt("/cursos", ["administrador"]);
    expect(screen.getByText(/painel admin/i)).toBeInTheDocument();
  });

  it("gestor acessa rota que permite admin+gestor", () => {
    authState.role = "gestor";
    renderAt("/cursos", ["administrador", "gestor"]);
    expect(screen.getByText(/conteudo cursos/i)).toBeInTheDocument();
  });

  it("usuário não autenticado é mandado para /login", () => {
    authState.isAuthenticated = false;
    authState.role = null;
    renderAt("/cursos", ["administrador", "gestor"]);
    expect(screen.getByText(/tela login/i)).toBeInTheDocument();
  });
});