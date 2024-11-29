import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { Unit } from '../units/entities/unit.entity';
import { LEVEL } from 'src/auth/permissions';
import { StatelessUser } from 'src/auth/user.factory';
import { DEFAULT_UNIT_SLUG } from './constants';
import { withLeftJoin } from 'src/common/entity.utils';

export const getOrganizationLevel = (user: StatelessUser | undefined) => {
  if (user?.hasPermission(LEVEL.ADMIN)) {
    return LEVEL.ADMIN;
  } else if (
    user?.hasPermission(LEVEL.ORGANIZATION) &&
    user?.organizationSlug
  ) {
    return LEVEL.ORGANIZATION;
  } else if (
    user?.hasPermission(LEVEL.UNIT) &&
    user?.unitSlug &&
    user?.unitSlug !== DEFAULT_UNIT_SLUG
  ) {
    return LEVEL.UNIT;
  }
};

export const scopeToOrganizationLevel = <
  T extends ObjectLiteral & { unit: Unit },
>(
  user: StatelessUser | undefined,
  qb: SelectQueryBuilder<T>,
): SelectQueryBuilder<T> => {
  switch (getOrganizationLevel(user)) {
    case LEVEL.ADMIN:
      return qb;
    case LEVEL.UNIT:
      return withLeftJoin(qb, Unit, 'unit').andWhere(
        getUserUnitPredicate(user, 'org_unit'),
      );
    case LEVEL.ORGANIZATION:
      return withLeftJoin(
        withLeftJoin(qb, Unit, 'unit'),
        'unit.organization',
        'organization',
      ).andWhere('organization.slug = :organizationSlug', {
        organizationSlug: user?.organizationSlug,
      });
    default:
      return qb.where('1 = 0');
  }
};

export const getRecursiveSubUnitsQb = (rootQb: SelectQueryBuilder<Unit>) => {
  const qb = rootQb.createQueryBuilder();
  const subqb = rootQb
    .subQuery()
    .from(Unit, 'u1')
    .select('u1.*')
    .innerJoin('subunits', 's', 'u1.parentUnitId = s.id');
  return qb
    .addCommonTableExpression(
      `
        ${rootQb.getQuery()}
        UNION
        ${subqb.getQuery()}
      `,
      'subunits',
      {
        recursive: true,
      },
    )
    .from('subunits', 'subunits');
};

export const getUnitSlugsForUser = (user: StatelessUser) => {
  return [
    ...(user?.unitSlug ? [user?.unitSlug] : []),
    ...(user?.peerUnits ?? []),
  ];
};

export const getUnitsSubquery = (
  ids: string[],
  qb: SelectQueryBuilder<ObjectLiteral>,
  {
    idType = 'id',
    selectField = 'id',
  }: { idType?: 'id' | 'slug'; selectField?: 'id' | 'slug' } = {},
) => {
  return getRecursiveSubUnitsQb(
    qb
      .subQuery()
      .from(Unit, 'subu')
      .select(`subu.*`)
      .where(`subu.${idType} IN (:...unitIds)`, {
        unitIds: ids,
      }),
  ).select(`subunits.${selectField}`);
};

export const getUserUnitPredicate =
  (user: StatelessUser | null | undefined, unitAlias = 'unit') =>
  (qb: SelectQueryBuilder<ObjectLiteral>) => {
    if (user?.unitSlug) {
      const q = getUnitsSubquery(getUnitSlugsForUser(user), qb, {
        idType: 'slug',
      }).getQuery();
      return `${unitAlias}.id IN (${q})`;
    }

    return '1 = 0';
  };

export const buildUnitPaths = (units: Unit[], rootPath?: string) => {
  const allParentIds = units
    .filter((u) => !!u.parentUnitId)
    .map((u) => u.parentUnitId!);
  const endNodeUnits = units.filter((u) => !allParentIds.includes(u.id));
  const unitsMap = new Map(units.map((u) => [u.id, u]));

  const joinPath = (...pathParts: (string | undefined)[]) =>
    pathParts
      .map((p) => p?.trim())
      .filter((p) => !!p)
      .join('/')
      .replace(/\/+/g, '/');

  const buildPath = (u: Unit, uMap: Map<string, Unit>) => {
    if (u.parentUnitId && uMap.has(u.parentUnitId)) {
      const parent = uMap.get(u.parentUnitId)!;
      u.path = joinPath(buildPath(parent, uMap), u.slug);
    } else {
      u.path = rootPath ? joinPath('/', rootPath, u.slug) : u.slug;
    }
    uMap.set(u.id, u);
    return u.path;
  };

  for (const u of endNodeUnits) {
    buildPath(u, unitsMap);
  }

  return [...unitsMap.values()];
};
