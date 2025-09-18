import s from "@/app/dashboard/page.module.css";

export default function Page(){
  return (
    <section className={s.wrap}>
      <h1 className={s.title}>Asignaciones</h1>
      <p className={s.desc}>Gestión de tareas y responsables.</p>

      <div className={s.card}>
        <p className={s.desc}>Tablas/listas de asignaciones (placeholder).</p>
      </div>
    </section>
  );
}
