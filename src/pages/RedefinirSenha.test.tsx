import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RedefinirSenha from "./RedefinirSenha";

const toastMock = vi.fn();
const navigateMock = vi.fn();

let authStateCb: ((event: string) => void) | null = null;
const updateUserMock = vi.fn();
const signOutMock = vi.fn().mockResolvedValue({ error: null });
const getSessionMock = vi.fn().mockResolvedValue({ data: { session: null } });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: (event: string) => void) => {
        authStateCb = cb;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: () => getSessionMock(),
      updateUser: (...a: unknown[]) => updateUserMock(...a),
      signOut: () => signOutMock(),
    },
  },
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastMock }) }));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <RedefinirSenha />
    </MemoryRouter>,
  );
}

describe("RedefinirSenha", () => {
  beforeEach(() => {
    toastMock.mockReset();
    navigateMock.mockReset();
    updateUserMock.mockReset();
    authStateCb = null;
    getSessionMock.mockResolvedValue({ data: { session: null } });
  });

  it('shows "link inválido" card after 3s without auth event', async () => {
    renderPage();
    expect(
      await screen.findByText(/Link inválido ou expirado/i, undefined, { timeout: 6000 }),
    ).toBeInTheDocument();
  }, 10000);

  it("submits successfully and navigates to /login", async () => {
    updateUserMock.mockResolvedValue({ error: null });
    renderPage();
    await act(async () => {
      authStateCb?.("PASSWORD_RECOVERY");
    });
    fireEvent.change(document.getElementById("pw") as HTMLInputElement, { target: { value: "Strong1!aa" } });
    fireEvent.change(document.getElementById("confirm") as HTMLInputElement, { target: { value: "Strong1!aa" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar nova senha/i }));
    await waitFor(() => expect(updateUserMock).toHaveBeenCalledWith({ password: "Strong1!aa" }));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/login"));
  });

  it("blocks submit when passwords mismatch and shows mismatch helper", async () => {
    renderPage();
    await act(async () => {
      authStateCb?.("PASSWORD_RECOVERY");
    });
    fireEvent.change(document.getElementById("pw") as HTMLInputElement, { target: { value: "Strong1!aa" } });
    fireEvent.change(document.getElementById("confirm") as HTMLInputElement, { target: { value: "Diferente1!" } });
    expect(screen.getByText(/As senhas não coincidem/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Salvar nova senha/i })).toBeDisabled();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("maps HIBP error from updateUser to friendly toast", async () => {
    updateUserMock.mockResolvedValue({ error: { message: "Password is known to be pwned" } });
    renderPage();
    await act(async () => {
      authStateCb?.("PASSWORD_RECOVERY");
    });
    fireEvent.change(document.getElementById("pw") as HTMLInputElement, { target: { value: "Strong1!aa" } });
    fireEvent.change(document.getElementById("confirm") as HTMLInputElement, { target: { value: "Strong1!aa" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar nova senha/i }));
    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(toastMock.mock.calls[0][0]).toMatchObject({ title: "Senha muito comum" });
  });
});