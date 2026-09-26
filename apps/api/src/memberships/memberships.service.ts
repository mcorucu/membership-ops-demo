import { Injectable } from '@nestjs/common';
import { MembershipStatus, Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { ApplicationError } from '../common/errors/application-error';
import { PaymentGateway } from '../payments/payment-gateway';
import { PrismaService } from '../prisma/prisma.service';
import { RenewMembershipDto } from './dto/renew-membership.dto';
import { addMonths, calculateRenewalPrice } from './pricing/pricing';
import { MembershipsRepository } from './memberships.repository';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly repository: MembershipsRepository,
    private readonly prisma: PrismaService,
    private readonly paymentGateway: PaymentGateway
  ) {}

  async getOverview(user: AuthenticatedUser) {
    const overview = await this.repository.findOverviewForUser(user.id);
    if (!overview?.membership) throw new ApplicationError('MEMBERSHIP_NOT_FOUND', 404, 'Membership not found.');
    return overview;
  }

  async renewMembership(membershipId: string, user: AuthenticatedUser, input: RenewMembershipDto) {
    const membership = await this.repository.findById(membershipId);
    if (!membership) throw new ApplicationError('MEMBERSHIP_NOT_FOUND', 404, 'Membership not found.');
    if (user.role === 'MEMBER' && membership.userId !== user.id) {
      throw new ApplicationError('MEMBERSHIP_ACCESS_DENIED', 403, 'You cannot renew this membership.');
    }
    if (membership.status === MembershipStatus.CANCELLED) {
      throw new ApplicationError('MEMBERSHIP_CANCELLED', 409, 'Cancelled memberships cannot be renewed.');
    }

    const price = calculateRenewalPrice(membership.monthlyPriceCents, input.months);
    const payment = await this.paymentGateway.charge({ amountCents: price.amountCents, paymentMethodId: input.paymentMethodId, userId: user.id });
    const now = new Date();
    const renewalStart = membership.validUntil > now ? membership.validUntil : now;
    const nextValidUntil = addMonths(renewalStart, input.months);

    const result = await this.prisma.$transaction(async (tx) => {
      const savedPayment = await tx.payment.create({
        data: {
          userId: membership.userId,
          membershipId: membership.id,
          amountCents: price.amountCents,
          months: input.months,
          status: 'PAID',
          providerReference: payment.providerReference
        }
      });
      const updatedMembership = await tx.membership.update({
        where: { id: membership.id },
        data: { validUntil: nextValidUntil, status: 'ACTIVE' }
      });
      return { membership: updatedMembership, payment: savedPayment, price };
    });

    return result;
  }
}
