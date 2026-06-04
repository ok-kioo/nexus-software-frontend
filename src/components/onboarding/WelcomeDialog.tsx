import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Compass } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";

/**
 * Modal único de boas-vindas. Mostra apenas na primeira sessão (até dismissed_modal=true).
 * O tour guiado só inicia ao clicar em "Começar tour".
 */
export function WelcomeDialog() {
  const { user, role } = useAuth();
  const { showWelcome, steps, dismissModal, skipTour, startTour } = useOnboarding();
  const [open, setOpen] = useState(false);
  const openedOnceRef = useRef(false);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showWelcome && !openedOnceRef.current) {
      openedOnceRef.current = true;
      setOpen(true);
    }
  }, [showWelcome]);

  useEffect(() => {
    return () => {
      if (startTimerRef.current) {
        clearTimeout(startTimerRef.current);
        startTimerRef.current = null;
      }
    };
  }, []);

  if (!user || !role || steps.length === 0) return null;

  const cancelPendingStart = () => {
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
  };

  const handleSkip = () => {
    cancelPendingStart();
    setOpen(false);
    void skipTour();
  };

  const handleClose = () => {
    // X / ESC: só esconde a modal, mantém checklist visível.
    cancelPendingStart();
    setOpen(false);
    void dismissModal();
  };

  const handleStartTour = () => {
    setOpen(false);
    void dismissModal();
    // Pequeno delay para o Dialog desmontar antes do Joyride aparecer.
    startTimerRef.current = setTimeout(() => {
      startTimerRef.current = null;
      startTour(true);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl">Bem-vindo(a) ao Nexus</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Vamos fazer um tour rápido (cerca de 2 minutos) destacando, direto na interface,
            os pontos principais que você precisa para começar
            {role === "professor" ? " a lançar frequência e notas." : " a configurar a plataforma."}
            <br />
            <span className="text-xs text-muted-foreground">
              Você pode pular agora e refazer depois em <strong>Ajuda</strong>.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 pt-4">
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Pular por agora
          </Button>
          <Button size="sm" onClick={handleStartTour}>
            <Compass className="h-4 w-4 mr-1.5" />
            Começar tour
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
