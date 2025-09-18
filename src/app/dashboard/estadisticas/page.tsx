'use client';

import { useMemo, useRef, useState } from "react";
import styles from "./page.module.css";
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area,
  BarChart, Bar, Legend
} from "recharts";

type RangeKey = "12M" | "6M" | "30D" | "7D";

const months = ["Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan"];

function makeMonthlyData() {
  // Datos similares a la maqueta: "creadas" (amarilla) y "pendientes" (vino)
  const createdBase = [120,140,160,170,190,210,220,240,260,250,245,265];
  const pendingBase = [90,95,110,120,130,135,142,150,160,155,150,158];
  return months.map((m, i) => ({
    label: m,
    created: createdBase[i],
    pending: pendingBase[i],
  }));
}

function makeAnnualData() {
  // Barras apiladas por año (2021-2025)
  return [
    { year: "2021", completas: 260, enProceso: 120, rechazadas: 80 },
    { year: "2022", completas: 310, enProceso: 140, rechazadas: 90 },
    { year: "2023", completas: 360, enProceso: 160, rechazadas: 110 },
    { year: "2024", completas: 390, enProceso: 170, rechazadas: 120 },
    { year: "2025", completas: 400, enProceso: 180, rechazadas: 130 },
  ];
}

const dailyPerf = [
  { name: "ARI",   pending: 21, color: "#F59E0B" },
  { name: "HUGO",  pending: 16, color: "#4B5563" },
  { name: "ALEX",  pending: 15, color: "#EF4444" },
  { name: "JORGE", pending: 12, color: "#60A5FA" },
  { name: "BIBI",  pending: 11, color: "#8B5CF6" },
];

const ranking = [
  { name: "HUGO", value: 5735 },
  { name: "ABI",  value: 3567 },
  { name: "ALEC", value: 3000 },
  { name: "JORGE",value: 2500 },
];

