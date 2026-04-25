import { getAccessToken } from "@/lib/auth";

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? "http://localhost:3000";
}

export class ApiError extends Error {
  status: number;
  /**
   * `true` quando a falha foi de rede (backend indisponível, DNS, CORS), em
   * oposição a uma resposta HTTP de erro vinda do backend.
   */
  isNetworkError: boolean;

  constructor(message: string, status = 500, isNetworkError = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

// Cache leve do token (a SDK do Supabase já faz refresh automático em background;
// aqui evitamos chamar getSession() em toda request).
let cachedToken: string | null = null;
let cachedAt = 0;
const TOKEN_TTL_MS = 30_000;

async function readToken(forceRefresh = false): Promise<string | null> {
  const now = Date.now();
  if (!forceRefresh && cachedToken && now - cachedAt < TOKEN_TTL_MS) {
    return cachedToken;
  }
  const token = await getAccessToken();
  cachedToken = token;
  cachedAt = now;
  return token;
}

function buildHeaders(token: string | null, init: RequestInit) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers ?? {}),
  };
}

async function doFetch(baseUrl: string, path: string, init: RequestInit, token: string | null) {
  try {
    return await fetch(`${baseUrl}${path}`, { ...init, headers: buildHeaders(token, init) });
  } catch {
    throw new ApiError(
      `Não foi possível conectar ao backend em ${baseUrl}. Verifique se o serviço está rodando.`,
      0,
      true,
    );
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  let token = await readToken();
  let response = await doFetch(baseUrl, path, init, token);

  // Interceptor: token pode estar expirado mesmo dentro do TTL — uma retry com refresh.
  if (response.status === 401 && token) {
    token = await readToken(true);
    response = await doFetch(baseUrl, path, init, token);
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(payload?.error ?? "Erro na API", response.status);
  }

  return payload as T;
}
