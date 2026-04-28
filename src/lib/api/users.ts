import { apiRequest } from "./client";
import type { UserRole } from "@/data/mockData";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
}

export interface UserDetail extends UserRow {
  turma_ids: string[];
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: UserRole;
  turma_ids?: string[];
}

export function fetchUsers() {
  return apiRequest<{ rows: UserRow[] }>("/v1/users");
}

export function fetchUserById(id: string) {
  return apiRequest<UserDetail>(`/v1/users/${id}`);
}

export function updateUserRole(id: string, role: UserRole) {
  return apiRequest<{ ok: boolean; role: UserRole }>(`/v1/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function updateUser(id: string, patch: UpdateUserPayload) {
  return apiRequest<{ ok: boolean; user: UserDetail }>(`/v1/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function updateMe(patch: { name?: string; email?: string }) {
  return apiRequest<{ ok: boolean; user: UserDetail }>(`/v1/users/me`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function changeOwnPassword(currentPassword: string, newPassword: string) {
  return apiRequest<{ ok: boolean }>(`/v1/users/me/password`, {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
