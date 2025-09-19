import { useEffect, useState, useMemo } from "react";
import { listSubareas, getSubareaById } from "@/features/catalogs/service";
import type { SubArea } from "@/features/catalogs/models";

export function useSubareas(defaultSub?: number) {
  // 👇 ahora es number | undefined (más limpio que usar "")
  const [subWorkUnitId, setSubWorkUnitId] = useState<number | undefined>(defaultSub);
  const [subareas, setSubareas] = useState<SubArea[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const size = 20;
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / size)), [total]);

  const fetch = async () => {
    const res = await listSubareas({ q: query, page, size });
    setSubareas(res.items);
    setTotal(res.total);
  };

  useEffect(() => { fetch(); }, [query, page]);

  // asegurar que el defaultSub esté en la lista
  useEffect(() => {
    if (!defaultSub) return;
    (async () => {
      if (subareas.some(s => s.id === defaultSub)) return;
      try {
        const sa = await getSubareaById(defaultSub);
        setSubareas(curr => [sa, ...curr]);
      } catch {}
    })();
  }, [defaultSub]);

  return { subareas, subWorkUnitId, setSubWorkUnitId, query, setQuery, page, setPage, totalPages, total, size, fetch };
}
