import {
  Inject,
  Injectable,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { ViolentIncidentReport } from './entities/violent-incident-report.entity';
import { BaseEntityService } from 'src/common/base-entity.service';
import { FormSubmissionsServiceMixin } from 'src/forms/forms/mixins/form-submission.service.mixin';
import { NotesServiceMixin } from 'src/users/mixins/notes.service.mixin';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FormsService } from 'src/forms/forms/forms.service';
import { UsersService } from 'src/users/users.service';
import { Request } from 'express';
import { scopeToOrganizationLevel } from 'src/organizations/common/organizations.utils';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { CreateFormSubmissionDto } from 'src/forms/forms/dto/create-form-submission.dto';
import { VIOLENT_INCIDENT_REPORT_FORM_SLUG } from 'src/common/constants/form.constants';

@Injectable({ scope: Scope.REQUEST })
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
    @Inject(REQUEST) readonly request: Request,
    readonly formsService: FormsService,
  ) {
    super();
  }

  getRepository() {
    return this.incidentsRepository;
  }

  getQb(query?: BaseQueryDto) {
    return scopeToOrganizationLevel(this.request, super.getQb(query))
      .leftJoinAndSelect(`${super.getQb().alias}.unit`, 'unit')
      .leftJoinAndSelect(`${super.getQb().alias}.pocFiles`, 'pocFiles');
  }

  create(
    createSubmissionEntityDto: DeepPartial<ViolentIncidentReport> & {
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
