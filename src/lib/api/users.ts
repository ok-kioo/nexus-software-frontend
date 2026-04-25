import { apiRequest } from "./client";
import type { UserRole } from "@/data/mockData";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
}

export function fetchUsers() {
  return apiRequest<{ rows: UserRow[] }>("/v1/users");
}

export function updateUserRole(id: string, role: UserRole) {
  return apiRequest<{ ok: boolean; role: UserRole }>(`/v1/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}
