import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { DataSource, DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Form, FormState } from './entities/form.entity';
import { FormSubmission } from './entities/form-submission.entity';
import { ConfigService } from '@nestjs/config';
import { S3Config } from 'src/config/aws.config';
import { CopyObjectCommand } from '@aws-sdk/client-s3';
import { S3Service } from 'src/aws/s3/s3.service';
import { MediaService } from 'src/media/media.service';
import { FieldGroupsService } from '../field-groups/field-groups.service';
import { Request } from 'express';

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
  ) {
    super();
  }

  getRepository() {
    return this.formsRepository;
  }

  // TODO: Add file preload function to add to various form controllers.

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
      .getMany();
  }

  async createNewDraft(id: Form['id']) {
    const form = await this.findOne(id);

    const newDraft = await this.dataSource.transaction(async (manager) => {
      return await form.asNewDraft(manager);
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

  protected async beforeRemove(id: Form['id']) {
    const form = await this.findOne(id);
    if (form.state === FormState.PUBLISHED) {
      throw new BadRequestException('Cannot delete published form.');
    }
  }

  async createSubmission(
    formSlug: string,
    formSubmissionDto: DeepPartial<FormSubmission>,
    request: Request,
  ) {
    const validatedSubmission = await this.validateSubmission(
      formSlug,
      formSubmissionDto,
      request,
    );
    const submission =
      this.formSubmissionsRepository.create(validatedSubmission);

    await this.dataSource.transaction(async (manager) => {
      await manager.save(submission);
      await submission.persistUploads(this.persistUpload);
    });
  }

  async updateSubmission(
    formSlug: string,
    formSubmissionDto: DeepPartial<FormSubmission>,
    request: Request,
  ) {
    const existingSubmission =
      await this.formSubmissionsRepository.preload(formSubmissionDto);
    if (!existingSubmission) {
      throw new NotFoundException();
    }
    return await this.createSubmission(formSlug, existingSubmission, request);
  }

  async getSubmission(id: FormSubmission['id']) {
    const submission = await this.formSubmissionsRepository.findOneOrFail({
      where: { id },
      relations: ['fieldResponses'],
    });
    submission.sign(this.getCloudfrontUrlSigner());
    return submission;
  }

  async validateSubmission(
    formSlug: string,
    formSubmissionDto: DeepPartial<FormSubmission>,
    request: Request,
  ) {
    const form = await this.getFormBy({ slug: formSlug });
    return form.validateSubmission(formSubmissionDto, request);
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

    return {
      ...form,
      groups,
    } as Form;
  }

  private async persistUpload(key: string) {
    if (!key.startsWith('tmp/')) {
      return key;
    }

    const bucketName =
      this.config.getOrThrow<S3Config>('aws.s3').buckets.uploadedMedia.name;

    const fromSource = `${bucketName}/${key}`;
    const newKey = key.replace(/^tmp\//, '');

    const cmd = new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: fromSource,
      Key: newKey,
    });

    await this.s3.client.send(cmd);

    return newKey;
  }

  private getCloudfrontUrlSigner() {
    return this.mediaService.getCloudFrontUrlSigner('user-uploads');
  }
}
