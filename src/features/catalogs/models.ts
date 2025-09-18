// src/features/catalogs/models.ts
export type SubArea = { id: number; descArea: string };

export type Paged<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
};
