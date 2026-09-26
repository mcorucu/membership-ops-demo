import { IsIn, IsString } from 'class-validator';

export class RenewMembershipDto {
  @IsIn([1, 3, 6, 12])
  months!: 1 | 3 | 6 | 12;

  @IsString()
  @IsIn(['pm_demo_success', 'pm_demo_declined'])
  paymentMethodId!: 'pm_demo_success' | 'pm_demo_declined';
}
