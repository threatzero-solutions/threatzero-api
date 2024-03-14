import { OrganizationBase } from '../common/entities/organizations-base.entity';

export class BaseOrganizationChangeEvent {
  id: OrganizationBase['id'];

  constructor(id: OrganizationBase['id']) {
    this.id = id;
  }

  static forOrganization(org: OrganizationBase) {
    return new BaseOrganizationChangeEvent(org.id);
  }
}
