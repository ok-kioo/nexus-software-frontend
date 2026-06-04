import { apiRequest } from "./client";

export interface MeResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: "administrador" | "gestor" | "professor";
    roles: Array<"administrador" | "gestor" | "professor">;
  };
}

export function fetchMe() {
  return apiRequest<MeResponse>("/v1/auth/me");
}
