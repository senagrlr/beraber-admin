// src/utils/money.ts

/**
 * TL formatı (noktalı, küsuratsız).
 * Örnek: fmtMoney(12500) → "12.500"
 */
export const fmtMoney = (n: number | string | null | undefined): string => {
  const numeric =
    typeof n === "string" ? Number(n) : Number(n ?? 0);

  const safe = Number.isFinite(numeric) ? numeric : 0;

  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(safe);
};
