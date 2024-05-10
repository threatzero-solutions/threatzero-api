import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { Unit } from '../units/entities/unit.entity';
import { Request } from 'express';
import { LEVEL } from 'src/auth/permissions';

export const getOrganizationLevel = (req: Request) => {
  if (req.user?.hasPermission(LEVEL.ADMIN)) {
    return LEVEL.ADMIN;
  } else if (
    req.user?.hasPermission(LEVEL.ORGANIZATION) &&
    req.user?.organizationSlug
  ) {
    return LEVEL.ORGANIZATION;
  } else if (req.user?.hasPermission(LEVEL.UNIT) && req.user?.unitSlug) {
    return LEVEL.UNIT;
  }
};

export const scopeToOrganizationLevel = <
  T extends ObjectLiteral & { unit: Unit },
>(
  req: Request,
  qb: SelectQueryBuilder<T>,
): SelectQueryBuilder<T> => {
  const organizationLevel = getOrganizationLevel(req);
  switch (organizationLevel) {
    case LEVEL.ADMIN:
      return qb;
    case LEVEL.UNIT:
      return qb
        .leftJoin(`${qb.alias}.unit`, 'org_unit')
        .andWhere(
          `unit.slug = :unitSlug OR unit.slug IN (${req.user?.peerUnits
            .map((pu) => `'${pu}'`)
            .join(', ')})`,
          {
            unitSlug: req.user?.unitSlug,
          },
        );
    case LEVEL.ORGANIZATION:
      return qb
        .leftJoin(`${qb.alias}.unit`, 'org_unit')
        .leftJoinAndSelect('org_unit.organization', 'org_organization')
        .andWhere('org_organization.slug = :organizationSlug', {
          organizationSlug: req.user?.organizationSlug,
        });
    default:
      return qb.where('1 = 0');
  }
};
