import fs from 'fs';

export const envToJson = <T>(env: string | undefined, defaultValue: T): T => {
  if (!env) {
    return defaultValue;
  }
  return JSON.parse(env);
};

export const readFileToString = (path: string | null | undefined) =>
  path ? fs.readFileSync(path, 'utf-8') : '';
