import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NexusLogoMark } from "@/components/NexusLogoMark";
import { CapeloChatPanel } from "./CapeloChatPanel";
import { cn } from "@/lib/utils";

export function CapeloFAB() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Abrir chat com o Capelo"
        title="Fale com o Capelo"
        className={cn(
          "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full",
          "bg-gradient-to-br from-primary to-accent",
          "shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40",
          "flex items-center justify-center",
          "transition-all duration-200 hover:scale-105 active:scale-95",
          "ring-2 ring-background",
          open && "opacity-0 pointer-events-none scale-90",
        )}
      >
        <NexusLogoMark
          className="w-8 h-8"
          imgClassName="brightness-0 invert"
          alt="Capelo"
        />
      </button>
      <CapeloChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default CapeloFAB;
