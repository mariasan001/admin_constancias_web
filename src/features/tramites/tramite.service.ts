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
 * 🔄 Cambio de estatus (soporta multipart cuando hay evidencia)
 *  - FINALIZADO: evidencia + data (multipart)
 *  - Otros estatus: data = null (JSON)
 * =======================================================*/

type CommonData = {
  toStatusId: number;
  actorUserId: string;
  comment: string | "null";
  adeudo: number | null;
  noficio: string | "null";
  enadeudo: boolean | null;
};

/**
 * Cambia estatus de un trámite.
 * - Para TODOS los estatus, el backend requiere query param `data` (String).
 * - FINALIZADO (4): además se envía evidencia en multipart.
 */
export async function changeTramiteStatus(
  folio: string,
  toStatusId: number,
  opts: {
    actorUserId: string;

    // Para FINALIZADO (4):
    evidencia?: File | Blob | null;
    fin_adeudo?: number;        // adeudo para 4
    fin_noficio?: string;       // noficio para 4
    fin_enAdeudo?: boolean;     // enadeudo para 4

    // Para estados ≠ 4 (opcional):
    // si no provees noficioNoAdeudo, se mandan nulls.
    noficioNoAdeudo?: string;   // si hay oficio pero adeudo=0 y enadeudo=false
  }
) {
  const isFinalizado = Number(toStatusId) === 4;

  if (isFinalizado) {
    const dataObj: CommonData = {
      toStatusId,
      actorUserId: opts.actorUserId,
      comment: "Se aprobó con oficio y evidencia",
      adeudo: Number(opts.fin_adeudo ?? 0),
      noficio: String(opts.fin_noficio ?? ""),
      enadeudo: Boolean(opts.fin_enAdeudo ?? false),
    };

    const fd = new FormData();
    if (opts.evidencia) fd.append("evidencia", opts.evidencia as Blob);

    const { data } = await api.patch(
      `/api/tramites/${encodeURIComponent(folio)}/status`,
      fd,
      {
        params: { data: JSON.stringify(dataObj) }, // <- data SIEMPRE en query
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  }

  // ===== Estatus distintos a 4 =====
  const hasOficio = !!opts.noficioNoAdeudo?.trim();

  const dataObj: CommonData = hasOficio
    // Caso B: NO hay adeudo pero sí oficio
    ? {
        toStatusId,
        actorUserId: opts.actorUserId,
        comment: "null",
        adeudo: 0,
        noficio: String(opts.noficioNoAdeudo),
        enadeudo: false,
      }
    // Caso A: todo null (sin oficio, sin adeudo)
    : {
        toStatusId,
        actorUserId: opts.actorUserId,
        comment: "null",
        adeudo: null,
        noficio: "null",
        enadeudo: null,
      };

  const { data } = await api.patch(
    `/api/tramites/${encodeURIComponent(folio)}/status`,
    {}, // body vacío; el backend lee `data` del query
    { params: { data: JSON.stringify(dataObj) } }
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


/**
 * aremos una actualziacion :
 * actuamente tenemso esto per  ahora ya que colcoar si es adeudo o no.,  el moneto 
 * el numero de oficion   y la idenvia todo es flujone st abine 
 * 
 * pero como se añadieorn estyo s campos mas o esta pai mas 
 * se tiene que hacer una modificacion en una de la spais ára que
 * nos triga pues la respuesta:
 * 
 * ahora acumente se ve por ejplo en: monto  numeor d eoficon  u  envidencia 
 * comoedicion  y.. si esta bine pero creo esteicmente severi amejor 
 * que se avilita la decicon  cuando de da clcie en el campo a ediotar
 *  ahora si ya se subiop algo :  debde de tate su info que se tiene }
 * como es  el tipod eadeudio si si o no ,  en moento mostrar elmonto peroya no asi cmoe dicion
 * que si se peude ediar pero al dar dobl eclci  el nmero de forlio con su nuemro que sel e dio,  y en evivencia el nobmre de la endicencia 
 * si no han subido nada..  en monto cocoar $0.00 eñ de si adeiddo o no  cmo apagado 
 * el nmeor de ifcion colar sin nuero d eoficion  y en enviceia sin evidencia  al dar lci ahor asi ay suvir tdo 
 * recuerd ano mmovert nada de lo que ya est aehco  te pasare los codigo involucrado s */