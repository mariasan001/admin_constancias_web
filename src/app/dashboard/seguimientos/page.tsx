import s from "@/app/dashboard/page.module.css";

export default function Page(){
  return (
    <section className={s.wrap}>
      <h1 className={s.title}>Seguimientos</h1>
      <p className={s.desc}>Casos en curso y su estado.</p>

      <div className={s.card}>
        <p className={s.desc}>Kanban/tabla de seguimiento (placeholder).</p>
      </div>
    </section>
  );
}
