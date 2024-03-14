import { Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { ThreatAssessment } from './entities/threat-assessment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { THREAT_ASSESSMENT_FORM_SLUG } from 'src/common/constants/form.constants';
import { BaseFormsSubmissionsService } from 'src/forms/forms/common/base-form-submissions.service';
import { CreateFormSubmissionDto } from 'src/forms/forms/dto/create-form-submission.dto';

@Injectable({ scope: Scope.REQUEST })
export class ThreatAssessmentsService extends BaseFormsSubmissionsService<ThreatAssessment> {
  formSlug = THREAT_ASSESSMENT_FORM_SLUG;
  noteEntityFieldName = 'assessmentId';
  alias = 'assessment';

  constructor(
    @InjectRepository(ThreatAssessment)
    private assessmentsRepository: Repository<ThreatAssessment>,
  ) {
    super();
  }

  getRepository() {
    return this.assessmentsRepository;
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
