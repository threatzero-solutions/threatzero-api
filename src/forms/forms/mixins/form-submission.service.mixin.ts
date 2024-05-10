import { BaseEntityService } from 'src/common/base-entity.service';
import { DeepPartial, SelectQueryBuilder } from 'typeorm';
import { FormsService } from 'src/forms/forms/forms.service';
import { Request } from 'express';
import { CreateFormSubmissionDto } from '../dto/create-form-submission.dto';
import { GetSubmissionCountsQueryDto } from '../dto/get-submission-counts-query.dto';
import dayjs from 'dayjs';
import { GetPresignedUploadUrlsDto } from '../dto/get-presigned-upload-urls.dto';
import { SubmittableEntity } from '../interfaces/submittable-entity.interface';

export interface FormSubmissionServiceMixinRequiredProperties {
  formsService: FormsService;
  formSlug: string;
  request: Request;
}

type Constructor<E extends SubmittableEntity> = new (
  ...args: any[]
) => BaseEntityService<E>;

export function FormSubmissionsServiceMixin<E extends SubmittableEntity>() {
  return function <TBase extends Constructor<E>>(Base: TBase) {
    return class extends Base {
      formsService: FormsService;
      formSlug: string;
      request: Request;

      getQbSingle(
        id: NonNullable<E['id']>,
        ...args: unknown[]
      ): SelectQueryBuilder<E> {
        return super
          .getQbSingle(id, ...args)
          .leftJoinAndSelect(`${super.getQb().alias}.submission`, 'submission');
      }

      async getForm(languageCode = 'en') {
        return this.formsService.getFormBy({
          slug: this.formSlug,
          language: { code: languageCode },
        });
      }

      async getForms() {
        return this.formsService.findAllLatestByLanguage(this.formSlug, true);
      }

      async mapResult(entity: E) {
        if (!entity.submission) {
          return entity;
        }

        return {
          ...entity,
          submission: await this.formsService.getSubmission(
            entity.submission.id,
          ),
        };
      }

      async create(
        createSubmissionEntityDto: DeepPartial<E> & {
          submission: CreateFormSubmissionDto;
        },
        ...args: any[]
      ) {
        // First, validate & create submission.
        const savedSubmission = await this.formsService.createSubmission(
          createSubmissionEntityDto.submission,
          this.request,
        );

        // Then, create the entity with saved submission.
        return super.create(
          {
            ...createSubmissionEntityDto,
            submission: savedSubmission,
          },
          ...args,
        );
      }

      async update(
        id: E['id'],
        updateEntityDto: DeepPartial<E>,
        ...args: any[]
      ) {
        if (updateEntityDto.submission) {
          await this.formsService.updateSubmission(
            updateEntityDto.submission,
            this.request,
          );
        }
        return super.update(id, updateEntityDto, ...args);
      }

      async generateSubmissionPDF(id: E['id']) {
        const entity = await this.findOne(id);
        return await this.formsService.generateSubmissionPDF(
          entity.submission.id,
        );
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
            newSince: query.thresholds.reduce(
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
        ...args: any[]
      ) {
        return this.formsService.getPresignedUploadUrls(
          getPresignedUploadUrlsDto,
        );
      }
    };
  };
}
