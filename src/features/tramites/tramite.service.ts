import api from "@/lib/apis";
import type { TramiteFull, TramitePage, TramiteType } from "./tramite.model";

// 🔍 Búsqueda de trámites con filtros
export async function searchTramites(params: {
  subWorkUnitId?: number;
  statusId?: number;
  assignedTo?: string;
  assigned?: boolean;
  q?: string;
  page?: number;
  size?: number;
}): Promise<TramitePage> {
  const { data } = await api.get("/api/tramites/search", { params });
  return data as TramitePage;
}

// 📄 Obtener un trámite completo por folio
export async function getTramiteByFolio(folio: string): Promise<TramiteFull> {
  const { data } = await api.get(`/api/tramites/${folio}/full`);
  return data as TramiteFull;
}

// 🔄 Cambio de tipo de trámite
export async function changeTramiteType(
  folio: string,
  newTypeId: number,
  comment: string
) {
  const { data } = await api.patch(
    `/api/tramites/type/${encodeURIComponent(folio)}/change-type`,
    { newTypeId, comment }
  );
  return data;
}

// 📋 Catálogo de tipos de trámite
export async function listTramiteTypes(): Promise<TramiteType[]> {
  const { data } = await api.get("/api/catalogs", { params: { size: 100 } });
  return data?.content ?? [];
}

// 🔄 Cambio de estatus
export async function changeTramiteStatus(
  folio: string,
  toStatusId: number,
  actorUserId: string,
  actorUserName: string
) {
  const comment = `Cambio hecho por ${actorUserName}`;
  const { data } = await api.patch(
    `/api/tramites/${encodeURIComponent(folio)}/status`,
    {
      toStatusId,
      actorUserId,
      comment,
    }
  );
  return data;
}
