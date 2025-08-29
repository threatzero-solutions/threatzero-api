import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { LEVEL } from 'src/auth/permissions';
import { StatelessUser } from 'src/auth/user.factory';
import { withLeftJoin } from 'src/common/entity.utils';
import { GetPresignedUploadUrlsDto } from 'src/media/dto/get-presigned-upload-urls.dto';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { Unit } from '../units/entities/unit.entity';
import { DEFAULT_UNIT_SLUG } from './constants';

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

export const scopeToOrganizationLevel = <T extends ObjectLiteral>(
  user: StatelessUser | undefined,
  qb: SelectQueryBuilder<T>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  unitEntityOrProperty: Function | string = Unit,
): SelectQueryBuilder<T> => {
  switch (getOrganizationLevel(user)) {
    case LEVEL.ADMIN:
      return qb;
    case LEVEL.UNIT:
      const [qbWithUnitJoin, predicateUnitAlias] = withLeftJoin(
        qb,
        unitEntityOrProperty,
        'predicate_unit',
      );
      return qbWithUnitJoin.andWhere(
        getUserUnitPredicate(user, predicateUnitAlias),
      );
    case LEVEL.ORGANIZATION:
      const [qbWithUnitJoin2, predicateUnitAlias2] = withLeftJoin(
        qb,
        unitEntityOrProperty,
        'predicate_unit',
      );
      const [qbWithOrganizationJoin, organizationAlias] = withLeftJoin(
        qbWithUnitJoin2,
        `${predicateUnitAlias2}.organization`,
        'organization',
      );
      return qbWithOrganizationJoin.andWhere(
        `${organizationAlias}.slug = :organizationSlug`,
        { organizationSlug: user?.organizationSlug },
      );
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

    return { isDefault: true };
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

export async function generatePolicyUploadUrls(
  organizationPrefix: string,
  getPresignedUploadUrlsDto: GetPresignedUploadUrlsDto,
  bucketName: string,
  s3Client: S3Client,
  signer: (k: string) => string,
) {
  return await Promise.all(
    getPresignedUploadUrlsDto.files.map(async (f) => {
      const cleanedFilename = `${organizationPrefix.replace(/^\//, '').replace(/\/$/g, '')}/${f.filename.replace(/\/+/g, '_')}`;
      const key = `organization-policies/${cleanedFilename}`;

      const cmd = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      return {
        putUrl: await getSignedUrl(s3Client, cmd, {
          expiresIn: 5 * 60,
        }), // 5 minutes
        getUrl: signer(cleanedFilename),
        key,
        filename: cleanedFilename,
        fileId: f.fileId,
      };
    }),
  );
}

export const buildOrganizationStatusCacheKey = (organizationSlug: string) =>
  `organizations:status-by-slug:${organizationSlug}`;
