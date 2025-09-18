export type Role = { id: number; description: string };

export type User = {
  userId: string;
  name: string;
  email: string | null;
  roles: Role[];
  // agrega campos si los necesitas (workUnit, phone, etc.)
};

export type LoginPayload = {
  username: string;
  password: string;
  captchaToken?: string; // si lo usas
};
