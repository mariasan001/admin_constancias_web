import api from "@/lib/apis";
import type { TramitesSummary } from "./reports.model";

/**
 * GET /api/reports/tramites/summary?year=YYYY
 */
export async function getTramitesSummary(year?: number): Promise<TramitesSummary> {
  const { data } = await api.get("/api/reports/tramites/summary", {
    params: year ? { year } : undefined,
  });
  return data as TramitesSummary;
}
