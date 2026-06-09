import { ReactNode } from "react";
import { NexusLogoMark } from "@/components/NexusLogoMark";

interface AuthLayoutProps {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  showLogo?: boolean;
  footer?: ReactNode;
}

/**
 * Layout compartilhado das telas de autenticação.
 * Estética: glassmorphism imersivo com gradientes nas cores Nexus,
 * blobs animados sutis e card central de vidro.
 */
export function AuthLayout({
  children,
  title,
  subtitle,
  showLogo = true,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center auth-bg px-4 py-8 relative overflow-hidden">
      {/* Camada de blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
      </div>

      {/* Dot pattern sutil */}
      <div
        className="absolute inset-0 auth-dot-pattern opacity-[0.1] pointer-events-none"
        aria-hidden="true"
      />

      {/* Glow radial atrás do card */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-primary/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
        <div className="auth-glass-card rounded-xl overflow-hidden">
          {/* Linha de gradiente no topo */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-accent to-transparent" />

          <div className="p-6 sm:p-8">
            {(showLogo || title || subtitle) && (
              <div className="text-center mb-6">
                {showLogo && (
                  <div className="inline-flex items-center justify-center mb-3">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 blur-lg" />
                      <NexusLogoMark className="relative w-14 h-14 rounded-2xl" />
                    </div>
                  </div>
                )}
                {title ?? (
                  <h1 className="text-3xl font-bold tracking-tight">
                    <span className="text-primary">Nex</span>
                    <span className="text-accent">us</span>
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-3">{subtitle}</p>
                )}
              </div>
            )}

            {children}
          </div>

          {footer && (
            <>
              <div className="h-px w-full bg-border/60" />
              <div className="p-6 pt-4">{footer}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
