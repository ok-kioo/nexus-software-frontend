import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CapeloFAB } from "@/components/capelo/CapeloFAB";

export default function AppLayout() {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border px-4 shrink-0 sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shadow-sm"
              aria-label="Alternar sidebar"
            />
            <div className="min-w-0 flex-1">
              <AppBreadcrumb />
            </div>
            <kbd
              className="hidden md:inline-flex h-7 items-center gap-1 rounded border border-border bg-muted/40 px-2 font-mono text-[11px] text-muted-foreground"
              title="Pressione Ctrl/Cmd + K para abrir a busca"
            >
              ⌘ K
            </kbd>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <ErrorBoundary>
              <div key={location.pathname} className="animate-fade-in-up">
                <Outlet />
              </div>
            </ErrorBoundary>
          </main>
          <OnboardingProvider />
          <CapeloFAB />
        </div>
      </div>
    </SidebarProvider>
  );
}
