import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common';
import { Tip } from './entities/tip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { TIP_SUBMISSION_FORM_SLUG } from 'src/common/constants/form.constants';
import { CreateFormSubmissionDto } from 'src/forms/forms/dto/create-form-submission.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TipSubmittedEvent } from './events/tip-submitted.event';
import { TIP_SUBMITTED_EVENT } from './listeners/submit-tip.listener';
import { LocationsService } from 'src/organizations/locations/locations.service';
import { BaseEntityService } from 'src/common/base-entity.service';
import { FormSubmissionsServiceMixin } from 'src/forms/forms/mixins/form-submission.service.mixin';
import { NotesServiceMixin } from 'src/users/mixins/notes.service.mixin';
import { REQUEST } from '@nestjs/core';
import { FormsService } from 'src/forms/forms/forms.service';
import { UsersService } from 'src/users/users.service';
import { Request } from 'express';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { scopeToOrganizationLevel } from 'src/organizations/common/organizations.utils';

@Injectable({ scope: Scope.REQUEST })
export class TipsService extends FormSubmissionsServiceMixin<Tip>()(
  NotesServiceMixin<Tip>()(BaseEntityService<Tip>),
) {
  formSlug = TIP_SUBMISSION_FORM_SLUG;
  foreignKeyColumn = 'tipId';
  alias = 'tip';
  entity = Tip;

  constructor(
    @InjectRepository(Tip) private tipsRepository: Repository<Tip>,
    private locationsService: LocationsService,
    private eventEmitter: EventEmitter2,
    readonly usersService: UsersService,
    @Inject(REQUEST) readonly request: Request,
    readonly formsService: FormsService,
  ) {
    super();
  }

  getRepository() {
    return this.tipsRepository;
  }

  getQb(query?: BaseQueryDto) {
    return scopeToOrganizationLevel(
      this.request,
      super.getQb(query),
    ).leftJoinAndSelect(`${super.getQb().alias}.unit`, 'unit');
  }

  async create(
    createSubmissionEntityDto: DeepPartial<Tip> & {
      submission: CreateFormSubmissionDto;
    },
    locationId?: string,
  ) {
    const submittedTip = await super.create({
      ...createSubmissionEntityDto,
      // Add user unit slug to tip.
      unitSlug: await this.getUnitSlugForTip(locationId),
    });

    // Emit tip submitted event.
    this.eventEmitter.emit(
      TIP_SUBMITTED_EVENT,
      TipSubmittedEvent.forTip(submittedTip),
    );

    return submittedTip;
  }

  /**
   * Gets unit slug either from user info or from location id. Throws an
   * UnauthorizedException if no location information is found.
   *
   * @param locationId the location id of the tip
   * @returns the unit slug
   */
  private async getUnitSlugForTip(locationId?: string) {
    if (this.request.user?.unitSlug) {
      return this.request.user.unitSlug;
    }

    if (locationId) {
      const unit =
        await this.locationsService.findUnitForLocationId(locationId);

      if (unit) {
        return unit.slug;
      }
    }

    throw new BadRequestException('No location information found.');
  }
}
