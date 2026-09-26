import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RenewMembershipDto } from './dto/renew-membership.dto';
import { MembershipsService } from './memberships.service';

@Controller('memberships')
@UseGuards(JwtAuthGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get('me/overview')
  getOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.membershipsService.getOverview(user);
  }

  @Post(':membershipId/renew')
  renewMembership(
    @Param('membershipId') membershipId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: RenewMembershipDto
  ) {
    return this.membershipsService.renewMembership(membershipId, user, input);
  }
}
