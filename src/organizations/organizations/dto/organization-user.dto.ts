import { Expose } from 'class-transformer';

export class OrganizationUserDto {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  attributes: Record<string, string[]>;

  @Expose()
  groups?: string[];
}
