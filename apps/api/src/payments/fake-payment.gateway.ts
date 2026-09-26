import { Injectable } from '@nestjs/common';
import { PaymentGateway, PaymentCharge, PaymentResult } from './payment-gateway';
import { PaymentDeclinedError } from './exceptions/payment-declined.error';

@Injectable()
export class FakePaymentGateway implements PaymentGateway {
  async charge(input: PaymentCharge): Promise<PaymentResult> {
    if (input.paymentMethodId === 'pm_demo_declined') throw new PaymentDeclinedError();
    if (input.paymentMethodId !== 'pm_demo_success') throw new PaymentDeclinedError();
    return { providerReference: `demo_${input.userId.slice(0, 8)}_${input.amountCents}` };
  }
}
