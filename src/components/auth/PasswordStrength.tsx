import { Check, X } from "lucide-react";

export interface PasswordChecks {
  length: boolean;
  upper: boolean;
  number: boolean;
  symbol: boolean;
}

export function evaluatePassword(p: string): PasswordChecks {
  return {
    length: p.length >= 8,
    upper: /[A-Z]/.test(p),
    number: /[0-9]/.test(p),
    symbol: /[^A-Za-z0-9]/.test(p),
  };
}

export function isPasswordValid(p: string): boolean {
  const c = evaluatePassword(p);
  // exigência mínima: comprimento + maiúscula + número (símbolo é bônus)
  return c.length && c.upper && c.number;
}

export function PasswordStrength({ password }: { password: string }) {
  const c = evaluatePassword(password);
  const score = Object.values(c).filter(Boolean).length;
  const label =
    score <= 1 ? "Fraca" : score === 2 ? "Razoável" : score === 3 ? "Forte" : "Muito forte";
  const barColor =
    score <= 1
      ? "bg-destructive"
      : score === 2
        ? "bg-amber-500"
        : score === 3
          ? "bg-primary"
          : "bg-green-500";

  const items: { ok: boolean; label: string }[] = [
    { ok: c.length, label: "Mínimo 8 caracteres" },
    { ok: c.upper, label: "Uma letra maiúscula" },
    { ok: c.number, label: "Um número" },
    { ok: c.symbol, label: "Um símbolo (recomendado)" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${barColor}`}
            style={{ width: `${(score / 4) * 100}%` }}
          />
        </div>
        <span className="text-[11px] text-muted-foreground w-20 text-right">{label}</span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {items.map((it) => (
          <li
            key={it.label}
            className={`flex items-center gap-1.5 text-[11px] ${
              it.ok ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
            }`}
          >
            {it.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  );
}