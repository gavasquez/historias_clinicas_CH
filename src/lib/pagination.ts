export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export function normalizePageSize(value: unknown): number {
  const size = Number(value);
  if (Number.isInteger(size) && size > 0 && size <= MAX_PAGE_SIZE) {
    return size;
  }
  return DEFAULT_PAGE_SIZE;
}

export function normalizePage(value: unknown): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
