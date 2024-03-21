import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

export function validate<T extends object>(
  ConfigClass: ClassConstructor<T>,
  config: Record<string, unknown>,
): T {
  const validatedConfig = plainToInstance(ConfigClass, config, {
    enableImplicitConversion: true,
    exposeUnsetFields: false,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
