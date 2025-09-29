"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./estadisticas.module.css";

import { getTramitesSummary } from "@/features/reports/reports.service";
import { MONTHS, TramitesSummary, titleCase } from "@/features/reports/reports.model";

// tipos UI
import type { BarItem, LinePoint } from "./components/estadisticas/types";

// UI
import HeaderStats from "./components/HeaderStats/HeaderStats";
import KPIGrid from "./components/KpiGrid/KpiGrid";
import Card from "./components/Card/Card";
import BarsColumns from "./components/BarsColumns/BarsColumns";
import BarsHorizontal from "./components/BarsHorizontal/BarsHorizontal"; // si lo sigues usando en otra vista
import LineChartRe, { PeriodPoint } from "./components/LineChart/LineChart";
import DailyPerformance from "./components/BarsColumns/BarsColumns";

// ✅ NUEVOS: chart con Recharts + lista diaria

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

export default function EstadisticasPage() {
  const yearNow = new Date().getFullYear();
  const [year, setYear] = useState<number>(yearNow);
  const { data, loading, err } = useSummary(year);

  // ===== KPIs
  const kpis = useMemo(() => {
    if (!data) return [];
    const totalYear = data.byYear.find(x => x.year === year)?.total ?? 0;

    const totalMonth = data.byMonthStatus
      .filter(m => m.year === year && m.month === (new Date().getMonth() + 1))
      .reduce((acc, x) => acc + x.total, 0);

    const prevMonthTotal = data.byMonthStatus
      .filter(m => m.year === year && m.month === new Date().getMonth())
      .reduce((acc, x) => acc + x.total, 0);

    const delta = prevMonthTotal > 0
      ? Math.round(((totalMonth - prevMonthTotal) / prevMonthTotal) * 100)
      : undefined;

    const pending = data.byMonthStatus
      .filter(m => m.year === year && m.month === (new Date().getMonth() + 1) && m.status?.toUpperCase() !== "FINALIZADO")
      .reduce((acc, x) => acc + x.total, 0);

    return [
      { label: `Cédulas elaboradas en ${year}`, value: totalYear, delta: undefined },
      { label: `Cédulas del mes (${MONTHS[new Date().getMonth()]})`, value: totalMonth, delta },
      { label: "Total cédulas del día", value: data.todayTotal, delta: undefined },
      { label: "Total cédulas pendientes", value: pending, delta: undefined },
    ];
  }, [data, year]);

  // ===== Serie mensual (línea principal)
  const monthlyLine = useMemo<LinePoint[]>(() => {
    if (!data) return [];
    const monthTotals = new Array(12).fill(0);
    data.byMonthStatus
      .filter(m => m.year === year)
      .forEach(m => { monthTotals[m.month - 1] += m.total; });
    return monthTotals.map((v, i) => ({ x: i, y: v, label: MONTHS[i] }));
  }, [data, year]);

  // ✅ Serie “pendientes” por mes (derivada, sin tocar API)
  const monthlyPending = useMemo<number[]>(() => {
    if (!data) return new Array(12).fill(0);
    const arr = new Array(12).fill(0);
    data.byMonthStatus
      .filter(m => m.year === year && (m.status?.toUpperCase() !== "FINALIZADO"))
      .forEach(m => { arr[m.month - 1] += m.total; });
    return arr;
  }, [data, year]);

  // ✅ Data para Recharts (como en el mock: dorado = created, vino = pending)
  const chartData = useMemo<PeriodPoint[]>(() => {
    const created = monthlyLine.map(p => p.y);
    return MONTHS.map((label, i) => ({
      label,
      created: created[i] ?? 0,
      pending: monthlyPending[i] ?? 0,
      year,
    }));
  }, [monthlyLine, monthlyPending, year]);

  // ===== Ranking por analista (para la lista diaria)
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

  // ===== Barras anuales (totales por año)
  const yearlyBars = useMemo<BarItem[]>(() => {
    if (!data) return [];
    return data.byYear
      .slice()
      .sort((a, b) => a.year - b.year)
      .map(v => ({ label: String(v.year), value: v.total }));
  }, [data]);

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
            <Card
              title="Cédulas por periodo"
              subtitle=""
              right={
                <div className="actions">
                  <div className="pills" role="tablist" aria-label="Rango">
                    <button className="pill" aria-pressed="true">12 Meses</button>
                    <button className="pill" aria-pressed="false">6 Meses</button>
                    <button className="pill" aria-pressed="false">30 Días</button>
                    <button className="pill" aria-pressed="false">7 Días</button>
                  </div>
                  <button className="btn">🗎 Exportar PDF</button>
                </div>
              }
            >
              {/* ✅ Recharts con banda dorada + rosada y tooltip como el mock */}
              <LineChartRe data={chartData} height={260} />
            </Card>

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
