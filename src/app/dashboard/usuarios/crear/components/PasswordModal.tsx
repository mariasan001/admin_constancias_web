"use client";
import styles from "../crear.module.css";
import type { SubareaUser } from "@/features/analysts/models";
import Modal from "./Modal";

export default function PasswordModal({
  user, pwdNew, setPwdNew, onSave, onClose
}: { user: SubareaUser; pwdNew: string; setPwdNew: (s:string)=>void; onSave: ()=>void; onClose: ()=>void }) {
  return (
    <Modal onClose={onClose} title={`Cambiar contraseña a ${user.fullName}`}>
      <form className={styles.form} onSubmit={(e)=>{ e.preventDefault(); onSave(); }}>
        <label>
          <span>Nueva contraseña</span>
          <input type="password" value={pwdNew} onChange={(e)=>setPwdNew(e.target.value)} required />
        </label>
        <div className={styles.actions}>
          <button className={styles.primary}>Guardar</button>
          <button type="button" className={styles.secondary} onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </Modal>
  );
}
