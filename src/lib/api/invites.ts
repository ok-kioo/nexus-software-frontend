import { apiRequest } from "./client";
import type { UserRole } from "@/data/mockData";

export interface InviteRow {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  expires_at: string;
  created_at: string;
  token: string;
  turma_ids: string[];
}

export interface InviteInfo {
  email: string;
  role: UserRole;
  status: string;
  expires_at: string;
}

export function fetchInvites() {
  return apiRequest<{ rows: InviteRow[] }>("/v1/invites");
}

export function createInvite(payload: { email: string; role: UserRole; turma_ids: string[] }) {
  return apiRequest<{ accept_url?: string; expires_at?: string; email_sent?: boolean; email_error?: string }>("/v1/invites", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resendInvite(id: string, payload: { email?: string; role?: UserRole } = {}) {
  return apiRequest<{ accept_url?: string; expires_at?: string; email_sent?: boolean; email_error?: string }>(`/v1/invites/${id}/resend`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function cancelInvite(id: string) {
  return apiRequest<{ ok: boolean }>(`/v1/invites/${id}/cancel`, {
    method: "PATCH",
  });
}

export function fetchInviteByToken(token: string) {
  return apiRequest<{ invite: InviteInfo }>(`/v1/invites/by-token/${token}`);
}

export function acceptInvite(payload: { token: string; name: string; password: string }) {
  return apiRequest<{ ok: boolean; email: string; role: UserRole }>("/v1/invites/accept", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createTestInvite(scenario: "expirado" | "cancelado" | "aceito") {
  return apiRequest<{ ok: boolean; accept_url: string }>("/v1/invites/test", {
    method: "POST",
    body: JSON.stringify({ scenario }),
  });
}

export function deleteTestInvites() {
  return apiRequest<{ ok: boolean; deleted: number }>("/v1/invites/test", {
    method: "DELETE",
  });
}
