"use client";
import { useState } from "react";
import { updateAnalyst } from "@/features/analysts/service";
import type { SubareaUser, UpdateAnalystPayload } from "@/features/analysts/models";

import styles from "../crear.module.css";
import Modal from "./Modal";

export default function EditAnalystModal({ user, onClose }: { user: SubareaUser; onClose: ()=>void }) {
  const [data, setData] = useState<UpdateAnalystPayload>({
    name: user.fullName ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    subWorkUnitId: user.subWorkUnitId,
  });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAnalyst(user.userId, data);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={`Editar ${user.fullName}`}>
      <form className={styles.form} onSubmit={save}>
        <label>
          <span>Nombre completo</span>
          <input value={data.name || ""} onChange={(e)=>setData(d=>({...d,name:e.target.value}))} />
        </label>
        <label>
          <span>Email</span>
          <input type="email" value={data.email || ""} onChange={(e)=>setData(d=>({...d,email:e.target.value}))} />
        </label>
        <label>
          <span>Teléfono</span>
          <input value={data.phone || ""} onChange={(e)=>setData(d=>({...d,phone:e.target.value}))} />
        </label>
        <label>
          <span>Subárea</span>
          <input
            type="number"
            value={data.subWorkUnitId ?? 0}
            onChange={(e)=>setData(d=>({...d,subWorkUnitId:Number(e.target.value || 0)}))}
          />
        </label>

        <div className={styles.actions}>
          <button className={styles.primary} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
          <button type="button" className={styles.secondary} onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </Modal>
  );
}
