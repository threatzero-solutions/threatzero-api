import { UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { BaseEntityService } from 'src/common/base-entity.service';
import { THREAT_ASSESSMENT_FORM_SLUG } from 'src/common/constants/form.constants';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { CreateFormSubmissionDto } from 'src/forms/forms/dto/create-form-submission.dto';
import { FormsService } from 'src/forms/forms/forms.service';
import { FormSubmissionsServiceMixin } from 'src/forms/forms/mixins/form-submission.service.mixin';
import { scopeToOrganizationLevel } from 'src/organizations/common/organizations.utils';
import { NotesServiceMixin } from 'src/users/mixins/notes.service.mixin';
import { UsersService } from 'src/users/users.service';
import { DeepPartial, Repository } from 'typeorm';
import { ThreatAssessment } from './entities/threat-assessment.entity';

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
    private readonly cls: ClsService<CommonClsStore>,
    readonly formsService: FormsService,
  ) {
    super();
  }

  getRepository() {
    return this.assessmentsRepository;
  }

  getQb(query?: BaseQueryDto) {
    const user = this.cls.get('user');
    return scopeToOrganizationLevel(
      user,
      super.getQb(query),
      `${super.getQb().alias}.unit`,
    )
      .leftJoinAndSelect(`${super.getQb().alias}.unit`, 'unit')
      .leftJoinAndSelect(`${super.getQb().alias}.pocFiles`, 'pocFiles');
  }

  async create(
    createSubmissionEntityDto: DeepPartial<ThreatAssessment> & {
      submission: CreateFormSubmissionDto;
    },
  ) {
    const user = this.cls.get('user');
    if (!user?.unitSlug) {
      throw new UnauthorizedException('User is not associated with a unit.');
    }
    return this.usersService.updateRepresentation(user).then((userRep) =>
      super.create({
        ...createSubmissionEntityDto,
        unitId: userRep?.unitId,
      }),
    );
  }
}
