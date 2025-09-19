// src/features/auth/models.ts

export type CatalogItem<T = string | number> = {
  id: T;
  desc: string;
};

export type Role = {
  id: number;
  description: string;
};

export type User = {
  userId: string;
  name: string;
  email: string;

  workUnit?: CatalogItem<string>;
  subWorkUnit?: CatalogItem<number>;
  jobCode?: CatalogItem<string>;
  bank?: CatalogItem<number>;

  rfc?: string;
  curp?: string;
  idPlaza?: string;
  idSs?: string;
  phone?: string;
  address?: string;
  occupationDate?: string;

  roles: Role[];
};

export type LoginPayload = {
  username: string;
  password: string;
  captchaToken?: string; // si lo usas
};
