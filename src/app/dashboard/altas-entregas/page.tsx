import s from "@/app/dashboard/section.module.css";

export default function Page(){
  return (
    <section className={s.wrap}>
      <h1 className={s.title}>Altas y entregas</h1>
      <p className={s.desc}>Recepción y entrega de documentación.</p>

      <div className={s.card}>
        <p className={s.desc}>Formulario + listado (placeholder).</p>
      </div>
    </section>
  );
}
