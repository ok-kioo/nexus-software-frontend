import { describe, it, expect } from "vitest";
import { CRITICAL_OPERATIONS } from "./criticalOperations";

describe("criticalOperations catalog", () => {
  it("não tem ids duplicados", () => {
    const ids = CRITICAL_OPERATIONS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("toda operação declara endpoint, grupo e status HTTP esperado", () => {
    for (const op of CRITICAL_OPERATIONS) {
      expect(op.endpoint).toBeTruthy();
      expect(op.group).toBeTruthy();
      expect([401, 403, 404]).toContain(op.unauthorizedStatus);
    }
  });

  it("user_roles.assign não permite nenhuma role do cliente (só via SECURITY DEFINER)", () => {
    const op = CRITICAL_OPERATIONS.find((o) => o.id === "user-roles-assign");
    expect(op).toBeDefined();
    expect(op!.allowedRoles).toEqual([]);
    expect(op!.unauthorizedStatus).toBe(403);
  });

  it("operações de importação são restritas a administrador e gestor", () => {
    const importOps = CRITICAL_OPERATIONS.filter((o) =>
      o.group === "Importação de dados",
    );
    expect(importOps.length).toBeGreaterThan(0);
    for (const op of importOps) {
      expect(op.allowedRoles).toEqual(
        expect.arrayContaining(["administrador", "gestor"]),
      );
      expect(op.allowedRoles).not.toContain("professor");
    }
  });

  it("exclusões sensíveis (alunos, matrículas, turmas) são apenas administrador", () => {
    const deletes = CRITICAL_OPERATIONS.filter((o) =>
      ["aluno-delete", "matricula-delete", "turma-delete"].includes(o.id),
    );
    expect(deletes.length).toBe(3);
    for (const op of deletes) {
      expect(op.allowedRoles).toEqual(["administrador"]);
    }
  });

  it("frequência e notas (escrita) incluem professor e indicam escopo de turma", () => {
    const academicWrites = CRITICAL_OPERATIONS.filter((o) =>
      ["frequencia-write", "notas-write"].includes(o.id),
    );
    expect(academicWrites.length).toBe(2);
    for (const op of academicWrites) {
      expect(op.allowedRoles).toContain("professor");
      expect(op.unauthorizedLabel.toLowerCase()).toContain("escopo");
    }
  });

  it("publicação de avisos exclui professor (apenas admin/gestor)", () => {
    const op = CRITICAL_OPERATIONS.find((o) => o.id === "aviso-publish");
    expect(op).toBeDefined();
    expect(op!.allowedRoles).toEqual(
      expect.arrayContaining(["administrador", "gestor"]),
    );
    expect(op!.allowedRoles).not.toContain("professor");
  });

  it("aceitar convite retorna 404 quando token é inválido", () => {
    const op = CRITICAL_OPERATIONS.find((o) => o.id === "invite-accept");
    expect(op?.unauthorizedStatus).toBe(404);
  });
});