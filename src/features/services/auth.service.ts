// src/features/auth/service.ts

import api from "../../lib/apis";
import { LoginPayload, User } from "../auth/models";

export async function login(payload: LoginPayload): Promise<User> {
  const { data } = await api.post("/auth/login", payload);
  return (data?.user ?? data) as User;
}

export async function me(): Promise<User> {
  const { data } = await api.get("/auth/me");
  return (data?.user ?? data) as User;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
