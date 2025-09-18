import api from "../../lib/apis";
import { LoginPayload, User } from "../auth/models";

export async function login(payload: LoginPayload): Promise<User> {
  // El server setea cookie; devolvemos el usuario (si la API lo regresa)
  const { data } = await api.post("/auth/login", payload);
  // Puede que data tenga { user: {...} }; normaliza:
  return (data?.user ?? data) as User;
}

export async function me(): Promise<User> {
  const { data } = await api.get("/auth/me");
  return data as User;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
