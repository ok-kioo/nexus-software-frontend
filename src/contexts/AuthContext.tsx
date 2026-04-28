import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthChange,
  getSession,
  signInWithPassword,
  signUpWithPassword,
  signOut,
  type Session,
  type SupabaseUser,
} from "@/lib/auth";
import { fetchMe } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { UserRole } from "@/data/mockData";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedClasses?: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: AppUser | null;
  role: UserRole | null;
  session: Session | null;
  authError: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role?: UserRole) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  user: null,
  role: null,
  session: null,
  authError: null,
  login: async () => ({ ok: false }),
  signup: async () => ({ ok: false }),
  logout: async () => {},
  clearAuthError: () => {},
  refreshUser: async () => {},
});

async function loadAppUser(supaUser: SupabaseUser): Promise<AppUser> {
  // Sempre busca via backend Hono (Clean Architecture). Nunca toca em tabelas direto.
  const { user } = await fetchMe();
  return {
    id: user.id,
    name: user.name || supaUser.email?.split("@")[0] || "Usuário",
    email: user.email || supaUser.email || "",
    role: user.role,
  };
}

function describeAuthLoadError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isNetworkError) return "Não foi possível conectar ao servidor.";
    if (err.status === 401) return "Sessão inválida ou expirada. Faça login novamente.";
    if (err.status === 403) return "Sua conta não possui permissões. Contate o administrador.";
    return `Erro do backend (${err.status}): ${err.message}`;
  }
  return err instanceof Error ? err.message : "Erro desconhecido ao carregar perfil.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Listener PRIMEIRO (recomendação Lovable Cloud)
    const unsubscribe = onAuthChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // defer fetch to avoid deadlocks
        setTimeout(() => {
          loadAppUser(newSession.user)
            .then((u) => {
              setUser(u);
              setAuthError(null);
            })
            .catch((err) => {
              setUser(null);
              setAuthError(describeAuthLoadError(err));
            })
            .finally(() => setLoading(false));
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Sessão atual
    getSession().then((currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        loadAppUser(currentSession.user)
          .then((u) => {
            setUser(u);
            setAuthError(null);
          })
          .catch((err) => {
            setUser(null);
            setAuthError(describeAuthLoadError(err));
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // ── Sincronização entre abas ──────────────────────────────
    // Se outro usuário fizer login em outra aba (token muda no storage),
    // recarregamos a página para evitar vazamento de dados/contexto.
    let lastTokenSnapshot: string | null = null;
    const SUPA_KEY_PREFIX = "sb-";
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(SUPA_KEY_PREFIX) && k.endsWith("-auth-token")) {
          lastTokenSnapshot = window.localStorage.getItem(k);
          break;
        }
      }
    } catch { /* ignore */ }

    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith(SUPA_KEY_PREFIX) || !e.key.endsWith("-auth-token")) return;
      // Se o valor mudou de fato (login/logout em outra aba), recarrega.
      if (e.newValue !== lastTokenSnapshot) {
        lastTokenSnapshot = e.newValue;
        window.location.reload();
      }
    };
    window.addEventListener("storage", onStorage);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("nexus-auth");
      bc.onmessage = (msg) => {
        if (msg.data?.type === "auth-changed") {
          window.location.reload();
        }
      };
    } catch { /* BroadcastChannel pode não existir em alguns navegadores */ }

    return () => {
      unsubscribe();
      window.removeEventListener("storage", onStorage);
      bc?.close();
    };
  }, []);

  const broadcastAuthChange = () => {
    try {
      const bc = new BroadcastChannel("nexus-auth");
      bc.postMessage({ type: "auth-changed" });
      bc.close();
    } catch { /* ignore */ }
  };

  const refreshUser = async () => {
    if (!session?.user) return;
    try {
      const u = await loadAppUser(session.user);
      setUser(u);
      setAuthError(null);
    } catch (err) {
      setAuthError(describeAuthLoadError(err));
    }
  };

  const login = async (email: string, password: string) => {
    setAuthError(null);
    const { data, error } = await signInWithPassword(email, password);
    if (error) return { ok: false, error: error.message };
    if (data.user) {
      try {
        const appUser = await loadAppUser(data.user);
        setUser(appUser);
        setSession(data.session);
        broadcastAuthChange();
      } catch (err) {
         // Servidor indisponível ou erro ao carregar perfil: aborta a sessão
        // para não deixar o app em estado quebrado (sem role/perfil).
        const message = describeAuthLoadError(err);
        await signOut().catch(() => {});
        setUser(null);
        setSession(null);
        setAuthError(message);
        return { ok: false, error: message };
      }
    }
    return { ok: true };
  };

  const signup = async (email: string, password: string, name: string, _role: UserRole = "professor") => {
    // SECURITY: Never pass `role` via user_metadata — the DB trigger ignores it
    // and always assigns the default 'professor' role. Elevated roles are only
    // granted through the secure invite flow (accept-invite edge function).
    const { error } = await signUpWithPassword(email, password, name);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setSession(null);
    setAuthError(null);
    broadcastAuthChange();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session && !!user,
        loading,
        user,
        role: user?.role ?? null,
        session,
        authError,
        login,
        signup,
        logout,
        clearAuthError: () => setAuthError(null),
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
