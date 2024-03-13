import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { DeepPartial, ObjectLiteral } from 'typeorm';
import { FormsService } from 'src/forms/forms/forms.service';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { CreateNoteDto } from 'src/users/dto/create-note.dto';
import { Note } from 'src/users/entities/note.entity';
import { UsersService } from 'src/users/users.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { scopeToOrganizationLevel } from 'src/organizations/common/organizations.utils';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { Base } from 'src/common/base.entity';
import { CreateFormSubmissionDto } from '../dto/create-form-submission.dto';

export type FormSubmissionEntity = ObjectLiteral & {
  id: Base['id'];
  submission: CreateFormSubmissionDto;
  unit: Unit;
  notes: Note[];
};

@Injectable({ scope: Scope.REQUEST })
export class BaseFormsSubmissionsService<
  E extends FormSubmissionEntity,
> extends BaseEntityService<E> {
  @Inject(FormsService) protected readonly formsService: FormsService;
  @Inject(UsersService) protected readonly usersService: UsersService;
  @Inject(REQUEST) protected request: Request;

  formSlug: string;
  noteEntityFieldName: string;

  constructor() {
    super();

    if (this.constructor === BaseFormsSubmissionsService) {
      throw new Error('Cannot construct abstract class');
    }

    if (!this.formSlug) {
      throw new Error('Form slug is required');
    }

    if (!this.noteEntityFieldName) {
      throw new Error('Note entity field name is required');
    }
  }

  getQb(query?: BaseQueryDto | undefined) {
    return scopeToOrganizationLevel(this.request, super.getQb(query));
  }

  async getForm() {
    return this.formsService.getFormBy({ slug: this.formSlug });
  }

  async create(
    createSubmissionEntityDto: DeepPartial<E> & {
      submission: CreateFormSubmissionDto;
    },
  ) {
    await this.formsService.createSubmission(
      this.formSlug,
      createSubmissionEntityDto.submission,
      this.request,
    );
    return super.create(createSubmissionEntityDto);
  }

  async update(id: string, updateEntityDto: DeepPartial<E>) {
    if (updateEntityDto.submission) {
      await this.formsService.updateSubmission(
        this.formSlug,
        updateEntityDto.submission,
        this.request,
      );
    }
    return super.update(id, updateEntityDto);
  }

  async addNote(entityId: E['id'], createNoteDto: CreateNoteDto) {
    const note = await this.prepareNote(entityId, createNoteDto);

    await this.getQb().relation(Note, 'notes').of(entityId).add(note);
  }

  async getNotes(entityId: E['id']) {
    return this.getQb().relation(Note, 'notes').of(entityId).select().getMany();
  }

  async editNote(
    entityId: E['id'],
    noteId: Note['id'],
    createNoteDto: CreateNoteDto,
  ) {
    const note = await this.prepareNote(entityId, createNoteDto);

    await this.getQb()
      .relation(Note, 'notes')
      .of(entityId)
      .update(note)
      .where({ id: noteId, userExternalId: this.request.user!.id })
      .execute();
  }

  async removeNote(entityId: E['id'], noteId: Note['id']) {
    if (!this.request.user) {
      throw new BadRequestException('User not found.');
    }

    await this.getQb()
      .relation(Note, 'notes')
      .of(entityId)
      .delete()
      .where({ id: noteId, userExternalId: this.request.user.id })
      .execute();
  }

  protected async prepareNote(entityId: E['id'], createNoteDto: CreateNoteDto) {
    if (!this.request.user) {
      throw new BadRequestException('User not found.');
    }

    await this.usersService.updateRepresentation(this.request.user);

    return {
      ...createNoteDto,
      userExternalId: this.request.user.id,
      [this.noteEntityFieldName]: entityId,
    };
  }
}
