"use client";
import { useEffect, useRef, useState } from "react";
import { createAnalyst } from "@/features/analysts/service";
import type { CreateAnalystPayload } from "@/features/analysts/models";
import { Loader2, UserPlus } from "lucide-react";
import styles from "../crear.module.css";

export default function AnalystForm({
  subWorkUnitId,
  onCreated,
}: { subWorkUnitId: number; onCreated: () => void }) {
  const [form, setForm] = useState<CreateAnalystPayload>({
    userId: "",
    password: "",
    firstName: "",
    secondName: "",
    name: "",
    email: "",
    phone: "",
    subWorkUnitId,
  });

  // Trackea si el usuario editó manualmente el "Nombre completo"
  const [nameDirty, setNameDirty] = useState(false);

  // Ref para manejar el caret en el email
  const emailRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Sincroniza subWorkUnitId si cambia
  useEffect(() => {
    if (subWorkUnitId) setForm(f => ({ ...f, subWorkUnitId }));
  }, [subWorkUnitId]);

  // 👉 Autollenado de "Nombre completo"
  useEffect(() => {
    if (nameDirty) return; // respeta si el usuario ya lo editó manual
    const full = [form.firstName?.trim(), form.secondName?.trim()]
      .filter(Boolean)
      .join(" ");
    setForm(f => ({ ...f, name: full }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.firstName, form.secondName, nameDirty]);

  // Helpers para el email
  const ensureAtOnFocus = () => {
    if (!form.email) {
      // coloca "@" y mueve el caret al inicio para escribir antes del arroba
      setForm(f => ({ ...f, email: "@" }));
      requestAnimationFrame(() => {
        const el = emailRef.current;
        if (el) el.setSelectionRange(0, 0);
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setErr(null);
    try {
      setLoading(true);
      await createAnalyst(form);
      setMsg("Analista creado correctamente.");
      setForm(f => ({
        ...f,
        userId: "", password: "", firstName: "", secondName: "",
        name: "", email: "", phone: "", subWorkUnitId
      }));
      setNameDirty(false);
      onCreated();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo crear el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <h3 className={styles.cardTitle}><UserPlus className={styles.icon}/> Alta de Analista</h3>

      <div className={styles.row2}>
        <label>
          <span>User ID</span>
          <input
            value={form.userId}
            onChange={(e)=>setForm(f=>({...f,userId:e.target.value}))}
            required
          />
        </label>
        <label>
          <span>Contraseña inicial</span>
          <input
            type="password"
            value={form.password}
            onChange={(e)=>setForm(f=>({...f,password:e.target.value}))}
            required
          />
        </label>
      </div>

      <div className={styles.row2}>
        <label>
          <span>Nombre(s)</span>
          <input
            value={form.firstName}
            onChange={(e)=>setForm(f=>({...f,firstName:e.target.value}))}
          />
        </label>
        <label>
          <span>Apellido(s)</span>
          <input
            value={form.secondName}
            onChange={(e)=>setForm(f=>({...f,secondName:e.target.value}))}
          />
        </label>
      </div>

      <label>
        <span>Nombre completo</span>
        <input
          value={form.name}
          onChange={(e)=>{ setNameDirty(true); setForm(f=>({...f,name:e.target.value})) }}
          placeholder="Se autollenará con Nombre(s) + Apellido(s)"
        />
      </label>

      <div className={styles.row2}>
        <label>
          <span>Email</span>
          <input
            ref={emailRef}
            value={form.email}
            onFocus={ensureAtOnFocus}
            onChange={(e)=>setForm(f=>({...f,email:e.target.value}))}
            placeholder="usuario@dominio.com"
            type="email"
          />
        </label>
        <label>
          <span>Teléfono</span>
          <input
            value={form.phone}
            onChange={(e)=>setForm(f=>({...f,phone:e.target.value}))}
          />
        </label>
      </div>

      {err && <p className={styles.error}>{err}</p>}
      {msg && <p className={styles.ok}>{msg}</p>}

      <button className={styles.primary} disabled={loading}>
        {loading ? <><Loader2 className={styles.spin}/> Creando…</> : "Crear usuario"}
      </button>
    </form>
  );
}
