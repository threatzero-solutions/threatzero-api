import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeepPartial, EntityTarget, Repository } from 'typeorm';
import { UserRepresentation } from './entities/user-representation.entity';
import { StatelessUser } from 'src/auth/user.factory';
import { Note } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { NotableEntity } from './interfaces/notable-entity.interface';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Paginated } from 'src/common/dto/paginated.dto';
import { UserIdChangeDto, UserIdChangesDto } from './dto/user-id-change.dto';
import { VideoEvent } from 'src/media/entities/video-event.entity';
import { FormSubmission } from 'src/forms/forms/entities/form-submission.entity';
import { TrainingParticipantRepresentationDto } from 'src/training/items/dto/training-participant-representation.dto';
import { OpaqueTokenService } from 'src/auth/opaque-token.service';
import { OpaqueToken } from 'src/auth/entities/opaque-token.entity';
import { TrainingTokenQueryDto } from './dto/training-token-query.dto';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from 'src/common/types/common-cls-store';

export class UsersService {
  constructor(
    @InjectRepository(UserRepresentation)
    private usersRepository: Repository<UserRepresentation>,
    @InjectRepository(Note) private notesRepository: Repository<Note>,
    private readonly cls: ClsService<CommonClsStore>,
    private dataSource: DataSource,
    private opaqueTokenService: OpaqueTokenService,
  ) {}

  async updateRepresentation(user: StatelessUser) {
    const userRepresentation = this.usersRepository.create({
      externalId: user.id,
      email: user.email,
      name: user.name,
      givenName: user.firstName,
      familyName: user.lastName,
      picture: user.picture,
      organizationSlug: user.organizationSlug,
      unitSlug: user.unitSlug,
    });
    return this.usersRepository.upsert(userRepresentation, ['externalId']);
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

  async updateUserId(change: UserIdChangeDto) {
    await this.dataSource.transaction(async (manager) => {
      const promises = [];
      promises.push(
        manager.update(
          UserRepresentation,
          { externalId: change.oldId },
          { externalId: change.newId },
        ),
      );
      promises.push(
        manager.update(
          FormSubmission,
          { userId: change.oldId },
          { userId: change.newId },
        ),
      );
      promises.push(
        manager.update(
          VideoEvent,
          { userId: change.oldId },
          { userId: change.newId },
        ),
      );

      await Promise.all(promises);
    });
  }

  async updateUserIds(userIdChanges: UserIdChangesDto) {
    await Promise.all(userIdChanges.changes.map((c) => this.updateUserId(c)));
  }

  async getTrainingToken(key: string) {
    return await this.opaqueTokenService.get(key);
  }

  async findTrainingTokens(query: TrainingTokenQueryDto) {
    query.type = 'training';
    return await this.opaqueTokenService.findAll(query);
  }

  getTrainingTokensQb(query: TrainingTokenQueryDto) {
    query.type = 'training';
    return this.opaqueTokenService.getQb(query);
  }

  async createTrainingToken(
    trainingParticipantRepresentationDto: TrainingParticipantRepresentationDto,
  ): Promise<OpaqueToken<TrainingParticipantRepresentationDto>>;
  async createTrainingToken(
    trainingParticipantRepresentationDto: TrainingParticipantRepresentationDto[],
  ): Promise<OpaqueToken<TrainingParticipantRepresentationDto>[]>;
  async createTrainingToken(
    trainingParticipantRepresentationDto:
      | TrainingParticipantRepresentationDto
      | TrainingParticipantRepresentationDto[],
  ): Promise<
    | OpaqueToken<TrainingParticipantRepresentationDto>
    | OpaqueToken<TrainingParticipantRepresentationDto>[]
  >;
  async createTrainingToken(
    trainingParticipantRepresentationDto:
      | TrainingParticipantRepresentationDto
      | TrainingParticipantRepresentationDto[],
  ) {
    const opaqueTokenResponse = await this.opaqueTokenService.create(
      trainingParticipantRepresentationDto,
      TrainingParticipantRepresentationDto,
      'training',
    );

    return opaqueTokenResponse;
  }

  async deleteTrainingToken(token: string) {
    return await this.opaqueTokenService.delete(token);
  }
}
