"use client";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip
} from "recharts";
import s from "./LineChart.module.css";

/** Estructura esperada por el chart */
export type PeriodPoint = {
  label: string;       // "Feb", "Mar", ...
  created: number;     // Creadas
  pending: number;     // Pendientes
  // opcional: year, monthIndex, etc. si lo necesitas para el tooltip
  year?: number;
};

type Props = {
  data: PeriodPoint[];           // 12, 6, 30, 7 (lo que mandes)
  height?: number;               // default 280
  className?: string;
};

export default function LineChartRe({ data, height = 280, className }: Props) {
  // Ajustes visuales
  const padX = 24;

  return (
    <div className={`${s.wrap} ${className || ""}`}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          {/* Líneas guía muy suaves */}
          <CartesianGrid
            stroke="#efe9e2"
            strokeOpacity={1}
            vertical={false}
            strokeDasharray="0"
          />

          {/* Eje X: meses, sin línea/tiquetas intrusivas */}
          <XAxis
            dataKey="label"
            tick={{ className: s.axisX }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            padding={{ left: padX, right: padX }}
          />
          {/* Eje Y oculto (para un look limpio) */}
          <YAxis hide />

          {/* Tooltip custom para el “globo” del mock + cursor vertical */}
          <Tooltip
            cursor={{ stroke: "rgba(159,33,65,.35)", strokeWidth: 1 }} // línea vertical
            content={<Balloon />}
            wrapperStyle={{ outline: "none" }}
          />

          {/* Área 1 (CREADAS) → dorado con relleno crema */}
          <defs>
            <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.06} />
            </linearGradient>
            <linearGradient id="roseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--line-rose)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--line-rose)" stopOpacity={0.10} />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="created"
            stroke="var(--accent)"
            fill="url(#goldFill)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 4, stroke: "var(--accent)", strokeWidth: 2, fill: "#fff" }}
          />

          {/* Área 2 (PENDIENTES) → línea vino + área rosada */}
          <Area
            type="monotone"
            dataKey="pending"
            stroke="var(--line-rose)"
            fill="url(#roseFill)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 4, stroke: "var(--line-rose)", strokeWidth: 2, fill: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ===== Balloon (tooltip) ===== */
function Balloon({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  // payload[0] = created, payload[1] = pending (por el orden de las <Area>)
  const created = payload[0]?.value ?? 0;
  const pending = payload[1]?.value ?? 0;

  // accede al label y año si lo enviaste en data[...]
  const raw = payload[0]?.payload;
  const label = raw?.label ?? "";
  const year = raw?.year ? ` ${raw.year}` : "";

  return (
    <div className={s.balloon} role="dialog" aria-label="Detalle del periodo">
      <div className={s.balloonTitle}>
        {label}<b>{year}</b>
      </div>
      <div className={s.row}>
        <span>Creadas:</span><b>{Number(created).toLocaleString()}</b>
      </div>
      <div className={s.row}>
        <span>Pendientes:</span><b>{Number(pending).toLocaleString()}</b>
      </div>
      <div className={s.caret} aria-hidden />
    </div>
  );
}
