import { UnauthorizedException } from '@nestjs/common';
import { ViolentIncidentReport } from './entities/violent-incident-report.entity';
import { BaseEntityService } from 'src/common/base-entity.service';
import { FormSubmissionsServiceMixin } from 'src/forms/forms/mixins/form-submission.service.mixin';
import { NotesServiceMixin } from 'src/users/mixins/notes.service.mixin';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { FormsService } from 'src/forms/forms/forms.service';
import { UsersService } from 'src/users/users.service';
import { scopeToOrganizationLevel } from 'src/organizations/common/organizations.utils';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { CreateFormSubmissionDto } from 'src/forms/forms/dto/create-form-submission.dto';
import { VIOLENT_INCIDENT_REPORT_FORM_SLUG } from 'src/common/constants/form.constants';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from 'src/common/types/common-cls-store';

export class ViolentIncidentReportsService extends FormSubmissionsServiceMixin<ViolentIncidentReport>()(
  NotesServiceMixin<ViolentIncidentReport>()(
    BaseEntityService<ViolentIncidentReport>,
  ),
) {
  formSlug = VIOLENT_INCIDENT_REPORT_FORM_SLUG;
  foreignKeyColumn = 'violentIncidentReportId';
  alias = 'violent_incident_report';
  entity = ViolentIncidentReport;

  constructor(
    @InjectRepository(ViolentIncidentReport)
    private incidentsRepository: Repository<ViolentIncidentReport>,
    readonly usersService: UsersService,
    private readonly cls: ClsService<CommonClsStore>,
    readonly formsService: FormsService,
  ) {
    super();
  }

  getRepository() {
    return this.incidentsRepository;
  }

  getQb(query?: BaseQueryDto) {
    const user = this.cls.get('user');
    return scopeToOrganizationLevel(user, super.getQb(query))
      .leftJoinAndSelect(`${super.getQb().alias}.unit`, 'unit')
      .leftJoinAndSelect(`${super.getQb().alias}.pocFiles`, 'pocFiles');
  }

  async create(
    createSubmissionEntityDto: DeepPartial<ViolentIncidentReport> & {
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
