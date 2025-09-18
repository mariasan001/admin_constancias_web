import s from "@/app/dashboard/estadisticas/section.module.css";

export default function Page(){
  return (
    <section className={s.wrap}>
      <h1 className={s.title}>Bitácora</h1>
      <p className={s.desc}>Listado de eventos y actividades recientes.</p>

      <div className={s.card}>
        <p className={s.desc}>Aquí va la tabla o timeline (placeholder).</p>
      </div>
    </section>
  );
}
