"use client";
import styles from "../crear.module.css";

export default function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: ()=>void; title: string }) {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e)=>e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h4>{title}</h4>
          <button className={styles.x} onClick={onClose}>×</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
