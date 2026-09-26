import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembershipsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.membership.findUnique({ where: { id } });
  }

  findOverviewForUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        membership: {
          include: { payments: { orderBy: { createdAt: 'desc' }, take: 5 } }
        }
      }
    });
  }
}
