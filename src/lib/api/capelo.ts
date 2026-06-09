import { apiRequest } from "./client";

export type CapeloRole = "user" | "assistant" | "system";

export interface CapeloMessage {
  id: string;
  role: CapeloRole;
  content: string;
  created_at: string;
}

export const capeloApi = {
  list: (params?: { limit?: number; before?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.before) qs.set("before", params.before);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiRequest<{ rows: CapeloMessage[]; hasMore: boolean }>(`/v1/capelo/messages${suffix}`);
  },
  send: (content: string) =>
    apiRequest<{ user: CapeloMessage; assistant: CapeloMessage }>("/v1/capelo/messages", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  clear: () => apiRequest<{ ok: true }>("/v1/capelo/messages", { method: "DELETE" }),
};
