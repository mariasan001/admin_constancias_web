"use client";

import { useAuthContext } from "@/context/AuthContext";
import styles from "./crear.module.css";

// Hooks
import { useSubareas } from "./hooks/useSubareas";
import { useAnalysts } from "./hooks/useAnalysts";

// Componentes
import AnalystForm from "./components/AnalystForm";
import UsersTable from "./components/UsersTable";
import EditAnalystModal from "./components/EditAnalystModal";
import PasswordModal from "./components/PasswordModal";

export default function CrearUsuariosPage() {
  const { user } = useAuthContext();

  // 👇 Tomar el ID de la subárea del líder logueado
  const defaultSub = user?.subWorkUnit?.id;

  // ----- SUBÁREAS -----
  const {
    subareas, subWorkUnitId, setSubWorkUnitId,
    query, setQuery, page, setPage, totalPages, total, fetch
  } = useSubareas(defaultSub);

  // ----- ANALYSTS -----
  const {
    rows, totalUsers, loading,
    size, setSize,
    fetchList, toggleActive,
    edit, setEdit, pwdFor, setPwdFor, pwdNew, setPwdNew, changePwd
  } = useAnalysts(subWorkUnitId);

  return (
    <section className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>Crear usuarios (Analistas)</h1>
        <p className={styles.desc}>Solo LÍDER. El analista debe pertenecer a tu misma área.</p>
      </div>

      <div className={styles.grid}>
        {/* Alta */}
        <article className={styles.card}>
          <AnalystForm subWorkUnitId={subWorkUnitId ?? 0} onCreated={fetchList}/>
        </article>

        {/* Listado */}
        <article className={styles.card}>
          <UsersTable
            rows={rows}
            total={totalUsers}
            page={page}
            setPage={setPage}
            size={size}
            setSize={setSize}
            loading={loading}
            totalPages={totalPages}
            toggleActive={toggleActive}
            setEdit={setEdit}
            setPwdFor={setPwdFor}
            query={query}
            setQuery={setQuery}
            fetchList={fetchList}
          />
        </article>
      </div>

      {edit && (
        <EditAnalystModal user={edit} onClose={()=>{ setEdit(null); fetchList(); }}/>
      )}

      {pwdFor && (
        <PasswordModal
          user={pwdFor}
          pwdNew={pwdNew}
          setPwdNew={setPwdNew}
          onSave={async ()=>{ await changePwd(pwdFor.userId); setPwdFor(null); }}
          onClose={()=>setPwdFor(null)}
        />
      )}
    </section>
  );
}
