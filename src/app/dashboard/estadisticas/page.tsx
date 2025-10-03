"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./estadisticas.module.css";

import { getTramitesSummary } from "@/features/reports/reports.service";
import { MONTHS, TramitesSummary, titleCase } from "@/features/reports/reports.model";

import type { BarItem } from "./components/estadisticas/types";
import HeaderStats from "./components/HeaderStats/HeaderStats";
import KPIGrid from "./components/KpiGrid/KpiGrid";
import Card from "./components/Card/Card";
import BarsColumns from "./components/BarsColumns/BarsColumns";
import LineChartRe, { PeriodPoint } from "./components/LineChart/LineChart";
import DailyPerformance from "./components/BarsColumns/BarsColumns";

/* ================================================================
   Helpers diarios basados en countByDays (con TZ México)
   ================================================================ */
type DailyMapRec = { created: number; pending: number };

function buildDailyMapFromCount(d?: TramitesSummary["countByDays"]) {
  const map = new Map<string, DailyMapRec>();
  if (!d?.length) return map;

  for (const row of d) {
    const iso = (row.day || "").slice(0, 10);
    if (!iso) continue;
    const prev = map.get(iso) ?? { created: 0, pending: 0 };
    prev.created += row.total;
    if ((row.status || "").toUpperCase() !== "FINALIZADO") prev.pending += row.total;
    map.set(iso, prev);
  }
  return map;
}

function toISODateMx(d: Date) {
  const parts = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(d)
    .reduce((o, p) => ((o as any)[p.type] = p.value, o), {} as Record<string, string>);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Últimos N días continuos hasta HOY (TZ MX), rellenando con 0 */
function lastNDaysContinuous(n: number, dailyMap: Map<string, DailyMapRec>) {
  const out: { iso: string; created: number; pending: number }[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = toISODateMx(d);
    const rec = dailyMap.get(iso) ?? { created: 0, pending: 0 };
    out.push({ iso, created: rec.created, pending: rec.pending });
  }
  return out;
}

/* ================================================================
   Data hook
   ================================================================ */
function useSummary(year?: number) {
  const [data, setData] = useState<TramitesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getTramitesSummary(year);
        if (on) setData(res);
      } catch (e: any) {
        if (on) setErr(e?.message || "No se pudo cargar el resumen");
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [year]);

  return { data, loading, err };
}

/* ================================================================
   Debounce util
   ================================================================ */
function useDebounced<T>(val: T, ms = 120) {
  const [v, setV] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setV(val), ms);
    return () => clearTimeout(t);
  }, [val, ms]);
  return v;
}

/* ================================================================
   Page
   ================================================================ */
type Range = "12m" | "6m" | "30d" | "7d";

