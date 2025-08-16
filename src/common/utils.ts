export const asArray = <T, AllowNullish extends boolean | undefined = false>(
  value: T | T[] | null | undefined,
  options: { allowNullish?: AllowNullish } = {},
) =>
  (Array.isArray(value)
    ? value
    : options.allowNullish || (value !== undefined && value !== null)
      ? [value]
      : []) as AllowNullish extends true ? (T | null | undefined)[] : T[];

export const single = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const isUndefined = (obj: any): obj is undefined =>
  typeof obj === 'undefined';

export const isNil = <T>(
  value: T | null | undefined,
): value is null | undefined => value === null || isUndefined(value);

export const getUserAttr = (attribute: unknown) => {
  if (Array.isArray(attribute) && attribute.length) {
    attribute = attribute[0];
  }

  if (attribute === null || attribute === undefined) {
    return undefined;
  }

  try {
    return attribute.toString();
  } catch {
    return undefined;
  }
};

export const truthyAttr = (attribute: unknown) => {
  const attr = getUserAttr(attribute);
  if (attr?.trim().match(/^(true)|1|(on)|(yes)$/i)) {
    return true;
  }
  return false;
};
