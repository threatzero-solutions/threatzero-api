import {
  Inject,
  Injectable,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { ThreatAssessment } from './entities/threat-assessment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { THREAT_ASSESSMENT_FORM_SLUG } from 'src/common/constants/form.constants';
import { CreateFormSubmissionDto } from 'src/forms/forms/dto/create-form-submission.dto';
import { NotesServiceMixin } from 'src/users/mixins/notes.service.mixin';
import { UsersService } from 'src/users/users.service';
import { FormSubmissionsServiceMixin } from 'src/forms/forms/mixins/form-submission.service.mixin';
import { BaseEntityService } from 'src/common/base-entity.service';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { FormsService } from 'src/forms/forms/forms.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { scopeToOrganizationLevel } from 'src/organizations/common/organizations.utils';

@Injectable({ scope: Scope.REQUEST })
export class ThreatAssessmentsService extends FormSubmissionsServiceMixin<ThreatAssessment>()(
  NotesServiceMixin<ThreatAssessment>()(BaseEntityService<ThreatAssessment>),
) {
  formSlug = THREAT_ASSESSMENT_FORM_SLUG;
  foreignKeyColumn = 'assessmentId';
  alias = 'assessment';
  entity = ThreatAssessment;

  constructor(
    @InjectRepository(ThreatAssessment)
    private assessmentsRepository: Repository<ThreatAssessment>,
    readonly usersService: UsersService,
    @Inject(REQUEST) readonly request: Request,
    readonly formsService: FormsService,
  ) {
    super();
  }

  getRepository() {
    return this.assessmentsRepository;
  }

  getQb(query?: BaseQueryDto) {
    return scopeToOrganizationLevel(this.request, super.getQb(query))
      .leftJoinAndSelect(`${super.getQb().alias}.unit`, 'unit')
      .leftJoinAndSelect(`${super.getQb().alias}.pocFiles`, 'pocFiles');
  }

  create(
    createSubmissionEntityDto: DeepPartial<ThreatAssessment> & {
      submission: CreateFormSubmissionDto;
    },
  ) {
    if (!this.request.user?.unitSlug) {
      throw new UnauthorizedException('User is not associated with a unit.');
    }
    return super.create({
      ...createSubmissionEntityDto,
      unitSlug: this.request.user.unitSlug,
    });
  }
}
