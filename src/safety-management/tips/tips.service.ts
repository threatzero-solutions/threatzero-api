import { BadRequestException } from '@nestjs/common';
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
import { FormsService } from 'src/forms/forms/forms.service';
import { UsersService } from 'src/users/users.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { scopeToOrganizationLevel } from 'src/organizations/common/organizations.utils';
import { GetPresignedUploadUrlsDto } from 'src/forms/forms/dto/get-presigned-upload-urls.dto';
import { Location } from 'src/organizations/locations/entities/location.entity';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from 'src/common/types/common-cls-store';

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
    readonly formsService: FormsService,
    private readonly cls: ClsService<CommonClsStore>,
  ) {
    super();
  }

  getRepository() {
    return this.tipsRepository;
  }

  getQb(query?: BaseQueryDto) {
    const user = this.cls.get('user');
    return scopeToOrganizationLevel(user, super.getQb(query))
      .leftJoinAndSelect(`${super.getQb().alias}.unit`, 'unit')
      .leftJoinAndSelect(`${super.getQb().alias}.location`, 'location')
      .leftJoinAndSelect(`${super.getQb().alias}.pocFiles`, 'pocFiles');
  }

  async create(
    createSubmissionEntityDto: DeepPartial<Tip> & {
      submission: CreateFormSubmissionDto;
    },
    locationId?: string,
  ) {
    const user = this.cls.get('user');
    const [unitId, location] =
      await this.getUnitIdAndLocationForTip(locationId);
    const submittedTip = await super.create({
      ...createSubmissionEntityDto,
      // Add user unit slug to tip.
      unitId,
      location: location ?? undefined,
      informantFirstName: user?.firstName,
      informantLastName: user?.lastName,
      informantEmail: user?.email,
    });

    // Emit tip submitted event.
    this.eventEmitter.emit(
      TIP_SUBMITTED_EVENT,
      TipSubmittedEvent.forTip(submittedTip),
    );

    return submittedTip;
  }

  async getPresignedUploadUrls(
    getPresignedUploadUrlsDto: GetPresignedUploadUrlsDto,
    locationId: string,
  ) {
    // Validate location.
    await this.getUnitIdAndLocationForTip(locationId);
    return super.getPresignedUploadUrls(getPresignedUploadUrlsDto);
  }

  /**
   * Gets unit slug either from user info or from location id. Throws an
   * UnauthorizedException if no location information is found.
   *
   * @param locationId the location id of the tip
   * @returns the unit slug
   */
  private async getUnitIdAndLocationForTip(locationId?: string) {
    let location: Location | null = null;

    if (locationId) {
      location = await this.locationsService.findUnitLocation(locationId);

      if (location?.unit) {
        return [location.unit.id, location] as const;
      }
    }

    const user = this.cls.get('user');
    if (user) {
      const unitId = await this.usersService
        .getOrCreateRepresentation(user)
        .then((userRep) => userRep.unitId);
      if (unitId) {
        return [unitId, location] as const;
      }
    }

    throw new BadRequestException('No location information found.');
  }
}
