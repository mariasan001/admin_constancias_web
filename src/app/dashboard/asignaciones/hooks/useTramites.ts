// src/app/(tu-ruta)/hooks/useTramites.ts
import { useEffect, useState } from "react";
import { searchTramites } from "@/features/tramites/tramite.service";
import type { Tramite } from "@/features/tramites/tramite.model";
import api from "@/lib/apis";

/**
 * Hook para listar trámites con paginación y filtros.
 * Ahora acepta:
 *  - subWorkUnitId: para líderes/admin
 *  - onlyUnassigned: si quieres solo no asignados
 *  - assignedTo: para modo analista (solo lo suyo)
 */
export function useTramites(
  subWorkUnitId?: number,
  onlyUnassigned: boolean = false,
  assignedTo?: string
) {
  const [rows, setRows]   = useState<Tramite[]>([]);
  const [page, setPage]   = useState(0);
  const [size, setSize]   = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await searchTramites({
        subWorkUnitId,
        q,
        page,
        size,
        ...(onlyUnassigned ? { assigned: false } : {}),
        ...(assignedTo ? { assignedTo } : {}),
      });
      setRows(res.content);
      setTotal(res.totalElements);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // importante: dependencias incluyen assignedTo
  }, [page, size, q, subWorkUnitId, onlyUnassigned, assignedTo]);

  return {
    rows, setRows,
    page, setPage,
    size, setSize,
    total,
    q, setQ,
    loading,
    fetchList,
  };
}

/* (se mantiene si lo usas en otros lados) */
export async function assignTramite(folio: string, assigneeUserId: string) {
  const payload = {
    assigneeUserId,
    comment: "Asignación por carga de trabajo",
    newStatusId: 2,
  };
  const { data } = await api.patch(
    `/api/tramites/tickets/${encodeURIComponent(folio)}/assign`,
    payload
  );
  return data;
}
