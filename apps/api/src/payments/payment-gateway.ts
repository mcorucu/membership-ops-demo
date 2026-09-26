export type PaymentCharge = {
  amountCents: number;
  paymentMethodId: string;
  userId: string;
};

export type PaymentResult = {
  providerReference: string;
};

export abstract class PaymentGateway {
  abstract charge(input: PaymentCharge): Promise<PaymentResult>;
}
