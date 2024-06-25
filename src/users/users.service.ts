import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeepPartial, EntityTarget, Repository } from 'typeorm';
import { UserRepresentation } from './entities/user-representation.entity';
import { StatelessUser } from 'src/auth/user.factory';
import { Note } from './entities/note.entity';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
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

@Injectable({ scope: Scope.REQUEST })
export class UsersService {
  constructor(
    @InjectRepository(UserRepresentation)
    private usersRepository: Repository<UserRepresentation>,
    @InjectRepository(Note) private notesRepository: Repository<Note>,
    @Inject(REQUEST) private request: Request,
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
    const note = await this.prepareNote(
      foreignKeyColumn,
      entityId,
      updateNoteDto,
    );
    await this.notesQb()
      .update(note)
      .where({ id: noteId, userExternalId: this.request.user!.id })
      .execute();
    return await this.notesQb().andWhere({ id: noteId }).getOne();
  }

  async removeNote<E extends NotableEntity>(
    foreignKeyColumn: string,
    entityId: E['id'],
    noteId: Note['id'],
  ) {
    if (!this.request.user) {
      throw new BadRequestException('User not found.');
    }

    return await this.notesQb()
      .andWhere({
        id: noteId,
        userExternalId: this.request.user!.id,
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
    if (!this.request.user) {
      throw new BadRequestException('User not found.');
    }

    await this.updateRepresentation(this.request.user);

    return {
      ...partialNote,
      userExternalId: this.request.user.id,
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

  async createTrainingToken(
    trainingParticipantRepresentationDto: TrainingParticipantRepresentationDto,
  ): Promise<{
    token: string;
    email: string;
    value: TrainingParticipantRepresentationDto;
  }>;
  async createTrainingToken(
    trainingParticipantRepresentationDto: TrainingParticipantRepresentationDto[],
  ): Promise<
    {
      token: string;
      email: string;
      value: TrainingParticipantRepresentationDto;
    }[]
  >;
  async createTrainingToken(
    trainingParticipantRepresentationDto:
      | TrainingParticipantRepresentationDto
      | TrainingParticipantRepresentationDto[],
  ): Promise<
    { token: string; email: string } | { token: string; email: string }[]
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

    const _buildRes = (
      o: OpaqueToken<TrainingParticipantRepresentationDto>,
    ) => ({
      token: o.key,
      email: o.value.email,
      value: o.value,
    });

    if (Array.isArray(opaqueTokenResponse)) {
      return opaqueTokenResponse.map(_buildRes);
    }

    return _buildRes(opaqueTokenResponse);
  }

  async deleteTrainingToken(token: string) {
    return await this.opaqueTokenService.delete(token);
  }
}
