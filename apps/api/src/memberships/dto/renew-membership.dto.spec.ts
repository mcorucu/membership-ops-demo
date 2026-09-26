import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RenewMembershipDto } from './renew-membership.dto';

describe('RenewMembershipDto', () => {
  it('accepts supported terms and methods', async () => {
    const errors = await validate(plainToInstance(RenewMembershipDto, { months: 6, paymentMethodId: 'pm_demo_success' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects unsupported terms and methods', async () => {
    const errors = await validate(plainToInstance(RenewMembershipDto, { months: 2, paymentMethodId: 'card_123' }));
    expect(errors.length).toBeGreaterThan(0);
  });
});
