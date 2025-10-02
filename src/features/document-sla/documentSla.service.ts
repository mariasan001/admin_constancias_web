// src/features/document-sla/documentSla.service.ts
import api from "@/lib/apis";
import type { DocumentSla, DocumentSlaPage } from "./documentSla.model";

export async function listDocumentSlas(params: {
  q?: string;
  activeOnly?: boolean;
  page?: number;
  size?: number;
  sort?: string; // ej. "name,asc"
}): Promise<DocumentSlaPage> {
  const { data } = await api.get("/api/document-slas", { params });
  return data;
}

export async function getDocumentSla(id: number): Promise<DocumentSla> {
  const { data } = await api.get(`/api/document-slas/${id}`);
  return data;
}

export async function getDocumentSlaByCode(code: string): Promise<DocumentSla> {
  const { data } = await api.get(`/api/document-slas/code/${encodeURIComponent(code)}`);
  return data;
}

export async function createDocumentSla(payload: {
  code: string;
  name: string;
  responseDays: number;
  workingDays: boolean;
  graceDays: number;
}): Promise<DocumentSla> {
  const { data } = await api.post("/api/document-slas", payload);
  return data;
}

export async function updateDocumentSla(id: number, payload: {
  code: string;
  name: string;
  responseDays: number;
  workingDays: boolean;
  graceDays: number;
  isActive?: boolean; // por si tu backend lo acepta en PUT
}): Promise<DocumentSla> {
  const { data } = await api.put(`/api/document-slas/${id}`, payload);
  return data;
}

export async function deleteDocumentSla(id: number): Promise<void> {
  await api.delete(`/api/document-slas/${id}`);
}

export async function deactivateDocumentSla(id: number): Promise<void> {
  await api.patch(`/api/document-slas/${id}/deactivate`);
}

export async function activateDocumentSla(id: number): Promise<void> {
  await api.patch(`/api/document-slas/${id}/activate`);
}
