// src/features/tramites/tramite.model.ts

// ===== Listado =====
// ===== Listado =====
export type Tramite = {
  id: number;
  folio: string;
  tramiteTypeId: number;
  tramiteTypeDesc: string;
  statusId: number;
  statusDesc: string;

  requesterId: string;
  requesterName?: string | null;

  createdAt: string;

  // Asignación
  assignedTo?: string | null;
  assignedToName?: string | null;
  assignedAt?: string | null;

  // Quién asignó
  assignedBy?: string | null;
  assignedByName?: string | null;

  docsCount: number;

  // 🔥 NUEVOS (vienen en /api/tramites/search)
  adeudo?: number | null;        // ej. 3434, 0 o null
  noficio?: string | null;       // ej. "OF/DTI/123/2025"
  evidencia?: string | null;     // ej. "evidencias/xxx.jpg"
  enadeudo?: boolean | null;     // true/false/null

  // ⏱️ NUEVOS DE TIEMPO (SLA)
  remainingDays?: number | null; // días restantes para vencer (puede ser negativo)
  dueDate?: string | null;       // ISO date, ej. "2025-12-11"
  slaLabel?: string | null;      // ej. "EN TIEMPO" | "POR VENCER" | "VENCIDO"
};


// Página de resultados
export type TramitePage = {
  content: Tramite[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

// ===== Detalle =====
export interface TramiteHistoryItem {
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedAt: string;
  comment: string;
}

export interface TramiteDoc {
  id: number;
  docTypeId: number;
  docTypeDesc: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  downloadUrl: string;
}

export interface TramiteDetail {
  folio: string;
  tramiteType: string;
  userId: string;
  userName: string;
  currentStatus: string;
  createdAt: string;
  history: TramiteHistoryItem[];
}

export interface TramiteFull {
  history: TramiteDetail;
  docs: TramiteDoc[];
}

// Catálogo de tipos
export type TramiteType = {
  id: number;
  descArea: string;
};

// Analistas (para el selector)
export type Analyst = {
  userId: string;
  name: string;
  subWorkUnitId: number;
};
