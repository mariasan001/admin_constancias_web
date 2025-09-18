// src/features/catalogs/service.ts

import api from "@/lib/apis";
import type { SubArea, Paged } from "./models";

export async function listSubareas(params: { q?: string; page?: number; size?: number }): Promise<Paged<SubArea>> {
  const { q, page = 0, size = 20 } = params ?? {};
  const { data } = await api.get("/api/catalogs", { params: { q, page, size } });

  // Estructura Spring Page
  if (data && Array.isArray(data.content)) {
    return {
      items: data.content as SubArea[],
      page: data.pageable?.pageNumber ?? page,
      size: data.pageable?.pageSize ?? size,
      total: data.totalElements ?? data.content.length,
    };
  }

  // Plan B (por si acaso)
  if (Array.isArray(data)) return { items: data as SubArea[], page, size, total: data.length };
  return { items: [], page, size, total: 0 };
}

export async function getSubareaById(id: number): Promise<SubArea> {
  const { data } = await api.get(`/api/catalogs/${id}`);
  // Espera: { id, descArea }
  return data as SubArea;
}
