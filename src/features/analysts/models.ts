/** =====================
 * Payloads para creación / actualización
 * ===================== */
export type CreateAnalystPayload = {
  userId: string;
  password: string;
  firstName: string;
  secondName?: string;
  name: string;
  email: string;
  phone?: string;
  subWorkUnitId: number;

  // Nuevos campos agregados
  rfc: string;
  curp: string;
  idPlaza: string;
  idSs: string;
  address: string;
  occupationDate: string; // formato ISO (yyyy-mm-dd)

  bankId: number; // relación con catálogo de bancos
  jobCodeId: string; // relación con catálogo de códigos de puesto
  roleIds: number[]; // arreglo de ids de roles
};

export type UpdateAnalystPayload = Partial<
  Omit<CreateAnalystPayload, "userId" | "password">
>;

/** =====================
 * Payloads específicos
 * ===================== */
export type SetStatusPayload = { active: boolean };
export type ChangePasswordPayload = { newPassword: string };

/** =====================
 * Respuesta de usuario analista
 * ===================== */
export type Role = {
  id: number;
  description: string;
};

export type CatalogItem<T = string | number> = {
  id: T;
  desc: string;
};

export type SubareaUser = {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  active: boolean;

  // Catálogos y descripciones
  workUnit?: CatalogItem<string>;
  subWorkUnit?: CatalogItem<number>;
  jobCode?: CatalogItem<string>;
  bank?: CatalogItem<number>;

  // Datos personales
  rfc?: string;
  curp?: string;
  idPlaza?: string;
  idSs?: string;
  address?: string;
  occupationDate?: string;

  // Roles asignados
  roles?: Role[];
};

/** =====================
 * Paginación genérica
 * ===================== */
export type Paged<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
};
