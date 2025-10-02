// src/features/document-sla/documentSla.model.ts
export type DocumentSla = {
  id: number;
  code: string;
  name: string;
  responseDays: number;
  workingDays: boolean;
  graceDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DocumentSlaPage = {
  content: DocumentSla[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};
