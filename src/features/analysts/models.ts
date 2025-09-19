export type CreateAnalystPayload = {
  userId: string;
  password: string;
  firstName: string;
  secondName?: string;
  name: string;
  email: string;
  phone?: string;
  subWorkUnitId: number;
};

export type UpdateAnalystPayload = Partial<Omit<CreateAnalystPayload, "userId" | "password">>;

export type SetStatusPayload = { active: boolean };
export type ChangePasswordPayload = { newPassword: string };

export type SubareaUser = {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  active: boolean;
  workUnit?: string;
  subWorkUnitId?: number;
  subWorkUnitDesc?: string;
  roles?: string[];
};

export type Paged<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
};
