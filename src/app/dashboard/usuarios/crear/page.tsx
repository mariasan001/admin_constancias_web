'use client';

import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import {
  createAnalyst, listUsersBySubarea, setAnalystStatus,
  updateAnalyst, changeAnalystPassword
} from "@/features/analysts/service";
import type {
  CreateAnalystPayload, SubareaUser, UpdateAnalystPayload
} from "@/features/analysts/models";

import { listSubareas, getSubareaById } from "@/features/catalogs/service";
import type { SubArea } from "@/features/catalogs/models";

import styles from "./crear.module.css";
import { UserPlus, Search, Pencil, KeyRound, Power, Loader2 } from "lucide-react";

export default function CrearUsuariosPage() {
  const { user } = useAuthContext();

  // ----- SUBÁREA (catálogos) -----
  const defaultSub = (user as any)?.subWorkUnitId || (user as any)?.sub_work_unit_id || "";
  const [subWorkUnitId, setSubWorkUnitId] = useState<number | "">(defaultSub ? Number(defaultSub) : "");
  const [subareas, setSubareas] = useState<SubArea[]>([]);
  const [saQuery, setSaQuery] = useState("");
  const [saPage, setSaPage] = useState(0);
  const saSize = 20;
  const [saTotal, setSaTotal] = useState(0);
  const totalSaPages = useMemo(() => Math.max(1, Math.ceil(saTotal / saSize)), [saTotal]);

  const fetchSubareas = async () => {
    const res = await listSubareas({ q: saQuery, page: saPage, size: saSize });
    setSubareas(res.items);
    setSaTotal(res.total);
  };
  useEffect(() => { fetchSubareas(); }, [saQuery, saPage]);

  // Asegurar que la subárea por defecto esté en el select
  useEffect(() => {
    (async () => {
      const id = Number(defaultSub);
      if (!id) return;
      if (subareas.some(s => s.id === id)) return;
      try {
        const sa = await getSubareaById(id);
        setSubareas(curr => [sa, ...curr]);
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSub]);

  // ----- FORM ALTA -----
  const [form, setForm] = useState<CreateAnalystPayload>({
    userId: "",
    password: "",
    firstName: "",
    secondName: "",
    name: "",
    email: "",
    phone: "",
    subWorkUnitId: Number(defaultSub) || 0,
  });
  useEffect(() => {
    if (subWorkUnitId) setForm(f => ({ ...f, subWorkUnitId: Number(subWorkUnitId) }));
  }, [subWorkUnitId]);

  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setErr(null);
    try {
      setCreating(true);
      await createAnalyst(form);
      setMsg("Analista creado correctamente.");
      setForm(f => ({ ...f, userId:"", password:"", firstName:"", secondName:"", name:"", email:"", phone:"" }));
      fetchList();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo crear el usuario.");
    } finally {
      setCreating(false);
    }
  };

  // ----- LISTADO -----
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [onlyAnalysts, setOnlyAnalysts] = useState(true);
  const [rows, setRows] = useState<SubareaUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    if (!subWorkUnitId) return;
    setLoading(true);
    try {
      const res = await listUsersBySubarea({
        subWorkUnitId: Number(subWorkUnitId), q, page, size, onlyAnalysts
      });
      setRows(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [subWorkUnitId, page, size, onlyAnalysts]);

  // ----- ACCIONES DE FILA -----
  const toggleActive = async (u: SubareaUser) => {
    await setAnalystStatus(u.userId, !u.active);
    fetchList();
  };

  const [edit, setEdit] = useState<null | SubareaUser>(null);
  const [pwdFor, setPwdFor] = useState<null | SubareaUser>(null);
  const [pwdNew, setPwdNew] = useState("");

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);

  return (
    <section className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>Crear usuarios (Analistas)</h1>
        <p className={styles.desc}>Solo LÍDER. El analista debe pertenecer a tu misma área.</p>
      </div>

      <div className={styles.grid}>
        {/* ---------- Alta ---------- */}
        <article className={styles.card}>
          <h3 className={styles.cardTitle}><UserPlus className={styles.icon}/> Alta de Analista</h3>

          <form className={styles.form} onSubmit={onCreate}>
            <div className={styles.row2}>
              <label>
                <span>Buscar subárea</span>
                <input
                  className={styles.search}
                  placeholder="Escribe para filtrar…"
                  value={saQuery}
                  onChange={(e) => { setSaPage(0); setSaQuery(e.target.value); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setSaPage(0); } }}
                />
                <small className={styles.hint}>Resultados: {saTotal}</small>
              </label>

              <label>
                <span>Subárea</span>
                <select
                  value={subWorkUnitId || ""}
                  onChange={(e) => setSubWorkUnitId(e.target.value ? Number(e.target.value) : "")}
                  required
                  className={styles.select}
                >
                  <option value="">Selecciona…</option>
                  {subareas.map(sa => (
                    <option key={sa.id} value={sa.id}>{sa.descArea}</option>
                  ))}
                </select>

                <div className={styles.comboPager}>
                  <button type="button" disabled={saPage <= 0} onClick={() => setSaPage(p => p - 1)}>◀</button>
                  <span>{saPage + 1} / {totalSaPages}</span>
                  <button type="button" disabled={saPage + 1 >= totalSaPages} onClick={() => setSaPage(p => p + 1)}>▶</button>
                </div>
              </label>
            </div>

            <div className={styles.row2}>
              <label>
                <span>User ID</span>
                <input value={form.userId} onChange={(e)=>setForm(f=>({...f,userId:e.target.value}))} required />
              </label>
              <label>
                <span>Contraseña inicial</span>
                <input type="password" value={form.password} onChange={(e)=>setForm(f=>({...f,password:e.target.value}))} required />
              </label>
            </div>

            <div className={styles.row2}>
              <label>
                <span>Nombre(s)</span>
                <input value={form.firstName} onChange={(e)=>setForm(f=>({...f,firstName:e.target.value}))} />
              </label>
              <label>
                <span>Apellido(s)</span>
                <input value={form.secondName} onChange={(e)=>setForm(f=>({...f,secondName:e.target.value}))} />
              </label>
            </div>

            <label>
              <span>Nombre completo</span>
              <input value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} required />
            </label>

            <div className={styles.row2}>
              <label>
                <span>Email</span>
                <input type="email" value={form.email} onChange={(e)=>setForm(f=>({...f,email:e.target.value}))} required />
              </label>
              <label>
                <span>Teléfono</span>
                <input value={form.phone} onChange={(e)=>setForm(f=>({...f,phone:e.target.value}))} />
              </label>
            </div>

            {err && <p className={styles.error}>{err}</p>}
            {msg && <p className={styles.ok}>{msg}</p>}

            <div className={styles.actions}>
              <button className={styles.primary} disabled={creating}>
                {creating ? <><Loader2 className={styles.spin}/> Creando…</> : "Crear usuario"}
              </button>
            </div>
          </form>
        </article>

        {/* ---------- Listado ---------- */}
        <article className={styles.card}>
          <div className={styles.listHead}>
            <h3 className={styles.cardTitle}>Usuarios por Subárea</h3>
            <div className={styles.filters}>
              <div className={styles.inputIcon}>
                <Search className={styles.inputIconI}/>
                <input
                  placeholder="Buscar por userId / nombre / email"
                  value={q}
                  onChange={(e)=>setQ(e.target.value)}
                  onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); setPage(0); fetchList(); } }}
                />
              </div>
              <button className={styles.secondary} onClick={()=>{ setPage(0); fetchList(); }}>Buscar</button>
              <label className={styles.chk}>
                <input type="checkbox" checked={onlyAnalysts} onChange={(e)=>{ setPage(0); setOnlyAnalysts(e.target.checked); }} />
                Solo analistas
              </label>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>UserId</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Activo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className={styles.center}>Cargando…</td></tr>
                ) : rows.length ? rows.map(u => (
                  <tr key={u.userId}>
                    <td>{u.userId}</td>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || "-"}</td>
                    <td>
                      <span className={`${styles.badge} ${u.active?styles.okB:styles.errB}`}>
                        {u.active ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <button className={styles.iconBtn} title="Editar" onClick={()=>setEdit(u)}><Pencil/></button>
                      <button className={styles.iconBtn} title="Cambiar contraseña" onClick={()=>{ setPwdFor(u); setPwdNew(""); }}><KeyRound/></button>
                      <button className={styles.iconBtn} title={u.active?"Desactivar":"Activar"} onClick={()=>toggleActive(u)}>
                        <Power className={u.active?styles.warn:undefined}/>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className={styles.center}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <div>Registros: {total}</div>
            <div className={styles.pager}>
              <button disabled={page<=0} onClick={()=>setPage(p=>p-1)}>«</button>
              <span>{page+1} / {totalPages}</span>
              <button disabled={page+1>=totalPages} onClick={()=>setPage(p=>p+1)}>»</button>
              <select value={size} onChange={(e)=>{ setPage(0); setSize(Number(e.target.value)); }}>
                {[10,20,50].map(n=><option key={n} value={n}>{n}/pág</option>)}
              </select>
            </div>
          </div>
        </article>
      </div>

      {/* ---------- MODAL EDITAR ---------- */}
      {edit && (
        <Modal onClose={()=>setEdit(null)} title={`Editar ${edit.fullName}`}>
          <EditForm
            user={edit}
            onClose={()=>{ setEdit(null); fetchList(); }}
          />
        </Modal>
      )}

      {/* ---------- MODAL PASSWORD ---------- */}
      {pwdFor && (
        <Modal onClose={()=>setPwdFor(null)} title={`Cambiar contraseña a ${pwdFor.fullName}`}>
          <form className={styles.form}
            onSubmit={async (e)=>{
              e.preventDefault();
              await changeAnalystPassword(pwdFor.userId, pwdNew);
              setPwdFor(null);
            }}>
            <label>
              <span>Nueva contraseña</span>
              <input type="password" value={pwdNew} onChange={(e)=>setPwdNew(e.target.value)} required />
            </label>
            <div className={styles.actions}>
              <button className={styles.primary}>Guardar</button>
              <button type="button" className={styles.secondary} onClick={()=>setPwdFor(null)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

/* ================== Auxiliares ================== */

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: ()=>void; title: string }) {
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

function EditForm({ user, onClose }: { user: SubareaUser; onClose: ()=>void }) {
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
        <span>Subárea (subWorkUnitId)</span>
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
  );
}
 /**
  * estoy obtendo un erro al crear un nueco analista no me marca ningun erro 
  *  solo dice algo d eiciar seison y rmapiadamete me saca 
  * recierda a crea debe de ser eso  y no scar d ela sesion impreme lso erro en la consola 
  */