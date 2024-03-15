import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { KeycloakConfig } from './keycloak.config';

export function validate(
  ConfigClass: ClassConstructor<object>,
  config: Record<string, unknown>,
) {
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
