import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationError } from '../common/errors/application-error';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    const passwordMatches = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
    if (!user || !passwordMatches) throw new ApplicationError('AUTHENTICATION_FAILED', 401, 'Email or password is incorrect.');
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    return { accessToken, user: { id: user.id, email: user.email, role: user.role } };
  }
}
