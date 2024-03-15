import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityTarget, Repository } from 'typeorm';
import { UserRepresentation } from './entities/user-representation.entity';
import { StatelessUser } from 'src/auth/user.factory';
import { Note } from './entities/note.entity';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { CreateNoteDto } from './dto/create-note.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { NotableEntity } from './interfaces/notable-entity.interface';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable({ scope: Scope.REQUEST })
export class UsersService {
  constructor(
    @InjectRepository(UserRepresentation)
    private usersRepository: Repository<UserRepresentation>,
    @InjectRepository(Note) private notesRepository: Repository<Note>,
    @Inject(REQUEST) private request: Request,
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
    const [results, count] = await qb.getManyAndCount();
    return {
      results,
      count,
      limit: results.length,
      offset: +query.offset,
    };
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
}
