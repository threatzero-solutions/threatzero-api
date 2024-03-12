import { Type, plainToInstance } from 'class-transformer';
import { ValidateNested, validateSync } from 'class-validator';
import { GeneralConfig } from './general.config';
import { AWSConfig } from './aws.config';
import { NotificationsConfig } from './notifications.config';
import { DatabaseConfig } from './database.config';
import { RedisConfig } from './redis.config';
import { KeycloakConfig } from './keycloak.config';
import { VimeoConfig } from './vimeo.config';
import { MediaConfig } from './media.config';
import { AuthConfig } from './auth.config';

class Config {
  @ValidateNested()
  @Type(() => AuthConfig)
  auth: AuthConfig;

  @ValidateNested()
  @Type(() => GeneralConfig)
  general: GeneralConfig;

  @ValidateNested()
  @Type(() => DatabaseConfig)
  database: DatabaseConfig;

  @ValidateNested()
  @Type(() => AWSConfig)
  aws: AWSConfig;

  @ValidateNested()
  @Type(() => NotificationsConfig)
  notifications: NotificationsConfig;

  @ValidateNested()
  @Type(() => RedisConfig)
  redis: RedisConfig;

  @ValidateNested()
  @Type(() => KeycloakConfig)
  keycloak: KeycloakConfig;

  @ValidateNested()
  @Type(() => VimeoConfig)
  vimeo: VimeoConfig;

  @ValidateNested()
  @Type(() => MediaConfig)
  media: MediaConfig;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(Config, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
