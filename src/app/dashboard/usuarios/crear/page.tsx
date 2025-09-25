"use client";

import React, { useEffect } from "react";
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
import Modal from "./components/Modal";

export default function CrearUsuariosPage() {
  const { user } = useAuthContext();

  // Subárea por defecto del líder
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

  // Modal de ALTA
  const [openNew, setOpenNew] = React.useState(false);

  // ===== FIX: cargar lista al tener subWorkUnitId (tras refresh) =====
  const ready = Boolean(subWorkUnitId);

  // Primer fetch al estar listo el id
  useEffect(() => {
    if (ready) {
      setPage(0);
      fetchList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Refetch en cambios de filtros/paginación
  useEffect(() => {
    if (ready) fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, query]);

  return (
    <section className={styles.wrap}>
      {/* Header compacto con CTA a la derecha */}
      <header className={styles.headerBar}>
        <div>
          <h1 className={styles.title}>Crear usuarios (Analistas)</h1>
          <p className={styles.desc}>Solo LÍDER. El analista debe pertenecer a tu misma área.</p>
        </div>

        <div className={styles.headerActions}>
          {/* Selector de subárea opcional en header (descomenta si lo quieres visible) */}
          {/*
          <select
            className={styles.subareaMini}
            value={subWorkUnitId || ""}
            onChange={(e)=>setSubWorkUnitId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Subárea…</option>
            {subareas.map(sa => <option key={sa.id} value={sa.id}>{sa.descArea}</option>)}
          </select>
          */}

          <button
            className={styles.primaryCta}
            onClick={() => setOpenNew(true)}
          >
            Crear nuevo usuario
          </button>
        </div>
      </header>

      {/* Tabla */}
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

      {/* MODAL: Alta nuevo analista */}
      {openNew && (
        <Modal title="Nuevo analista" onClose={() => setOpenNew(false)}>
          <AnalystForm
            subWorkUnitId={subWorkUnitId ?? 0}
            onCreated={() => { setOpenNew(false); fetchList(); }}
          />
        </Modal>
      )}

      {/* MODAL: Editar */}
      {edit && (
        <EditAnalystModal user={edit} onClose={() => { setEdit(null); fetchList(); }} />
      )}

      {/* MODAL: Cambiar contraseña */}
      {pwdFor && (
        <PasswordModal
          user={pwdFor}
          pwdNew={pwdNew}
          setPwdNew={setPwdNew}
          onSave={async () => { await changePwd(pwdFor.userId); setPwdFor(null); }}
          onClose={() => setPwdFor(null)}
        />
      )}
    </section>
  );
}
