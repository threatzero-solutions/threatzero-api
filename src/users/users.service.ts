import type KeycloakUserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { OpaqueToken } from 'src/auth/entities/opaque-token.entity';
import { KeycloakAdminClientService } from 'src/auth/keycloak-admin-client/keycloak-admin-client.service';
import { CustomQueryFilter } from 'src/auth/keycloak-admin-client/types';
import { OpaqueTokenService } from 'src/auth/opaque-token.service';
import { StatelessUser } from 'src/auth/user.factory';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { Paginated } from 'src/common/dto/paginated.dto';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { getUserAttr } from 'src/common/utils';
import { TRAINING_PARTICIPANT_ROLE_GROUP_PATH } from 'src/organizations/organizations/constants';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { TrainingParticipantRepresentationDto } from 'src/training/items/dto/training-participant-representation.dto';
import { ItemCompletion } from 'src/training/items/entities/item-completion.entity';
import {
  DataSource,
  DeepPartial,
  EntityTarget,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { CreateNoteDto } from './dto/create-note.dto';
import { TrainingTokenQueryDto } from './dto/training-token-query.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './entities/note.entity';
import { UserRepresentation } from './entities/user-representation.entity';
import { NotableEntity } from './interfaces/notable-entity.interface';
import { UnifiedUser } from './interfaces/unified-user.interface';

export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserRepresentation)
    private usersRepository: Repository<UserRepresentation>,
    @InjectRepository(Note) private notesRepository: Repository<Note>,
    private readonly cls: ClsService<CommonClsStore>,
    private dataSource: DataSource,
    private opaqueTokenService: OpaqueTokenService,
    private keycloakAdminService: KeycloakAdminClientService,
  ) {}

  async updateRepresentation(user: StatelessUser) {
    let unit: Unit | null = null;
    if (user.organizationSlug) {
      const qb = this.dataSource
        .createQueryBuilder(Unit, 'unit')
        .leftJoin('unit.organization', 'organization');

      if (user.unitSlug) {
        unit = await qb
          .where(
            'organization.slug = :organizationSlug AND unit.slug = :unitSlug',
            {
              organizationSlug: user.organizationSlug,
              unitSlug: user.unitSlug,
            },
          )
          .getOne();
      } else {
        unit = await qb
          .where('organization.slug = :organizationSlug', {
            organizationSlug: user.organizationSlug,
          })
          .andWhere({ isDefault: true })
          .getOne();
      }
    }

    const normalizedEmail = user.email.trim().toLowerCase();

    const userRepresentationDto: DeepPartial<UserRepresentation> = {
      email: normalizedEmail,
    };

    const sensitiveOverwriteFields: DeepPartial<UserRepresentation> = {
      idpId: user.idpId,
      picture: user.picture,
      unitId: unit?.id,
      organizationId: unit?.organizationId,
      name: user.name,
      givenName: user.firstName,
      familyName: user.lastName,
    };

    // Be careful not to overwrite values with nulls when the incoming user
    // object isn't an IDP user (ie an opaque token user).
    if (user.idpId) {
      Object.assign(userRepresentationDto, sensitiveOverwriteFields);
    }

    const updateResult = await this.usersRepository
      .createQueryBuilder('user')
      .update()
      .set(userRepresentationDto)
      .where(
        user.idpId
          ? {
              idpId: user.idpId,
            }
          : {
              email: normalizedEmail,
            },
      )
      .execute();

    if (updateResult.affected === 0) {
      // User may fail to update if:
      //   1. An UserRepresentation record does not exist for the user.
      //   2. OR the record does exist, but without the current "idpId" value.
      // In the case of the user already existing, the insert will fail and the `orUpdate` clause
      // will be executed instead.

      const createOrUpdateValues = {
        ...userRepresentationDto,
        // If user doens't already exist, add sensitive fields to the user representation
        // since they won't be overwriting any existing values.
        ...sensitiveOverwriteFields,
      };
      await this.usersRepository
        .createQueryBuilder('user')
        .insert()
        .values(createOrUpdateValues)
        .orUpdate(Object.keys(createOrUpdateValues), ['email'])
        .execute();
    }

    return this.usersRepository.findOneByOrFail(
      user.idpId
        ? {
            idpId: user.idpId,
          }
        : {
            email: normalizedEmail,
          },
    );
  }

  notesQb() {
    return this.notesRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.user', 'user');
  }

  async addNote<E extends NotableEntity>(
    target: EntityTarget<E>,
    foreignKeyColumn: string,
    entityId: E['id'],
    createNoteDto: CreateNoteDto,
  ) {
    const note = await this.prepareNote(
      foreignKeyColumn,
      entityId,
      createNoteDto,
    );
    const result = await this.notesRepository.insert(note);
    await this.notesQb()
      .relation(target, 'notes')
      .of(entityId)
      .add(result.identifiers.map((r) => r.id));

    return await this.notesQb()
      .andWhere({ id: result.identifiers[0].id })
      .getOne();
  }

  async getNotes<E extends NotableEntity>(
    foreignKeyColumn: string,
    entityId: E['id'],
    query: BaseQueryDto,
  ) {
    let qb = this.notesQb().andWhere({ [foreignKeyColumn]: entityId });
    qb = query.applyToQb(qb);
    return Paginated.fromQb(qb, query);
  }

  async editNote<E extends NotableEntity>(
    foreignKeyColumn: string,
    entityId: E['id'],
    noteId: Note['id'],
    updateNoteDto: UpdateNoteDto,
  ) {
    const user = this.cls.get('user');
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const note = await this.prepareNote(
      foreignKeyColumn,
      entityId,
      updateNoteDto,
    );
    await this.notesQb()
      .update(note)
      .where({ id: noteId, userId: note.userId })
      .execute();
    return await this.notesQb().andWhere({ id: noteId }).getOne();
  }

  async removeNote<E extends NotableEntity>(
    foreignKeyColumn: string,
    entityId: E['id'],
    noteId: Note['id'],
  ) {
    const user = this.cls.get('user');
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const userRep = await this.updateRepresentation(user);

    return await this.notesQb()
      .andWhere({
        id: noteId,
        userId: userRep.id,
        [foreignKeyColumn]: entityId,
      })
      .delete()
      .execute();
  }

  protected async prepareNote<E extends { id: string }>(
    foreignKeyColumn: string,
    entityId: E['id'],
    partialNote: DeepPartial<Note>,
  ) {
    const user = this.cls.get('user');
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const userRep = await this.updateRepresentation(user);

    return {
      ...partialNote,
      userId: userRep.id,
      [foreignKeyColumn]: entityId,
    };
  }

  async getTrainingToken(key: string) {
    return await this.opaqueTokenService.get(key);
  }

  async findTrainingTokens(query: TrainingTokenQueryDto) {
    query.type = 'training';
    return await this.opaqueTokenService.findAll(query);
  }

  getTrainingTokensQb(
    query: TrainingTokenQueryDto,
    mod = (qb: SelectQueryBuilder<OpaqueToken>) => qb,
  ) {
    query.type = 'training';
    return this.opaqueTokenService.getQb(query, mod);
  }

  async createTrainingToken(
    trainingParticipantRepresentationDto: TrainingParticipantRepresentationDto,
    expiresOn?: Date,
  ): Promise<OpaqueToken<TrainingParticipantRepresentationDto>>;
  async createTrainingToken(
    trainingParticipantRepresentationDto: TrainingParticipantRepresentationDto[],
    expiresOn?: Date,
  ): Promise<OpaqueToken<TrainingParticipantRepresentationDto>[]>;
  async createTrainingToken(
    trainingParticipantRepresentationDto:
      | TrainingParticipantRepresentationDto
      | TrainingParticipantRepresentationDto[],
    expiresOn?: Date,
  ): Promise<
    | OpaqueToken<TrainingParticipantRepresentationDto>
    | OpaqueToken<TrainingParticipantRepresentationDto>[]
  >;
  async createTrainingToken(
    trainingParticipantRepresentationDto:
      | TrainingParticipantRepresentationDto
      | TrainingParticipantRepresentationDto[],
    expiresOn?: Date,
  ): Promise<
    | OpaqueToken<TrainingParticipantRepresentationDto>
    | OpaqueToken<TrainingParticipantRepresentationDto>[]
  > {
    const opaqueTokenResponse = await this.opaqueTokenService.create(
      trainingParticipantRepresentationDto,
      {
        valueClass: TrainingParticipantRepresentationDto,
        type: 'training',
        expiresOn,
      },
    );

    const dtos = Array.isArray(trainingParticipantRepresentationDto)
      ? trainingParticipantRepresentationDto
      : [trainingParticipantRepresentationDto];

    const results = await Promise.allSettled(
      dtos.map(async (dto) => {
        const user = await this.updateRepresentation(
          new StatelessUser(
            dto.userId,
            null,
            dto.email,
            [dto.firstName, dto.lastName].filter(Boolean).join(' '),
            dto.firstName,
            dto.lastName,
            null,
            [],
            [],
            dto.organizationSlug,
            null,
            dto.unitSlug,
            [],
          ),
        );

        await this.dataSource
          .createQueryBuilder(ItemCompletion, 'item_completion')
          .insert()
          .values({
            item: {
              id: dto.trainingItemId,
            },
            enrollment: {
              id: dto.enrollmentId,
            },
            userId: user.id,
            email: dto.email,
            url: 'https://threatzero.org',
            audienceSlugs: dto.audiences,
          })
          .orIgnore()
          .execute();
      }),
    );
    if (results.some((r) => r.status === 'rejected')) {
      this.logger.error(
        `Failed to update user representation for ${
          results.filter((r) => r.status === 'rejected').length
        } users while creating training tokens.`,
      );
    }

    return opaqueTokenResponse;
  }

  async deleteTrainingToken(token: string) {
    return await this.opaqueTokenService.delete(token);
  }

  /**
   * Synchronizes users from Keycloak who have training completions but are missing from the local database.
   * Searches for user IDs in item_completion records that don't have corresponding UserRepresentation entries,
   * then fetches those users from Keycloak and creates local records.
   * @returns The count of users successfully synchronized
   */
  async syncMissingLocalUsersFromItemCompletions() {
    let usersSyncedCount = 0;

    const missingUserIds = await this.dataSource
      .createQueryBuilder(ItemCompletion, 'item_completion')
      .select('item_completion."userId"')
      .addSelect('organization.slug', 'organizationSlug')
      .addSelect('unit.slug', 'unitSlug')
      .distinct(true)
      .leftJoin(
        UserRepresentation,
        'user',
        'item_completion.userId = user.externalId',
      )
      .leftJoin('item_completion.organization', 'organization')
      .leftJoin('item_completion.unit', 'unit')
      .where('user.id IS NULL')
      .getRawMany<{
        userId: string;
        organizationSlug: string;
        unitSlug: string;
      }>();

    for (const { userId, organizationSlug, unitSlug } of missingUserIds) {
      const keycloakUser = await this.keycloakAdminService.client.users.findOne(
        {
          id: userId,
        },
      );

      if (!keycloakUser || !keycloakUser.email) {
        continue;
      }

      const user = new StatelessUser(
        userId,
        keycloakUser.id ?? null,
        keycloakUser.email,
        [keycloakUser.firstName, keycloakUser.lastName]
          .filter(Boolean)
          .join(' '),
        keycloakUser.firstName,
        keycloakUser.lastName,
        getUserAttr(keycloakUser.attributes?.picture),
        [],
        [],
        organizationSlug,
        unitSlug,
      );

      await this.updateRepresentation(user);

      usersSyncedCount++;
    }

    return {
      usersSyncedCount,
    };
  }

  async syncMissingLocalUsersFromOpaqueTokens() {
    const opaqueTokens = await this.dataSource
      .createQueryBuilder(OpaqueToken, 'opaque_token')
      .leftJoin(
        UserRepresentation,
        'user',
        `opaque_token.value->>'userId' = user.externalId`,
      )
      .where(`user.id IS NULL AND opaque_token.value->>'userId' IS NOT NULL`)
      .getMany();

    for (const token of opaqueTokens) {
      const tokenValue = token.value as Record<string, unknown>;
      if (
        'email' in tokenValue &&
        typeof tokenValue.email === 'string' &&
        'userId' in tokenValue &&
        typeof tokenValue.userId === 'string'
      ) {
        const user = await this.updateRepresentation(
          new StatelessUser(
            tokenValue.userId,
            null,
            tokenValue.email,
            [tokenValue.firstName, tokenValue.lastName]
              .filter(Boolean)
              .join(' '),
            tokenValue.firstName as string,
            tokenValue.lastName as string,
            null,
            [],
            [],
            tokenValue.organizationSlug as string,
            null,
            tokenValue.unitSlug as string,
            [],
          ),
        );

        if (token.type === 'training') {
          const dto = token.value as TrainingParticipantRepresentationDto;
          await this.dataSource
            .createQueryBuilder(ItemCompletion, 'item_completion')
            .insert()
            .values({
              item: {
                id: dto.trainingItemId,
              },
              enrollment: {
                id: dto.enrollmentId,
              },
              userId: user.id,
              email: dto.email,
              url: 'https://threatzero.org',
              audienceSlugs: dto.audiences,
            })
            .orIgnore()
            .execute();
        }
      }
    }
  }

  async *getKeycloakUsersAndOpaqueTokensGenerator({
    batchSize = 1000,
    includeOpaqueTokens = true,
    organizationSlug,
    keycloakGroupIds,
  }: {
    batchSize?: number;
    includeOpaqueTokens?: boolean;
    organizationSlug?: string;
    keycloakGroupIds?: string[];
  } = {}): AsyncGenerator<
    {
      keycloakUser: KeycloakUserRepresentation | null;
      opaqueToken: OpaqueToken<TrainingParticipantRepresentationDto> | null;
    },
    void,
    unknown
  > {
    const processedEmails = new Set<string>();
    let first = 0;

    // Yield Keycloak users in batches
    while (true) {
      const queryFilters: CustomQueryFilter[] = [];
      if (organizationSlug) {
        queryFilters.push({
          q: { key: 'organization', value: organizationSlug },
        });
      }
      if (keycloakGroupIds) {
        queryFilters.push({
          groupQ: {
            key: 'id',
            groups: keycloakGroupIds,
            op: 'all',
          },
        });
      }
      const keycloakUsers = await this.keycloakAdminService
        .findUsersByAttribute({
          offset: first,
          limit: batchSize,
          filter: {
            AND: queryFilters,
          },
          order: 'firstName',
        })
        .then((users) => users.results);

      if (!keycloakUsers || keycloakUsers.length === 0) {
        break;
      }

      for (const user of keycloakUsers) {
        if (!user.email || processedEmails.has(user.email!)) {
          continue;
        }
        processedEmails.add(user.email);

        yield { keycloakUser: user, opaqueToken: null };
      }

      if (keycloakUsers.length < batchSize) {
        break;
      }

      first += batchSize;
    }

    // Yield OpaqueToken users if requested
    if (includeOpaqueTokens) {
      let skip = 0;

      while (true) {
        const opaqueTokenQuery = new TrainingTokenQueryDto();
        opaqueTokenQuery.type = 'training';
        opaqueTokenQuery.limit = batchSize;
        opaqueTokenQuery.offset = skip;
        if (organizationSlug) {
          opaqueTokenQuery['value.organizationSlug'] = organizationSlug;
        }
        const opaqueTokens = (await this.opaqueTokenService
          .getQb(opaqueTokenQuery)
          .getMany()) as OpaqueToken<TrainingParticipantRepresentationDto>[];

        if (!opaqueTokens || opaqueTokens.length === 0) {
          break;
        }

        for (const opaqueToken of opaqueTokens) {
          const tokenValue = opaqueToken.value;

          if (!tokenValue.email || processedEmails.has(tokenValue.email)) {
            continue;
          }

          processedEmails.add(tokenValue.email);

          yield { keycloakUser: null, opaqueToken };
        }

        if (opaqueTokens.length < batchSize) {
          break;
        }

        skip += batchSize;
      }
    }
  }

  async *getAllUsersGenerator({
    batchSize = 1000,
    organizationSlug,
    keycloakGroupIds,
  }: {
    batchSize?: number;
    organizationSlug?: string;
    keycloakGroupIds?: string[];
  } = {}): AsyncGenerator<UnifiedUser, void, unknown> {
    const generator = this.getKeycloakUsersAndOpaqueTokensGenerator({
      batchSize,
      organizationSlug,
      keycloakGroupIds,
    });
    for await (const { keycloakUser, opaqueToken } of generator) {
      if (keycloakUser) {
        yield this.mapKeycloakUserToUnified(keycloakUser);
      } else if (opaqueToken) {
        yield this.mapOpaqueTokenToUnified(opaqueToken);
      }
    }
  }

  private mapKeycloakUserToUnified(
    user: KeycloakUserRepresentation,
  ): UnifiedUser {
    return {
      id: user.id || '',
      idpId: user.id,
      email: user.email || '',
      firstName: user.firstName,
      lastName: user.lastName,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
      picture: getUserAttr(user.attributes?.picture),
      organizationSlug: getUserAttr(user.attributes?.organization),
      unitSlug: getUserAttr(user.attributes?.unit),
      audiences: user.attributes?.audience,
      source: 'keycloak',
      canAccessTraining: !!user.groups?.includes(
        TRAINING_PARTICIPANT_ROLE_GROUP_PATH,
      ),
      enabled: user.enabled ?? true,
    };
  }

  private mapOpaqueTokenToUnified(
    token: OpaqueToken<TrainingParticipantRepresentationDto>,
  ): UnifiedUser {
    const value = token.value as TrainingParticipantRepresentationDto;
    return {
      id: value.userId,
      email: value.email,
      firstName: value.firstName,
      lastName: value.lastName,
      name:
        [value.firstName, value.lastName].filter(Boolean).join(' ') ||
        undefined,
      organizationSlug: value.organizationSlug,
      unitSlug: value.unitSlug,
      audiences: value.audiences,
      source: 'opaque_token',
      enrollmentId: value.enrollmentId,
      trainingItemId: value.trainingItemId,
      canAccessTraining: true,
    };
  }
}
