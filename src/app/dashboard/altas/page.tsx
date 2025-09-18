import s from "@/app/dashboard/section.module.css";

export default function Page(){
  return (
    <section className={s.wrap}>
      <h1 className={s.title}>Altas</h1>
      <p className={s.desc}>Registro de nuevas solicitudes.</p>

      <div className={s.card}>
        <p className={s.desc}>Formulario de alta (placeholder).</p>
      </div>
    </section>
  );
}
