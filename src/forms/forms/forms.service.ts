import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import {
  DataSource,
  DeepPartial,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Form, FormState } from './entities/form.entity';
import { FormSubmission } from './entities/form-submission.entity';
import { ConfigService } from '@nestjs/config';
import { S3Config } from 'src/config/aws.config';
import { CopyObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Service } from 'src/aws/s3/s3.service';
import { MediaService } from 'src/media/media.service';
import { FieldGroupsService } from '../field-groups/field-groups.service';
import { Request } from 'express';
import { FormsPdfService } from './forms-pdf.service';
import { GetPresignedUploadUrlsDto } from './dto/get-presigned-upload-urls.dto';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

@Injectable()
export class FormsService extends BaseEntityService<Form> {
  alias = 'form';

  constructor(
    @InjectRepository(Form) private formsRepository: Repository<Form>,
    @InjectRepository(FormSubmission)
    private formSubmissionsRepository: Repository<FormSubmission>,
    private groupsService: FieldGroupsService,
    private dataSource: DataSource,
    private config: ConfigService,
    private s3: S3Service,
    private mediaService: MediaService,
    private formsPdfService: FormsPdfService,
  ) {
    super();
  }

  getRepository() {
    return this.formsRepository;
  }

  getQb(query?: BaseQueryDto | undefined): SelectQueryBuilder<Form> {
    return super.getQb(query).leftJoinAndSelect('form.language', 'language');
  }

  async findOne(id: Form['id']) {
    return this.getFormBy({ id });
  }

  async findAllGroupedBySlug() {
    return this.getQb()
      .where((qb) => {
        const q = qb
          .subQuery()
          .from(Form, 'f')
          .select('f.slug')
          .addSelect('MAX(f.version)')
          .groupBy('f.slug')
          .getQuery();
        return `(form.slug, form.version) IN ${q}`;
      })
      .andWhere('language.code = :language', {
        language: 'en',
      })
      .getMany();
  }

  async findAllLatestByLanguage(slug?: string) {
    return this.getQb()
      .where((qb) => {
        const q = qb
          .subQuery()
          .from(Form, 'f')
          .select('f.languageId')
          .addSelect('MAX(f.version)')
          .groupBy('f.languageId')
          .getQuery();
        return `(form.languageId, form.version) IN ${q}`;
      })
      .andWhere({
        slug,
      })
      .orderBy({ 'language.nativeName': 'ASC' })
      .getMany();
  }

  async createNewDraft(id: Form['id'], languageId: string) {
    const form = await this.findOne(id);

    const newDraft = await this.dataSource.transaction(async (manager) => {
      return await form.asNewDraft(manager, languageId);
    });

    return await this.findOne(newDraft.id);
  }

  async update(id: Form['id'], updateFormDto: DeepPartial<Form>) {
    const form = await this.getQbSingle(id).getOneOrFail();

    // Validate changes.
    updateFormDto = await form.validateChanges(updateFormDto, this.getQb());

    // Save changes if validation passes.
    const entity = await this.getRepository().save({
      id,
      ...updateFormDto,
    });
    return await this.mapResult(entity);
  }

  async beforeRemove(id: Form['id']) {
    const form = await this.findOne(id);
    if (form.state === FormState.PUBLISHED) {
      throw new BadRequestException('Cannot delete published form.');
    }
  }

  async createSubmission(
    formSubmissionDto: DeepPartial<FormSubmission>,
    request: Request,
  ) {
    const validatedSubmission = await this.validateSubmission(
      formSubmissionDto,
      request,
    );

    return await this.dataSource.transaction(async (manager) => {
      // Save once to ensure submission gets saved, even if persist uploads fails.
      let savedSubmission = await manager.save(validatedSubmission);

      // Then persist uploads.
      savedSubmission = await savedSubmission.persistUploads((key) =>
        this.persistUpload(key),
      );

      // Then save again.
      return await manager.save(savedSubmission);
    });
  }

  async updateSubmission(
    formSubmissionDto: DeepPartial<FormSubmission>,
    request: Request,
  ) {
    return await this.createSubmission(formSubmissionDto, request);
  }

  async getSubmission(id: FormSubmission['id']) {
    const submission = await this.formSubmissionsRepository.findOneOrFail({
      where: { id },
      relations: ['fieldResponses'],
    });
    submission.sign((key) => this.getCloudfrontUrlSigner()(key));
    return submission;
  }

  async validateSubmission(
    formSubmissionDto: DeepPartial<FormSubmission>,
    request: Request,
  ) {
    const formId = formSubmissionDto.formId || formSubmissionDto.form?.id;

    if (!formId) {
      throw new BadRequestException('Form ID must not be empty.');
    }

    const form = await this.getFormBy({ id: formId });
    const validatedSubmission = form.validateSubmission(
      formSubmissionDto,
      request,
    );
    return this.formSubmissionsRepository.create(validatedSubmission);
  }

  async generateFormPDF(formId: Form['id']) {
    const form = await this.findOne(formId);
    return this.formsPdfService.formSubmissionToPDF(form);
  }

  async generateSubmissionPDF(submissionId: FormSubmission['id']) {
    const submission = await this.formSubmissionsRepository.findOneOrFail({
      where: { id: submissionId },
      relations: ['fieldResponses', 'form'],
    });
    const form = await this.findOne(submission.form.id);
    return this.formsPdfService.formSubmissionToPDF(form, submission);
  }

  async getFormBy(where?: FindOptionsWhere<Form>) {
    const form = await this.formsRepository.findOne({
      where,
      relations: {
        fields: true,
        groups: true,
      },
      order: {
        state: 'DESC',
        version: 'DESC',
        updatedOn: 'DESC',
      },
    });

    if (!form) {
      throw new NotFoundException('Form not found.');
    }

    const groups = await this.groupsService.getDescendantGroupsForForm(form);

    form.groups = groups;
    return form;
  }

  async getPresignedUploadUrls(
    getPresignedUploadUrlsDto: GetPresignedUploadUrlsDto,
    prefix = 'user-uploads',
  ) {
    return await Promise.all(
      getPresignedUploadUrlsDto.files.map(async (f) => {
        let ext: string | undefined;
        if (f.filename.includes('.')) {
          ext = f.filename.split('.').pop();
        } else if (f.mimetype) {
          ext = mime.extension(f.mimetype);
        }
        let key = uuidv4().replace(/-/g, '') + (ext ? `.${ext}` : '');
        key = `${prefix.replace(/\//g, '/')}/tmp/${key}`;

        const cmd = new PutObjectCommand({
          Bucket:
            this.config.getOrThrow<S3Config>('aws.s3').buckets.uploadedMedia
              .name,
          Key: key,
        });

        return {
          putUrl: await getSignedUrl(this.s3.client, cmd, {
            expiresIn: 5 * 60,
          }), // 5 minutes
          getUrl: this.getCloudfrontUrlSigner()(key),
          key,
          filename: f.filename,
          fileId: f.fileId,
        };
      }),
    );
  }

  private async persistUpload(key: string) {
    if (!key.startsWith('user-uploads/tmp/')) {
      return key;
    }

    const bucketName =
      this.config.getOrThrow<S3Config>('aws.s3').buckets.uploadedMedia.name;

    const fromSource = `${bucketName}/${key}`;
    const newKey = key.replace(/\/tmp\//, '/');

    const cmd = new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: fromSource,
      Key: newKey,
    });

    await this.s3.client.send(cmd);

    return newKey;
  }

  private getCloudfrontUrlSigner() {
    return this.mediaService.getCloudFrontUrlSigner();
  }
}
