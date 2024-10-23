export const asArray = <T, AllowNullish extends boolean | undefined = false>(
  value: T | T[] | null | undefined,
  options: { allowNullish?: AllowNullish } = {},
) =>
  (Array.isArray(value)
    ? value
    : options.allowNullish || (value !== undefined && value !== null)
      ? [value]
      : []) as AllowNullish extends true ? (T | null | undefined)[] : T[];

export const collapseArray = <T>(array: T[]): T | T[] | undefined =>
  array.length > 1 ? array : array[0];
