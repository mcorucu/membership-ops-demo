import { MembershipsService } from './memberships.service';

function fixture(overrides: Record<string, unknown> = {}) {
  return { id: 'membership-1', userId: 'member-1', plan: 'Performance', monthlyPriceCents: 4900, status: 'ACTIVE', validUntil: new Date('2026-01-15T00:00:00.000Z'), ...overrides };
}

describe('MembershipsService', () => {
  const repository = { findById: jest.fn(), findOverviewForUser: jest.fn() } as any;
  const paymentGateway = { charge: jest.fn() } as any;
  const prisma = { $transaction: jest.fn() } as any;
  const service = new MembershipsService(repository, prisma, paymentGateway);
  const member = { id: 'member-1', email: 'member@example.com', role: 'MEMBER' } as any;

  beforeEach(() => jest.clearAllMocks());

  it('prevents a member from renewing another member membership', async () => {
    repository.findById.mockResolvedValue(fixture({ userId: 'someone-else' }));
    await expect(service.renewMembership('membership-1', member, { months: 1, paymentMethodId: 'pm_demo_success' })).rejects.toMatchObject({ code: 'MEMBERSHIP_ACCESS_DENIED', statusCode: 403 });
    expect(paymentGateway.charge).not.toHaveBeenCalled();
  });

  it('prevents cancelled membership renewal', async () => {
    repository.findById.mockResolvedValue(fixture({ status: 'CANCELLED' }));
    await expect(service.renewMembership('membership-1', member, { months: 1, paymentMethodId: 'pm_demo_success' })).rejects.toMatchObject({ code: 'MEMBERSHIP_CANCELLED', statusCode: 409 });
  });

  it('does not touch the database when payment is declined', async () => {
    repository.findById.mockResolvedValue(fixture());
    paymentGateway.charge.mockRejectedValue({ code: 'PAYMENT_DECLINED' });
    await expect(service.renewMembership('membership-1', member, { months: 1, paymentMethodId: 'pm_demo_declined' })).rejects.toMatchObject({ code: 'PAYMENT_DECLINED' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('writes payment and membership update in one transaction', async () => {
    const existing = fixture({ validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) });
    repository.findById.mockResolvedValue(existing);
    paymentGateway.charge.mockResolvedValue({ providerReference: 'demo_ref' });
    const tx = { payment: { create: jest.fn().mockResolvedValue({ id: 'payment-1', amountCents: 13965 }) }, membership: { update: jest.fn().mockResolvedValue({ ...existing, validUntil: new Date('2026-04-15') }) } };
    prisma.$transaction.mockImplementation(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx));
    const result = await service.renewMembership('membership-1', member, { months: 3, paymentMethodId: 'pm_demo_success' });
    expect(tx.payment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'PAID', months: 3, providerReference: 'demo_ref' }) }));
    expect(tx.membership.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'membership-1' } }));
    expect(result.price.amountCents).toBe(13965);
  });

  it('propagates transaction failures without presenting a successful result', async () => {
    repository.findById.mockResolvedValue(fixture());
    paymentGateway.charge.mockResolvedValue({ providerReference: 'demo_ref' });
    prisma.$transaction.mockRejectedValue(new Error('database unavailable'));
    await expect(service.renewMembership('membership-1', member, { months: 1, paymentMethodId: 'pm_demo_success' })).rejects.toThrow('database unavailable');
  });
});