export default function EstadisticasPage() {
  const [range, setRange] = useState<RangeKey>("12M");
  const kpis = useMemo(() => ([
    { title: "CÉLULAS ELABORADAS EN 2025", value: "12,200", delta: "+3.6%", up: true },
    { title: "TOTAL DE CÉLULAS DEL MES (SEPTIEMBRE)", value: "340", delta: "+1.4%", up: true },
    { title: "TOTAL DE CÉLULAS DEL DÍA", value: "128", delta: "+3.6%", up: true },
    { title: "TOTAL CÉLULAS PENDIENTES", value: "60" },
  ]), []);

  const monthly = useMemo(() => {
    const data = makeMonthlyData();
    if (range === "12M") return data;
    if (range === "6M")  return data.slice(-6);
    if (range === "30D") return data.slice(-1); // mock: último mes
    return data.slice(-1); // "7D" mock: último mes
  }, [range]);

  const annual = useMemo(makeAnnualData, []);

  const chartRef = useRef<HTMLDivElement>(null);
  const onExportPDF = () => {
    // Stub simple: imprime el contenedor (puedes cambiar a jsPDF/html2canvas si quieres)
    window.print();
  };

  return (
    <div className={styles.wrap}>
      {/* Encabezado */}
      <header className={styles.header}>
        <h1 className={styles.hi}>Hola Amin</h1>
        <p className={styles.sub}>
          Aquí podrás visualizar el rendimiento de tus analistas en tiempo real,
          con indicadores diarios, mensuales y anuales para un control estratégico y eficiente.
        </p>
      </header>

      {/* KPIs */}
      <section className={styles.kpiGrid}>
        {kpis.map((k) => (
          <article key={k.title} className={styles.kpiCard}>
            <h4 className={styles.kpiTitle}>{k.title}</h4>
            <div className={styles.kpiRow}>
              <span className={styles.kpiValue}>{k.value}</span>
              {"delta" in k && k.delta && (
                <span className={`${styles.delta} ${k.up ? styles.up : styles.down}`}>
                  {k.up ? "▲" : "▼"} {k.delta}
                </span>
              )}
            </div>
          </article>
        ))}
      </section>

      {/* Chart + Daily Performance */}
      <section className={styles.grid}>
        <article className={`${styles.card} ${styles.span8}`} ref={chartRef}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>Cédulas por período</h3>
            <div className={styles.segmented}>
              {(["12M","6M","30D","7D"] as RangeKey[]).map((rk) => (
                <button
                  key={rk}
                  className={`${styles.segBtn} ${range===rk ? styles.segActive:''}`}
                  onClick={() => setRange(rk)}
                >
                  {rk==="12M"?"12 Meses": rk==="6M"?"6 Meses": rk==="30D"?"30 Días":"7 Días"}
                </button>
              ))}
              <button className={styles.pdfBtn} onClick={onExportPDF}>Exportar PDF</button>
            </div>
          </div>

          <div className={styles.chartBox}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthly} margin={{ left: 8, right: 8, top: 10 }}>
                <CartesianGrid stroke="#eee" vertical={false}/>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={{ stroke:"#e6e6e6" }}/>
                <YAxis tick={{ fontSize: 12 }} axisLine={{ stroke:"#e6e6e6" }}/>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #eee", boxShadow: "0 8px 20px rgba(0,0,0,.08)" }}
                />
                {/* Área bajo la serie vino */}
                <Area type="monotone" dataKey="pending" stroke="none" fill="#F9D9DB" />
                {/* Líneas */}
                <Line type="monotone" dataKey="pending" stroke="#7D1833" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="created" stroke="#E1B43A" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <aside className={`${styles.card} ${styles.span4}`}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>Seguimiento de rendimiento Diario</h3>
            <p className={styles.cardSub}>
              Cada analista aporta al resultado del equipo. Aquí podrás visualizar quién está cumpliendo sus metas.
            </p>
          </div>

          <ul className={styles.list}>
            {dailyPerf.map((p) => (
              <li key={p.name} className={styles.listItem}>
                <div className={styles.person}>
                  <span className={styles.avatar} style={{ background: p.color }}>
                    {p.name[0]}
                  </span>
                  <div className={styles.personText}>
                    <strong>{p.name}</strong>
                    <small>Tiene {Math.max(1, Math.round(p.pending/3))} cédulas por atender</small>
                  </div>
                </div>
                <span className={styles.count}>{p.pending}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {/* Annual metrics + ranking */}
      <section className={styles.grid}>
        <article className={`${styles.card} ${styles.span8}`}>
          <h3 className={styles.cardTitle}>Métricas Anuales</h3>
          <div className={styles.chartBoxTall}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={annual} margin={{ left: 8, right: 8, top: 10 }}>
                <CartesianGrid stroke="#eee" vertical={false}/>
                <XAxis dataKey="year" axisLine={{ stroke:"#e6e6e6" }}/>
                <YAxis axisLine={{ stroke:"#e6e6e6" }}/>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eee", boxShadow: "0 8px 20px rgba(0,0,0,.08)" }}/>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="rechazadas" stackId="a" fill="#E9CBA5" />
                <Bar dataKey="enProceso"  stackId="a" fill="#C98C5A" />
                <Bar dataKey="completas"  stackId="a" fill="#7D1833" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className={`${styles.card} ${styles.span4}`}>
          <div className={styles.cardHeadRow}>
            <h3 className={styles.cardTitle}>Seguimiento de Rendimiento</h3>
            <span className={styles.badge}>Anual</span>
          </div>

          <div className={styles.rankList}>
            {ranking.map((r) => (
              <div key={r.name} className={styles.rankRow}>
                <span className={styles.rankName}>{r.name}</span>
                <div className={styles.rankBar}>
                  <b style={{ width: `${(r.value/5735)*100}%` }} />
                </div>
                <span className={styles.rankVal}>{r.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
