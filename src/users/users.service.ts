import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  DeepPartial,
  EntityTarget,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { UserRepresentation } from './entities/user-representation.entity';
import { StatelessUser } from 'src/auth/user.factory';
import { Note } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { NotableEntity } from './interfaces/notable-entity.interface';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Paginated } from 'src/common/dto/paginated.dto';
import { TrainingParticipantRepresentationDto } from 'src/training/items/dto/training-participant-representation.dto';
import { OpaqueTokenService } from 'src/auth/opaque-token.service';
import { OpaqueToken } from 'src/auth/entities/opaque-token.entity';
import { TrainingTokenQueryDto } from './dto/training-token-query.dto';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { ItemCompletion } from 'src/training/items/entities/item-completion.entity';
import { KeycloakAdminClientService } from 'src/auth/keycloak-admin-client/keycloak-admin-client.service';
import { getUserAttr } from 'src/common/utils';
import { Unit } from 'src/organizations/units/entities/unit.entity';

export class UsersService {
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
    if (user.organizationSlug && user.unitSlug) {
      unit = await this.dataSource
        .createQueryBuilder(Unit, 'unit')
        .leftJoin('unit.organization', 'organization')
        .where(
          'organization.slug = :organizationSlug AND unit.slug = :unitSlug',
          {
            organizationSlug: user.organizationSlug,
            unitSlug: user.unitSlug,
          },
        )
        .getOne();
    }
    const userRepresentation = this.usersRepository.create({
      externalId: user.id,
      email: user.email,
      name: user.name,
      givenName: user.firstName,
      familyName: user.lastName,
      picture: user.picture,
      unitId: unit?.id,
      organizationId: unit?.organization?.id,
    });
    return this.usersRepository.upsert(userRepresentation, ['externalId']);
  }

  async getOrCreateRepresentation(user: StatelessUser) {
    const rep = await this.usersRepository.findOneBy({ externalId: user.id });

    if (rep) return rep;

    return this.updateRepresentation(user).then(() =>
      this.usersRepository.findOneByOrFail({ externalId: user.id }),
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
      .where({ id: noteId, userExternalId: user.id })
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

    return await this.notesQb()
      .andWhere({
        id: noteId,
        userExternalId: user!.id,
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

    await this.updateRepresentation(user);

    return {
      ...partialNote,
      userExternalId: user.id,
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

    return opaqueTokenResponse;
  }

  async deleteTrainingToken(token: string) {
    return await this.opaqueTokenService.delete(token);
  }

  async syncMissingUsers() {
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
}
