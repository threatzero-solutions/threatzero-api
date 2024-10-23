import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { Unit } from '../units/entities/unit.entity';
import { LEVEL } from 'src/auth/permissions';
import { StatelessUser } from 'src/auth/user.factory';
import { ForbiddenException } from '@nestjs/common';
import { asArray, collapseArray } from 'src/common/utils';

export const getOrganizationLevel = (user: StatelessUser | undefined) => {
  if (user?.hasPermission(LEVEL.ADMIN)) {
    return LEVEL.ADMIN;
  } else if (
    user?.hasPermission(LEVEL.ORGANIZATION) &&
    user?.organizationSlug
  ) {
    return LEVEL.ORGANIZATION;
  } else if (user?.hasPermission(LEVEL.UNIT) && user?.unitSlug) {
    return LEVEL.UNIT;
  }
};

export const getAllowedOrganizationUnits = (
  user: StatelessUser | undefined | null,
  query?: {
    unitSlug?: string | string[];
    organizationSlug?: string | string[];
  },
) => {
  const organizationLevel = getOrganizationLevel(user ?? undefined);

  let requestedUnitSlugs = asArray(query?.unitSlug);
  let requestedOrganizationSlugs = asArray(query?.organizationSlug);

  if (organizationLevel === LEVEL.UNIT) {
    const availableUnits = [user!.unitSlug!, ...(user?.peerUnits ?? [])];
    requestedUnitSlugs = (requestedUnitSlugs ?? []).filter((slug) =>
      availableUnits.includes(slug),
    );

    if (!requestedUnitSlugs.length) {
      requestedUnitSlugs = availableUnits;
    }
  }

  if (
    organizationLevel === LEVEL.ORGANIZATION ||
    organizationLevel === LEVEL.UNIT
  ) {
    if (!user?.organizationSlug) {
      throw new ForbiddenException('Missing user information.');
    }
    requestedOrganizationSlugs = [user.organizationSlug];
  }

  return {
    unitSlugs: collapseArray(requestedUnitSlugs),
    organizationSlugs: collapseArray(requestedOrganizationSlugs),
    level: organizationLevel,
  };
};

export const scopeToOrganizationLevel = <
  T extends ObjectLiteral & { unit: Unit },
>(
  user: StatelessUser | undefined,
  qb: SelectQueryBuilder<T>,
): SelectQueryBuilder<T> => {
  const organizationLevel = getOrganizationLevel(user);
  const availableUnits = user?.peerUnits ?? [];
  if (user?.unitSlug) {
    availableUnits.push(user?.unitSlug);
  }
  switch (organizationLevel) {
    case LEVEL.ADMIN:
      return qb;
    case LEVEL.UNIT:
      return qb
        .leftJoin(`${qb.alias}.unit`, 'org_unit')
        .andWhere(`unit.slug IN (:...unitSlugs)`, {
          unitSlugs: availableUnits,
        });
    case LEVEL.ORGANIZATION:
      return qb
        .leftJoin(`${qb.alias}.unit`, 'org_unit')
        .leftJoinAndSelect('org_unit.organization', 'org_organization')
        .andWhere('org_organization.slug = :organizationSlug', {
          organizationSlug: user?.organizationSlug,
        });
    default:
      return qb.where('1 = 0');
  }
};
