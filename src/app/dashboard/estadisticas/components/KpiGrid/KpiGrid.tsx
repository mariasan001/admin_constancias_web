import s from "./KpiGrid.module.css";

type KPI = { label: string; value: number; delta?: number | undefined };

export default function KPIGrid({ items }: { items: KPI[] }) {
  return (
    <section className={s.kpis}>
      {items.map(k => (
        <article className={s.kpi} key={k.label}>
          <div className={s.kpiValue}>{k.value.toLocaleString()}</div>
          <div className={s.kpiLabel}>{k.label}</div>
          {typeof k.delta === "number" && (
            <div className={k.delta >= 0 ? s.deltaUp : s.deltaDown}>
              {k.delta > 0 ? "+" : ""}{k.delta}%
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
