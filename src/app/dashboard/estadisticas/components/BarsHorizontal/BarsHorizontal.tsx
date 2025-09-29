import { BarItem } from "../estadisticas/types";
import s from "./BarsHorizontal.module.css";

type Props = { items: BarItem[]; height?: number };

export default function BarsHorizontal({ items, height = 240 }: Props) {
  const pad = 28;
  const w = 720;
  const h = height;

  const max = Math.max(1, ...items.map(i => i.value));
  const scaleX = (w - pad * 2) / max;
  const rowH = (h - pad * 2) / Math.max(1, items.length);
  const gap = 8;

  return (
    <div className={s.svgWrap}>
      <svg viewBox={`0 0 ${w} ${h}`} className={s.svg}>
        {items.map((b, i) => {
          const x = pad;
          const y = pad + i * rowH + gap / 2;
          const barW = Math.max(1, b.value * scaleX);
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={rowH - gap} className={s.bar} rx="6" />
              <text x={x + 4} y={y - 6} className={s.axisX}>{b.value.toLocaleString()}</text>
              <text x={x} y={y + (rowH - gap) / 2 + 4} className={s.axisLabel}>
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
