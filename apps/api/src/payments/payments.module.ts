import { Module } from '@nestjs/common';
import { FakePaymentGateway } from './fake-payment.gateway';
import { PaymentGateway } from './payment-gateway';

@Module({ providers: [{ provide: PaymentGateway, useClass: FakePaymentGateway }], exports: [PaymentGateway] })
export class PaymentsModule {}
