import { Injectable } from '@nestjs/common';
import { CreateThreatAssessmentDto } from './dto/create-threat-assessment.dto';
import { UpdateThreatAssessmentDto } from './dto/update-threat-assessment.dto';
import { BaseEntityService } from 'src/common/base-entity.service';
import { ThreatAssessment } from './entities/threat-assessment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ThreatAssessmentsService extends BaseEntityService<ThreatAssessment> {
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
