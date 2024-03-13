import { Injectable, Scope } from '@nestjs/common';
import { CreateTipDto } from './dto/create-tip.dto';
import { UpdateTipDto } from './dto/update-tip.dto';
import { BaseEntityService } from 'src/common/base-entity.service';
import { Tip } from './entities/tip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { BaseFormsSubmissionsService } from 'src/forms/forms/common/base-form-submissions.service';
import { TIP_SUBMISSION_FORM_SLUG } from 'src/common/constants/form.constants';
import { CreateFormSubmissionDto } from 'src/forms/forms/dto/create-form-submission.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TipSubmittedEvent } from './events/tip-submitted.event';
import { TIP_SUBMITTED_EVENT } from './listeners/submit-tip.listener';

@Injectable({ scope: Scope.REQUEST })
export class TipsService extends BaseFormsSubmissionsService<Tip> {
  formSlug = TIP_SUBMISSION_FORM_SLUG;
  noteEntityFieldName = 'tipId';

  constructor(
    @InjectRepository(Tip) private tipsRepository: Repository<Tip>,
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
  ): Promise<DeepPartial<Tip> & Tip> {
    const submittedTip = await super.create(createSubmissionEntityDto);
    this.eventEmitter.emit(
      TIP_SUBMITTED_EVENT,
      TipSubmittedEvent.forTip(submittedTip),
    );
    return submittedTip;
  }
}
