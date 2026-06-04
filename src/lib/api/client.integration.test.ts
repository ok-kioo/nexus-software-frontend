import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse, server } from "@/test/msw-server";
import { apiRequest, ApiError } from "./client";

vi.mock("@/lib/auth", () => {
  const tokens = { current: "token-1" };
  return {
    getAccessToken: vi.fn(async () => tokens.current),
    __setToken: (t: string) => {
      tokens.current = t;
    },
  };
});

import { getAccessToken } from "@/lib/auth";

describe("apiRequest interceptor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("anexa Authorization Bearer a partir de getAccessToken", async () => {
    const seen: string[] = [];
    server.use(
      http.get("http://localhost:3000/v1/users", ({ request }) => {
        seen.push(request.headers.get("authorization") ?? "");
        return HttpResponse.json({ rows: [], total: 0 });
      }),
    );
    await apiRequest("/v1/users");
    expect(seen[0]).toBe("Bearer token-1");
  });

  it("propaga erro tipado em status 4xx", async () => {
    server.use(
      http.get("http://localhost:3000/v1/x", () =>
        HttpResponse.json({ error: "Não encontrado" }, { status: 404 }),
      ),
    );
    await expect(apiRequest("/v1/x")).rejects.toBeInstanceOf(ApiError);
  });

  it("retry uma vez em 401 com refresh do token", async () => {
    let calls = 0;
    server.use(
      http.get("http://localhost:3000/v1/me", () => {
        calls += 1;
        if (calls === 1) return HttpResponse.json({ error: "expirado" }, { status: 401 });
        return HttpResponse.json({ ok: true });
      }),
    );
    const result = await apiRequest<{ ok: boolean }>("/v1/me");
    expect(result.ok).toBe(true);
    expect(calls).toBe(2);
    // chamada inicial + refresh forçado
    expect(getAccessToken).toHaveBeenCalled();
  });
});
