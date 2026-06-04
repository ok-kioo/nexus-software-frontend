import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AceitarConvite from "./AceitarConvite";

const toastMock = vi.fn();
const navigateMock = vi.fn();
const rpcMock = vi.fn();
const invokeMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...a: unknown[]) => rpcMock(...a),
    functions: { invoke: (...a: unknown[]) => invokeMock(...a) },
  },
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastMock }) }));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

function renderPage(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/aceitar-convite${search}`]}>
      <AceitarConvite />
    </MemoryRouter>,
  );
}

const validToken = "11111111-1111-1111-1111-111111111111";
const future = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();
const past = () => new Date(Date.now() - 60 * 60 * 1000).toISOString();

describe("AceitarConvite", () => {
  beforeEach(() => {
    toastMock.mockReset();
    navigateMock.mockReset();
    rpcMock.mockReset();
    invokeMock.mockReset();
  });

  it("shows missing-token card when no token", async () => {
    renderPage();
    expect(await screen.findByText(/Link de convite incompleto/i)).toBeInTheDocument();
  });

  it("shows invalid card for non-uuid token", async () => {
    renderPage("?token=abc");
    expect(await screen.findByText(/Convite não encontrado/i)).toBeInTheDocument();
  });

  it("shows invalid card when RPC returns empty", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    renderPage(`?token=${validToken}`);
    expect(await screen.findByText(/Convite não encontrado/i)).toBeInTheDocument();
  });

  it("shows cancelled card", async () => {
    rpcMock.mockResolvedValue({
      data: [{ email: "x@y.z", role: "professor", status: "cancelado", expires_at: future() }],
      error: null,
    });
    renderPage(`?token=${validToken}`);
    expect(await screen.findByText(/Convite cancelado/i)).toBeInTheDocument();
  });

  it("shows used card", async () => {
    rpcMock.mockResolvedValue({
      data: [{ email: "x@y.z", role: "professor", status: "aceito", expires_at: future() }],
      error: null,
    });
    renderPage(`?token=${validToken}`);
    expect(await screen.findByText(/Convite já utilizado/i)).toBeInTheDocument();
  });

  it("shows expired card when expires_at is past", async () => {
    rpcMock.mockResolvedValue({
      data: [{ email: "x@y.z", role: "professor", status: "pendente", expires_at: past() }],
      error: null,
    });
    renderPage(`?token=${validToken}`);
    expect(await screen.findByText(/Convite expirado/i)).toBeInTheDocument();
  });

  it("renders form for valid pending invite, blocks submit on mismatch", async () => {
    rpcMock.mockResolvedValue({
      data: [{ email: "x@y.z", role: "professor", status: "pendente", expires_at: future() }],
      error: null,
    });
    renderPage(`?token=${validToken}`);
    await screen.findByLabelText(/Seu nome/i);
    fireEvent.change(screen.getByLabelText(/Seu nome/i), { target: { value: "Maria" } });
    fireEvent.change(screen.getByLabelText(/^Senha$/i), { target: { value: "Strong1!aa" } });
    fireEvent.change(screen.getByLabelText(/Confirmar senha/i), { target: { value: "Different1!" } });
    expect(screen.getByText(/As senhas não coincidem/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Criar conta/i })).toBeDisabled();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("submits successfully and navigates to /login", async () => {
    rpcMock.mockResolvedValue({
      data: [{ email: "x@y.z", role: "professor", status: "pendente", expires_at: future() }],
      error: null,
    });
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });
    renderPage(`?token=${validToken}`);
    await screen.findByLabelText(/Seu nome/i);
    fireEvent.change(screen.getByLabelText(/Seu nome/i), { target: { value: "Maria" } });
    fireEvent.change(screen.getByLabelText(/^Senha$/i), { target: { value: "Strong1!aa" } });
    fireEvent.change(screen.getByLabelText(/Confirmar senha/i), { target: { value: "Strong1!aa" } });
    fireEvent.click(screen.getByRole("button", { name: /Criar conta/i }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalled());
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/login"));
  });

  it("maps HIBP error from edge function to friendly toast", async () => {
    rpcMock.mockResolvedValue({
      data: [{ email: "x@y.z", role: "professor", status: "pendente", expires_at: future() }],
      error: null,
    });
    invokeMock.mockResolvedValue({ data: { error: "Password is known to be pwned" }, error: null });
    renderPage(`?token=${validToken}`);
    await screen.findByLabelText(/Seu nome/i);
    fireEvent.change(screen.getByLabelText(/Seu nome/i), { target: { value: "Maria" } });
    fireEvent.change(screen.getByLabelText(/^Senha$/i), { target: { value: "Strong1!aa" } });
    fireEvent.change(screen.getByLabelText(/Confirmar senha/i), { target: { value: "Strong1!aa" } });
    fireEvent.click(screen.getByRole("button", { name: /Criar conta/i }));
    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(toastMock.mock.calls[0][0]).toMatchObject({ title: "Senha muito comum" });
  });
});