
import api from "@/lib/apis";
import type {
  CreateAnalystPayload, UpdateAnalystPayload,
  SetStatusPayload, ChangePasswordPayload,
  SubareaUser, Paged
} from "./models";

export async function createAnalyst(payload: CreateAnalystPayload) {
  const { data } = await api.post("/api/users/analysts/create", payload);
  return data;
}

export async function updateAnalyst(userId: string, payload: UpdateAnalystPayload) {
  const { data } = await api.put(`/api/users/analysts/${encodeURIComponent(userId)}`, payload);
  return data;
}

export async function setAnalystStatus(userId: string, active: boolean) {
  const { data } = await api.patch(`/api/users/analysts/${encodeURIComponent(userId)}/status`, { active } as SetStatusPayload);
  return data;
}

export async function changeAnalystPassword(userId: string, newPassword: string) {
  const { data } = await api.patch(`/api/users/analysts/${encodeURIComponent(userId)}/password`, { newPassword } as ChangePasswordPayload);
  return data;
}

export async function listUsersBySubarea(params: {
  subWorkUnitId: number;
  q?: string;
  page?: number;
  size?: number;
  onlyAnalysts?: boolean;
}): Promise<Paged<SubareaUser>> {
  const { subWorkUnitId, q, page = 0, size = 20, onlyAnalysts = false } = params;
  const { data } = await api.get("/api/users/by-subarea", {
    params: { subWorkUnitId, q, page, size, onlyAnalysts }
  });

  // Soporte flexible (array plano o paginado tipo Spring)
  if (Array.isArray(data)) {
    return { items: data as SubareaUser[], page, size, total: data.length };
  }
  if (Array.isArray(data?.content)) {
    return { items: data.content as SubareaUser[], page: data.pageable?.pageNumber ?? page, size: data.pageable?.pageSize ?? size, total: data.totalElements ?? data.content.length };
  }
  // A veces devuelven un solo objeto (unlikely)
  return { items: data ? [data as SubareaUser] : [], page, size, total: data ? 1 : 0 };
}
