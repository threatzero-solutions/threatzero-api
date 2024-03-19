import { Audience } from '../audiences/entities/audience.entity';

export class AudienceChangeEvent {
  id: Audience['id'];

  constructor(id: Audience['id']) {
    this.id = id;
  }

  static forAudience(audience: Audience) {
    return new AudienceChangeEvent(audience.id);
  }
}
