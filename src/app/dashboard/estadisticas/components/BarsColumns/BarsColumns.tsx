import React from "react";

import s from "./BarsColumns.module.css";
import { BarItem } from "../estadisticas/types";

type Props = {
  items: BarItem[];              // label: nombre, value: conteo
  title?: string;                // "Seguimiento de rendimiento Diario"
  subtitle?: string;             // texto pequeño bajo el título
  getSubtitle?: (item: BarItem, idx: number) => string; // custom subtítulo por fila
};

export default function DailyPerformance({
  items,
  title = "Seguimiento de rendimiento Diario",
  subtitle = "Cada analista aporta al resultado del equipo. Aquí podrás visualizar quién está cumpliendo sus metas.",
  getSubtitle,
}: Props) {
  const rows = items.slice(0, 8); // tope visual como el mock

  return (
    <section className={s.card}>
      <header className={s.head}>
        <h3 className={s.title}>{title}</h3>
        <p className={s.sub}>{subtitle}</p>
      </header>

      <ul className={s.list} role="list">
        {rows.map((r, i) => (
          <li key={r.label} className={s.item}>
            <div className={s.left}>
              <span className={s.badge} aria-hidden>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "👤"}
              </span>
              <div className={s.meta}>
                <div className={s.name}>{r.label.toUpperCase()}</div>
                <div className={s.desc}>
                  {getSubtitle ? getSubtitle(r, i) : (
                    <>Tiene <b>{r.value} cédulas</b> por atender</>
                  )}
                </div>
              </div>
            </div>

            <div className={s.value} aria-label={`${r.value} cédulas`}>
              {r.value.toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
