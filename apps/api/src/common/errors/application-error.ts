export type ApplicationErrorCode =
  | 'VALIDATION_FAILED'
  | 'AUTHENTICATION_FAILED'
  | 'MEMBERSHIP_NOT_FOUND'
  | 'MEMBERSHIP_ACCESS_DENIED'
  | 'MEMBERSHIP_CANCELLED'
  | 'PAYMENT_DECLINED'
  | 'INTERNAL_ERROR';

export class ApplicationError extends Error {
  constructor(
    public readonly code: ApplicationErrorCode,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}
