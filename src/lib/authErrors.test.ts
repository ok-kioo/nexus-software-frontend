import { describe, it, expect } from "vitest";
import { friendlyAuthError } from "./authErrors";

describe("friendlyAuthError", () => {
  it("maps HIBP/pwned messages", () => {
    expect(friendlyAuthError("Password is known to be weak (pwned)").title).toBe("Senha muito comum");
    expect(friendlyAuthError("found in data breach").title).toBe("Senha muito comum");
    expect(friendlyAuthError("LEAKED password").title).toBe("Senha muito comum");
  });

  it("maps weak/short password", () => {
    expect(friendlyAuthError("Password should be at least 8 characters").title).toBe("Senha muito curta");
    expect(friendlyAuthError("weak password").title).toBe("Senha fraca");
  });

  it("maps already registered", () => {
    expect(friendlyAuthError("User already registered").title).toBe("E-mail já cadastrado");
    expect(friendlyAuthError("email_exists").title).toBe("E-mail já cadastrado");
  });

  it("maps invalid email", () => {
    expect(friendlyAuthError("Invalid email").title).toBe("E-mail inválido");
  });

  it("maps rate limit", () => {
    expect(friendlyAuthError("Too many requests").title).toBe("Muitas tentativas");
    expect(friendlyAuthError("over_email_send_rate_limit").title).toBe("Muitas tentativas");
  });

  it("maps network errors", () => {
    expect(friendlyAuthError("Failed to fetch").title).toBe("Falha de conexão");
    expect(friendlyAuthError("Edge Function returned a non-2xx status code").title).toBe("Falha de conexão");
  });

  it("maps expired and invalid token", () => {
    expect(friendlyAuthError("Token has expired").title).toBe("Link expirado");
    expect(friendlyAuthError("invalid token").title).toBe("Link inválido");
  });

  it("maps session expired", () => {
    expect(friendlyAuthError("Auth session missing").title).toBe("Sessão expirada");
  });

  it("falls back for empty/unknown", () => {
    expect(friendlyAuthError("").title).toBe("Não foi possível concluir");
    expect(friendlyAuthError("something weird from server").title).toBe("Não foi possível concluir");
  });
});