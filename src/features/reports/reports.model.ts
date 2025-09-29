// Resumen de métricas de trámites

export type TramitesSummary = {
  byYear: Array<{ year: number; total: number }>;
  byYearStatus: Array<{ year: number; status: string; total: number }>;
  byMonthStatus: Array<{ year: number; month: number; status: string; total: number }>;
  byPersonMonthStatus: Array<{
    month: number;
    userId: string;
    status: string;
    total: number;
    userName: string;
  }>;
  byPersonYearStatus: Array<{
    year: number;
    userId: string;
    status: string;
    total: number;
    userName: string;
  }>;
  todayTotal: number;
};

// Utilidades para la página
export type KpiCard = { label: string; value: number; delta?: number };

export const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

export function titleCase(s?: string) {
  if (!s) return "—";
  return s.toLowerCase().replace(/(^|\s|[^\p{L}\p{N}_-])([\p{L}\p{N}])/gu, m => m.toUpperCase());
}
