import { ApplicationError } from '../../common/errors/application-error';

export class PaymentDeclinedError extends ApplicationError {
  constructor() {
    super('PAYMENT_DECLINED', 402, 'The demo payment was declined.');
  }
}
