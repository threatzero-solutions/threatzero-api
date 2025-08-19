import { ActiveOrganizationGuard } from './active-organization.guard';

describe('ActiveOrganizationGuard', () => {
  it('should be defined', () => {
    expect(new ActiveOrganizationGuard()).toBeDefined();
  });
});
