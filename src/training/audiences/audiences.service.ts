import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Audience } from './entities/audience.entity';
import { Repository } from 'typeorm';
import { BaseEntityService } from 'src/common/base-entity.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AudienceChangeEvent } from '../events/audience-change.event';
import {
  AUDIENCE_CHANGED_EVENT,
  AUDIENCE_REMOVED_EVENT,
} from '../listeners/audience-change.listener';

@Injectable()
export class AudiencesService extends BaseEntityService<Audience> {
  constructor(
    @InjectRepository(Audience)
    private audiencesRepository: Repository<Audience>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  getRepository() {
    return this.audiencesRepository;
  }

  async afterUpdate(audience: Audience) {
    this.eventEmitter.emit(
      AUDIENCE_CHANGED_EVENT,
      AudienceChangeEvent.forAudience(audience),
    );
  }

  async beforeRemove(id: Audience['id']) {
    this.eventEmitter.emit(AUDIENCE_REMOVED_EVENT, new AudienceChangeEvent(id));
  }
}
