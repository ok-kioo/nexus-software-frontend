import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EsqueciSenha from "./EsqueciSenha";

const toastMock = vi.fn();
const resetPasswordMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) => resetPasswordMock(...args),
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <EsqueciSenha />
    </MemoryRouter>,
  );
}

describe("EsqueciSenha", () => {
  beforeEach(() => {
    toastMock.mockReset();
    resetPasswordMock.mockReset();
  });

  it("shows inline error and does not call supabase for invalid email", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar link/i }));
    expect(await screen.findByText(/Digite um e-mail válido/i)).toBeInTheDocument();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it("calls resetPasswordForEmail with redirect URL and shows success state with cooldown", async () => {
    resetPasswordMock.mockResolvedValue({ error: null });
    renderPage();
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: "user@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar link/i }));
    await waitFor(() => expect(resetPasswordMock).toHaveBeenCalled());
    const args = resetPasswordMock.mock.calls[0];
    expect(args[0]).toBe("user@test.com");
    expect(String(args[1].redirectTo)).toMatch(/\/redefinir-senha$/);
    expect(await screen.findByText(/Verifique seu e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reenviar em \d+s/i })).toBeDisabled();
  });

  it("shows friendly toast on rate-limit error", async () => {
    resetPasswordMock.mockResolvedValue({ error: { message: "Too many requests" } });
    renderPage();
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: "user@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar link/i }));
    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(toastMock.mock.calls[0][0]).toMatchObject({ title: "Muitas tentativas" });
  });
});