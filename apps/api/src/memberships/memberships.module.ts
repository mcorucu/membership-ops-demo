import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';
import { MembershipsController } from './memberships.controller';
import { MembershipsRepository } from './memberships.repository';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [AuthModule, PaymentsModule],
  controllers: [MembershipsController],
  providers: [MembershipsRepository, MembershipsService]
})
export class MembershipsModule {}
