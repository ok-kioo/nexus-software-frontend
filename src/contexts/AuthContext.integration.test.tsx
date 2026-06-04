import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("@/lib/auth", () => {
  const session = { access_token: "tk", user: { id: "u1", email: "u@test.com" } };
  return {
    onAuthChange: (cb: (e: string, s: unknown) => void) => {
      // simula sessão imediatamente
      setTimeout(() => cb("SIGNED_IN", session), 0);
      return () => {};
    },
    getSession: async () => session,
    getAccessToken: async () => "tk",
    signInWithPassword: vi.fn(),
    signUpWithPassword: vi.fn(),
    signOut: vi.fn(async () => undefined),
  };
});

vi.mock("@/lib/api/auth", () => ({
  fetchMe: async () => ({
    user: { id: "u1", name: "Admin", email: "u@test.com", role: "administrador" },
  }),
}));

function Probe() {
  const { isAuthenticated, role, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="role">{role ?? "none"}</span>
    </div>
  );
}

describe("AuthContext", () => {
  it("hidrata sessão e expõe role", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("auth").textContent).toBe("true");
    expect(screen.getByTestId("role").textContent).toBe("administrador");
  });
});
