// Resumen de un trámite (lo que se usa en tablas)
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
  assignedTo?: string | null;
  assignedToName?: string | null;
  assignedAt?: string | null;
  docsCount: number;
};
// Página de trámites
export type TramitePage = {
  content: Tramite[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};


// tramite.model.ts
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
// tramite.model.ts
export interface TramiteType {
  id: number;
  descArea: string; // ⚡ aquí, no "description"
}