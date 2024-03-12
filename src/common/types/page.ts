export interface Page<T> {
  results: T[];
  count: number;
  limit: number;
  offset: number;
}
