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
import { GetSubmissionCountsQueryDto } from '../dto/get-submission-counts-query.dto';
import dayjs from 'dayjs';
import { FormSubmission } from '../entities/form-submission.entity';
import { GetPresignedUploadUrlsDto } from '../dto/get-presigned-upload-urls.dto';

export type FormSubmissionEntity = ObjectLiteral & {
  id: Base['id'];
  submission: FormSubmission;
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
  }

  getQb(query?: BaseQueryDto | undefined) {
    return scopeToOrganizationLevel(
      this.request,
      super.getQb(query),
    ).leftJoinAndSelect(`${this.alias}.submission`, 'submission');
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

  async update(id: E['id'], updateEntityDto: DeepPartial<E>) {
    if (updateEntityDto.submission) {
      await this.formsService.updateSubmission(
        this.formSlug,
        updateEntityDto.submission,
        this.request,
      );
    }
    return super.update(id, updateEntityDto);
  }

  async generateSubmissionPDF(id: E['id']) {
    const entity = await this.findOne(id);
    return await this.formsService.generateSubmissionPDF(entity.submission.id);
  }

  async getSubmissionCounts(
    query: GetSubmissionCountsQueryDto,
    statuses: E['status'][],
  ) {
    let qb = this.getQb().select('COUNT(*)', 'total');
    const alias = this.alias ?? qb.alias;

    query.thresholds.forEach((threshold) => {
      qb = qb.addSelect(
        `COUNT(*) FILTER(WHERE ${alias}.createdOn > '${dayjs()
          .subtract(threshold, 'day')
          .toISOString()}')`,
        `days${threshold}`,
      );
    });

    statuses.forEach((status) => {
      qb = qb.addSelect(
        `COUNT(*) FILTER(WHERE ${alias}.status = '${status}')`,
        status,
      );
    });

    const data = await qb.getRawOne();

    return {
      total: +(data?.total ?? '0'),
      subtotals: {
        newSince: Object.keys(query.thresholds).reduce(
          (acc, threshold) => {
            const key = `days${threshold}`;
            acc[key] = +(data?.[key] ?? '0');
            return acc;
          },
          {} as Record<string, number>,
        ),
        statuses: Object.values(statuses).reduce(
          (acc, key) => {
            acc[key] = +(data?.[key] ?? '0');
            return acc;
          },
          {} as Record<E['status'], number>,
        ),
      },
    };
  }

  async getPresignedUploadUrls(
    getPresignedUploadUrlsDto: GetPresignedUploadUrlsDto,
  ) {
    return this.formsService.getPresignedUploadUrls(getPresignedUploadUrlsDto);
  }

  async addNote(entityId: E['id'], createNoteDto: CreateNoteDto) {
    const note = await this.prepareNote(entityId, createNoteDto);

    await this.getQb().relation(Note, 'notes').of(entityId).add(note);
  }

  async getNotes(query: BaseQueryDto, entityId: E['id']) {
    let qb = this.getQb().relation(Note, 'notes').of(entityId).select();
    qb = query.applyToQb(qb);
    return qb;
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
