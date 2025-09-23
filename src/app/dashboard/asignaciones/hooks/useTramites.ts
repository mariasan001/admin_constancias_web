// src/app/(tu-ruta)/hooks/useTramites.ts
import { useEffect, useState } from "react";
import { searchTramites } from "@/features/tramites/tramite.service";
import type { Tramite } from "@/features/tramites/tramite.model";

/**
 * Hook para listar trámites con paginación, búsqueda y (opcional) filtro de no asignados.
 * - Expone setRows para actualización optimista desde la UI.
 */
export function useTramites(
  subWorkUnitId?: number,
  onlyUnassigned: boolean = false
) {
  const [rows, setRows] = useState<Tramite[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
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
      });
      setRows(res.content);
      setTotal(res.totalElements);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, q, subWorkUnitId, onlyUnassigned]);

  return {
    rows,
    setRows, // 👈 para updates optimistas
    page,
    setPage,
    size,
    setSize,
    total,
    q,
    setQ,
    loading,
    fetchList,
  };
}
