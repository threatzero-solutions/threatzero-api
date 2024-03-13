import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

class TokenPayload {
  sub: string;
  email: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  picture?: string | null;
  resource_access?: {
    [key: string]:
      | {
          roles: string[];
        }
      | undefined;
  };
  audiences?: string[];
  organization?: string;
  unit?: string;
}

export class StatelessUser {
  public readonly id: string;
  public readonly email: string;
  public readonly name?: string | null;
  public readonly firstName?: string | null;
  public readonly lastName?: string | null;
  public readonly picture?: string | null;
  public readonly permissions: string[];
  public readonly audiences: string[];
  public readonly organizationSlug?: string | null;
  public readonly unitSlug?: string | null;

  constructor(
    id: string,
    email: string,
    name: string | null | undefined,
    firstName: string | null | undefined,
    lastName: string | null | undefined,
    picture: string | null | undefined,
    permissions: string[],
    audiences: string[],
    organizationSlug?: string | null,
    unitSlug?: string | null,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.firstName = firstName;
    this.lastName = lastName;
    this.picture = picture;
    this.permissions = permissions;
    this.audiences = audiences;
    this.organizationSlug = organizationSlug;
    this.unitSlug = unitSlug;
  }

  public hasPermission = (...permissions: string[]): boolean => {
    return permissions.every((p) => this.permissions.includes(p));
  };
}

@Injectable()
export class UserFactory {
  public fromJwtPayload = (payload: unknown) => {
    const tokenPayload = plainToInstance(TokenPayload, payload, {
      enableImplicitConversion: true,
    });

    return new StatelessUser(
      tokenPayload.sub,
      tokenPayload.email,
      tokenPayload.name,
      tokenPayload.first_name,
      tokenPayload.last_name,
      tokenPayload.picture,
      tokenPayload.resource_access?.['threatzero-api']?.roles ?? [],
      tokenPayload.audiences ?? [],
      tokenPayload.organization,
      tokenPayload.unit,
    );
  };
}
