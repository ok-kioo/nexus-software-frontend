import nexusLogo from "@/assets/nexus-logo.png";
import { cn } from "@/lib/utils";

interface NexusLogoMarkProps {
  className?: string;
  imgClassName?: string;
  alt?: string;
}

/**
 * Marca oficial do Nexus (capelo) — conforme Manual da Marca.
 * Fundo transparente: o PNG já é transparente e mantém suas cores originais.
 */
export function NexusLogoMark({
  className,
  imgClassName,
  alt = "Nexus",
}: NexusLogoMarkProps) {
  return (
    <div className={cn("flex items-center justify-center shrink-0", className)}>
      <img
        src={nexusLogo}
        alt={alt}
        className={cn("h-full w-full object-contain", imgClassName)}
        draggable={false}
      />
    </div>
  );
}

export default NexusLogoMark;
