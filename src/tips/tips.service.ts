import { Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { Tip } from './entities/tip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { BaseFormsSubmissionsService } from 'src/forms/forms/common/base-form-submissions.service';
import { TIP_SUBMISSION_FORM_SLUG } from 'src/common/constants/form.constants';
import { CreateFormSubmissionDto } from 'src/forms/forms/dto/create-form-submission.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TipSubmittedEvent } from './events/tip-submitted.event';
import { TIP_SUBMITTED_EVENT } from './listeners/submit-tip.listener';
import { LocationsService } from 'src/organizations/locations/locations.service';

// TODO: Build tips stats.

@Injectable({ scope: Scope.REQUEST })
export class TipsService extends BaseFormsSubmissionsService<Tip> {
  formSlug = TIP_SUBMISSION_FORM_SLUG;
  noteEntityFieldName = 'tipId';

  constructor(
    @InjectRepository(Tip) private tipsRepository: Repository<Tip>,
    private locationsService: LocationsService,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  getRepository() {
    return this.tipsRepository;
  }

  async create(
    createSubmissionEntityDto: DeepPartial<Tip> & {
      submission: CreateFormSubmissionDto;
    },
    locationId?: string,
  ): Promise<DeepPartial<Tip> & Tip> {
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

    throw new UnauthorizedException('No location information found.');
  }
}
