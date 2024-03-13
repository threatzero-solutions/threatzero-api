import { Injectable, Scope } from '@nestjs/common';
import { ThreatAssessment } from './entities/threat-assessment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { THREAT_ASSESSMENT_FORM_SLUG } from 'src/common/constants/form.constants';
import { BaseFormsSubmissionsService } from 'src/forms/forms/common/base-form-submissions.service';

@Injectable({ scope: Scope.REQUEST })
export class ThreatAssessmentsService extends BaseFormsSubmissionsService<ThreatAssessment> {
  formSlug = THREAT_ASSESSMENT_FORM_SLUG;
  noteEntityFieldName = 'assessmentId';

  constructor(
    @InjectRepository(ThreatAssessment)
    private assessmentsRepository: Repository<ThreatAssessment>,
  ) {
    super();
  }

  getRepository() {
    return this.assessmentsRepository;
  }
}
