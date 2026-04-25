import { cn } from "@/lib/utils";

const variants = {
  danger: "bg-accent/15 text-orange-700 dark:text-accent border-accent/30",
  warning: "bg-warning/15 text-amber-700 dark:text-warning border-warning/30",
  info: "bg-secondary/15 text-blue-700 dark:text-secondary border-secondary/30",
};

const dotColors = {
  danger: "bg-accent",
  warning: "bg-warning",
  info: "bg-secondary",
};

interface AlertChipProps {
  label: string;
  variant: "danger" | "warning" | "info";
}

export function AlertChip({ label, variant }: AlertChipProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium", variants[variant])}>
      <span className={cn("w-2 h-2 rounded-full animate-pulse-dot", dotColors[variant])} />
      {label}
    </span>
  );
}
