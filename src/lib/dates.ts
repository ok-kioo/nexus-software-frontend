/** Helpers de data para validação client-side em PT-BR. */

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function isFutureOrToday(value: string): boolean {
  return isValidIsoDate(value) && value >= todayIso();
}

export function isPastOrToday(value: string): boolean {
  return isValidIsoDate(value) && value <= todayIso();
}
