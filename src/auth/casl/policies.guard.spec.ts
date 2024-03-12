import { CaslAbilityFactory } from './casl-ability.factory';
import { PoliciesGuard } from './policies.guard';

describe('PoliciesGuard', () => {
  it('should be defined', () => {
    expect(new PoliciesGuard(new CaslAbilityFactory())).toBeDefined();
  });
});
