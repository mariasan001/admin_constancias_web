// Resumen de métricas de trámites

export type TramitesSummary = {
  byYear: Array<{ year: number; total: number }>;
  byYearStatus: Array<{ year: number; status: string; total: number }>;
  byMonthStatus: Array<{ year: number; month: number; status: string; total: number }>;
  byPersonMonthStatus: Array<{
    month: number;              // <- según tu sample, solo mes
    userId: string;
    userName: string;
    status: string;
    total: number;
  }>;
  byPersonYearStatus: Array<{
    year: number;
    userId: string;
    userName: string;
    status: string;
    total: number;
  }>;

  // 🔥 Nuevo arreglo diario (día ISO + status + total)
  countByDays: Array<{
    status: string;
    day: string;   // "YYYY-MM-DD"
    total: number;
  }>;

  // Total del día actual
  todayTotal: number;
};

// Utilidades para la página
export type KpiCard = { label: string; value: number; delta?: number };

export const MONTHS = [
  "Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic",
] as const;

export function titleCase(s?: string) {
  if (!s) return "—";
  return s.toLowerCase().replace(
    /(^|\s|[^\p{L}\p{N}_-])([\p{L}\p{N}])/gu,
    m => m.toUpperCase()
  );
}
