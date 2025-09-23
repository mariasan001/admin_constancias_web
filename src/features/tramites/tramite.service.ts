// src/features/tramites/tramite.service.ts
import api from "@/lib/apis";
import type {
  TramiteFull,
  TramitePage,
  TramiteType,
  Analyst,
} from "./tramite.model";

/* =========================================================
 * 🔍 Búsqueda de trámites con filtros
 * =======================================================*/
export async function searchTramites(params: {
  subWorkUnitId?: number;
  statusId?: number;
  assignedTo?: string;
  assigned?: boolean; // true/false para filtrar asignados / no asignados
  q?: string;
  page?: number;
  size?: number;
}): Promise<TramitePage> {
  const { data } = await api.get("/api/tramites/search", { params });
  return data as TramitePage;
}

/* =========================================================
 * 📄 Obtener un trámite completo por folio
 * =======================================================*/
export async function getTramiteByFolio(folio: string): Promise<TramiteFull> {
  const { data } = await api.get(`/api/tramites/${encodeURIComponent(folio)}/full`);
  return data as TramiteFull;
}

/* =========================================================
 * 🔄 Cambio de tipo de trámite
 * =======================================================*/
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

/* =========================================================
 * 📋 Catálogo de tipos de trámite
 * =======================================================*/
export async function listTramiteTypes(): Promise<TramiteType[]> {
  const { data } = await api.get("/api/catalogs", { params: { size: 100 } });
  return data?.content ?? [];
}

/* =========================================================
 * 🔄 Cambio de estatus
 * =======================================================*/
export async function changeTramiteStatus(
  folio: string,
  toStatusId: number,
  actorUserId: string,
  actorUserName: string
) {
  const comment = `Cambio hecho por ${actorUserName}`;
  const { data } = await api.patch(
    `/api/tramites/${encodeURIComponent(folio)}/status`,
    { toStatusId, actorUserId, comment }
  );
  return data;
}

/* =========================================================
 * ✅ Asignación de analista
 * =======================================================*/
export async function assignTramite(folio: string, assigneeUserId: string) {
  const payload = {
    assigneeUserId,
    comment: "Asignación por carga de trabajo",
    newStatusId: 2, // ASIGNADO
  };

  const { data } = await api.patch(
    `/api/tramites/tickets/${encodeURIComponent(folio)}/assign`,
    payload
  );
  return data;
}

/* =========================================================
 * 👥 Lista de analistas por subárea (para el selector)
 * Backend: GET /api/users/by-subarea?subWorkUnitId=...&onlyAnalysts=true&page=0&size=200
 * =======================================================*/
export async function listAnalystsBySubarea(
  subWorkUnitId: number
): Promise<Analyst[]> {
  const { data } = await api.get("/api/users/by-subarea", {
    params: {
      subWorkUnitId,
      onlyAnalysts: true,
      page: 0,
      size: 200,
    },
  });

  // La API responde { content: [...] } o lista directa: soportamos ambos.
  const list = (data?.content ?? data) as Array<{
    userId: string;
    fullName?: string;
    name?: string;
    subWorkUnitId: number;
  }>;

  return list.map((u) => ({
    userId: u.userId,
    name: u.fullName ?? u.name ?? u.userId, // fallback elegante
    subWorkUnitId: u.subWorkUnitId,
  }));
}
