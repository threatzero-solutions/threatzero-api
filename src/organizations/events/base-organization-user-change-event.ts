import { OrganizationUserDto } from '../organizations/dto/organization-user.dto';
import { Organization } from '../organizations/entities/organization.entity';

export class BaseOrganizationUserChangeEvent {
  id: OrganizationUserDto['id'];
  organizationSlug: Organization['slug'];
  organizationId: Organization['id'];

  constructor(id: OrganizationUserDto['id'], organization: Organization) {
    this.id = id;
    this.organizationId = organization.id;
    this.organizationSlug = organization.slug;
  }

  static forUser(user: OrganizationUserDto, organization: Organization) {
    return new BaseOrganizationUserChangeEvent(user.id, organization);
  }
}
