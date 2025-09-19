import { useEffect, useState } from "react";
import { searchTramites } from "@/features/tramites/tramite.service";
import type { Tramite } from "@/features/tramites/tramite.model";

export function useTramites(subWorkUnitId?: number) {
  const [rows, setRows] = useState<Tramite[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await searchTramites({ subWorkUnitId, q, page, size });
      setRows(res.content);
      setTotal(res.totalElements);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, [page, size, q, subWorkUnitId]);

  return { rows, page, setPage, size, setSize, total, q, setQ, loading, fetchList };
}
