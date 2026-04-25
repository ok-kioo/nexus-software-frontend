import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AuthChangeEvent =
  | "INITIAL_SESSION" | "SIGNED_IN" | "SIGNED_OUT"
  | "PASSWORD_RECOVERY" | "TOKEN_REFRESHED" | "USER_UPDATED";

export function onAuthChange(cb: (event: AuthChangeEvent, session: Session | null) => void) {
  const { data: sub } = supabase.auth.onAuthStateChange((event, session) =>
    cb(event as AuthChangeEvent, session),
  );
  return () => sub.subscription.unsubscribe();
}

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(email: string, password: string, name: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: { name },
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function requestPasswordReset(email: string, redirectPath = "/redefinir-senha") {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${redirectPath}`,
  });
}

export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}

export type { Session, SupabaseUser };
