import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { BaseEntityService } from 'src/common/base-entity.service';
import { DataSource, DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Form } from './entities/form.entity';
import { FormSubmission } from './entities/form-submission.entity';
import { ConfigService } from '@nestjs/config';
import { CloudFrontDistributionConfig, S3Config } from 'src/config/aws.config';
import { CopyObjectCommand } from '@aws-sdk/client-s3';
import { S3Service } from 'src/aws/s3/s3.service';
import { MediaService } from 'src/media/media.service';
import { FieldGroupsService } from '../field-groups/field-groups.service';
import { Request } from 'express';

@Injectable()
export class FormsService extends BaseEntityService<Form> {
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

  // TODO: Add additional form validation.
  // TODO: Add "basic" form finder that returns all latest versions
  // of each form, grouped by slug.
  // TODO: Add file preload function to add to various form controllers.
  // TODO: Add create new draft function.

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
    this.dataSource.transaction(async (manager) => {
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
