import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const API_URL = "http://localhost:3000";

/** Handlers padrão — testes podem sobrescrever via server.use(...). */
export const defaultHandlers = [
  http.get(`${API_URL}/v1/auth/me`, () =>
    HttpResponse.json({
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Admin Teste",
        email: "admin@test.com",
        role: "administrador",
      },
    }),
  ),
  http.get(`${API_URL}/v1/analytics/turmas-counts`, () =>
    HttpResponse.json({ rows: [], total: 0 }),
  ),
];

export const server = setupServer(...defaultHandlers);
export { http, HttpResponse };
