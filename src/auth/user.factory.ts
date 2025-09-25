import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { DEFAULT_UNIT_SLUG } from 'src/organizations/common/constants';

class TokenPayload {
  sub: string;
  email: string;
  name?: string | null;
  given_name?: string | null;
  family_name?: string | null;
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
  organization_unit_path?: string;
  unit?: string;
  peer_units?: string[];
}

export class StatelessUser {
  public readonly id: string;
  public readonly idpId: string | null;
  public readonly email: string;
  public readonly name?: string | null;
  public readonly firstName?: string | null;
  public readonly lastName?: string | null;
  public readonly picture?: string | null;
  public readonly permissions: string[];
  public readonly audiences: string[];
  public readonly organizationSlug?: string | null;
  public readonly organizationUnitPath?: string | null;
  public readonly unitSlug?: string | null;
  public readonly peerUnits: string[] = [];

  constructor(
    id: string,
    idpId: string | null,
    email: string,
    name: string | null | undefined,
    firstName: string | null | undefined,
    lastName: string | null | undefined,
    picture: string | null | undefined,
    permissions: string[],
    audiences: string[],
    organizationSlug?: string | null,
    organizationUnitPath?: string | null,
    unitSlug?: string | null,
    peerUnits?: string[],
  ) {
    this.id = id;
    this.idpId = idpId;
    this.email = email;
    this.name = name;
    this.firstName = firstName;
    this.lastName = lastName;
    this.picture = picture;
    this.permissions = permissions;
    this.audiences = audiences;
    this.organizationSlug = organizationSlug;
    this.organizationUnitPath = organizationUnitPath;
    this.unitSlug = unitSlug
      ? unitSlug
      : organizationSlug
        ? DEFAULT_UNIT_SLUG
        : null;
    this.peerUnits = peerUnits ?? [];
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
      tokenPayload.sub,
      tokenPayload.email,
      tokenPayload.name,
      tokenPayload.given_name,
      tokenPayload.family_name,
      tokenPayload.picture,
      tokenPayload.resource_access?.['threatzero-api']?.roles ?? [],
      tokenPayload.audiences ?? [],
      tokenPayload.organization,
      tokenPayload.organization_unit_path,
      tokenPayload.unit,
      tokenPayload.peer_units ?? [],
    );
  };
}