export default function EstadisticasPage() {
  const yearNow = new Date().getFullYear();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Estado inicial sincronizado con URL
  const [year, setYear] = useState<number>(() => {
    const y = Number(sp.get("year"));
    return Number.isFinite(y) ? y : yearNow;
  });
  const [range, setRange] = useState<Range>(() => {
    const r = sp.get("range") as Range | null;
    return r && ["12m", "6m", "30d", "7d"].includes(r) ? r : "12m";
  });

  // Reflejar cambios a la URL (shareable)
  useEffect(() => {
    const params = new URLSearchParams(sp);
    params.set("year", String(year));
    params.set("range", range);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, range]);

  const { data, loading, err } = useSummary(year);

  const nf = useMemo(() => new Intl.NumberFormat("es-MX"), []);
  const rangeDeb = useDebounced(range, 120);

  // ================= KPIs =================
  const kpis = useMemo(() => {
    if (!data) return [];

    const now = new Date();
    const thisMonth = now.getMonth() + 1; // 1..12
    const thisYear = now.getFullYear();
    const prevMonth = thisMonth === 1 ? 12 : thisMonth - 1;
    const prevYear = thisMonth === 1 ? thisYear - 1 : thisYear;

    const totalYear = data.byYear.find(x => x.year === year)?.total ?? 0;

    const totalMonth = data.byMonthStatus
      .filter(m => m.year === year && m.month === thisMonth)
      .reduce((acc, x) => acc + x.total, 0);

    const prevMonthTotal = data.byMonthStatus
      .filter(m =>
        m.year === (year === thisYear ? prevYear : year) &&
        m.month === prevMonth
      )
      .reduce((acc, x) => acc + x.total, 0);

    const delta = prevMonthTotal > 0
      ? Math.round(((totalMonth - prevMonthTotal) / prevMonthTotal) * 100)
      : undefined;

    const pending = data.byMonthStatus
      .filter(m => m.year === year && m.month === thisMonth && m.status?.toUpperCase() !== "FINALIZADO")
      .reduce((acc, x) => acc + x.total, 0);

    const monthLabel = year === thisYear ? MONTHS[thisMonth - 1] : "N/A";

    return [
      { label: `Cédulas elaboradas en ${year}`, value: nf.format(totalYear), delta: undefined },
      { label: `Cédulas del mes (${monthLabel})`, value: nf.format(totalMonth), delta },
      { label: "Total cédulas del día", value: nf.format(data.todayTotal ?? 0), delta: undefined },
      { label: "Total cédulas pendientes", value: nf.format(pending), delta: undefined },
    ];
  }, [data, year, nf]);

  // =============== SERIES MENSUALES ===============
  const monthlyCreated = useMemo<number[]>(() => {
    if (!data) return new Array(12).fill(0);
    const totals = new Array(12).fill(0);
    data.byMonthStatus
      .filter(m => m.year === year)
      .forEach(m => { totals[m.month - 1] += m.total; });
    return totals;
  }, [data, year]);

  const monthlyPending = useMemo<number[]>(() => {
    if (!data) return new Array(12).fill(0);
    const arr = new Array(12).fill(0);
    data.byMonthStatus
      .filter(m => m.year === year && (m.status?.toUpperCase() !== "FINALIZADO"))
      .forEach(m => { arr[m.month - 1] += m.total; });
    return arr;
  }, [data, year]);

  const monthlyData: PeriodPoint[] = useMemo(() => {
    return MONTHS.map((label, i) => ({
      label,
      created: monthlyCreated[i] ?? 0,
      pending: monthlyPending[i] ?? 0,
      year,
    }));
  }, [monthlyCreated, monthlyPending, year]);

  // =============== SERIES DIARIAS (30d/7d) ===============
  const dailyMap = useMemo(
    () => buildDailyMapFromCount(data?.countByDays),
    [data?.countByDays]
  );

  const daily30: PeriodPoint[] = useMemo(() => {
    const rows = lastNDaysContinuous(30, dailyMap);
    return rows.map(({ iso, created, pending }) => {
      const dt = new Date(iso + "T00:00:00");
      return {
        label: dt.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }).replace(".", ""),
        created, pending, year,
      };
    });
  }, [dailyMap, year]);

  const daily7: PeriodPoint[] = useMemo(() => {
    const rows = lastNDaysContinuous(7, dailyMap);
    return rows.map(({ iso, created, pending }) => {
      const dt = new Date(iso + "T00:00:00");
      return {
        label: dt.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }).replace(".", ""),
        created, pending, year,
      };
    });
  }, [dailyMap, year]);

  // =============== DATASET FINAL POR RANGO (debounced) ===============
  const chartDataView = useMemo<PeriodPoint[]>(() => {
    switch (rangeDeb) {
      case "6m":  return monthlyData.slice(-6);
      case "30d": return daily30;
      case "7d":  return daily7;
      default:    return monthlyData; // 12m
    }
  }, [rangeDeb, monthlyData, daily30, daily7]);

  // =============== Ranking anual ===============
  const rankingBars = useMemo<BarItem[]>(() => {
    if (!data) return [];
    const map = new Map<string, { name: string; total: number }>();
    data.byPersonYearStatus
      .filter(p => p.year === year)
      .forEach(p => {
        const k = p.userId;
        const prev = map.get(k)?.total ?? 0;
        map.set(k, { name: p.userName || p.userId, total: prev + p.total });
      });
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map(r => ({ label: titleCase(r.name), value: r.total }));
  }, [data, year]);

  // =============== Barras anuales ===============
  const yearlyBars = useMemo<BarItem[]>(() => {
    if (!data) return [];
    return data.byYear
      .slice()
      .sort((a, b) => a.year - b.year)
      .map(v => ({ label: String(v.year), value: v.total }));
  }, [data]);

  /* ================= Exportar PDF ================= */
  const chartRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const onExportPDF = async () => {
    if (!chartRef.current || exporting) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const node = chartRef.current;
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const margin = 24;
      const contentW = pageW - margin * 2;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("Cédulas por periodo", margin, 40);

      const imgW = contentW;
      const ratio = canvas.height / canvas.width;
      const imgH = imgW * ratio;
      pdf.addImage(imgData, "PNG", margin, 60, imgW, imgH, undefined, "FAST");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`Rango: ${range}  •  Año: ${year}`, margin, 60 + imgH + 18);

      pdf.save(`cedulas-periodo-${range}-${year}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  /* ================= Render ================= */
  const isAllZero = useMemo(
    () => chartDataView.every(p => (p.created || 0) === 0 && (p.pending || 0) === 0),
    [chartDataView]
  );

  return (
    <section className={styles.wrap}>
      <HeaderStats
        title="Estadísticas"
        subtitle="Seguimiento diario, mensual y anual del rendimiento de tu equipo."
        year={year}
        onYearChange={setYear}
        yearMax={yearNow + 1}
      />

      {loading ? (
        <div className={styles.card}>Cargando métricas…</div>
      ) : err ? (
        <div className={styles.card}>⚠ {err}</div>
      ) : !data ? (
        <div className={styles.card}>Sin información</div>
      ) : (
        <>
          <KPIGrid items={kpis} />

          <section className={styles.grid2}>
            {/* Card del chart (referenciado para PDF) */}
            <div ref={chartRef}>
              <Card
                title="Cédulas por periodo"
                right={
                  <div className={styles.actions}>
                    <div className={styles.pills} role="tablist" aria-label="Rango">
                      <button className={styles.pill} aria-pressed={range === "12m"} onClick={() => setRange("12m")}>12 Meses</button>
                      <button className={styles.pill} aria-pressed={range === "6m"}  onClick={() => setRange("6m")}>6 Meses</button>
                      <button className={styles.pill} aria-pressed={range === "30d"} onClick={() => setRange("30d")}>30 Días</button>
                      <button className={styles.pill} aria-pressed={range === "7d"}  onClick={() => setRange("7d")}>7 Días</button>
                    </div>
                    <button className={styles.btn} onClick={onExportPDF} disabled={exporting}>
                      {exporting ? "Exportando…" : "🗎 Exportar PDF"}
                    </button>
                  </div>
                }
              >
                {isAllZero ? (
                  <div className={styles.emptySeries}>Sin datos en el rango seleccionado</div>
                ) : (
                  <LineChartRe data={chartDataView} height={260} />
                )}
              </Card>
            </div>

            <DailyPerformance
              items={rankingBars}
              title="Seguimiento de rendimiento Diario"
              subtitle="Cada analista aporta al resultado del equipo. Aquí podrás visualizar quién está cumpliendo sus metas."
            />
          </section>

          <Card title="Métricas Anuales" subtitle="Totales por año">
            <BarsColumns items={yearlyBars} />
          </Card>
        </>
      )}
    </section>
  );
}
