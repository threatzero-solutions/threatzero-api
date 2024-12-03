import { Expose } from 'class-transformer';

export class KeycloakGroupDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  path: string;

  @Expose()
  attributes: Record<string, string[]>;
}
