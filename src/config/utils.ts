export const envToJson = <T>(env: string | undefined, defaultValue: T): T => {
  if (!env) {
    return defaultValue;
  }
  return JSON.parse(env);
};
