import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from '../auth.types';

type JwtPayload = { sub?: string; id?: string; email: string; role: AuthenticatedUser['role'] };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string }; user?: AuthenticatedUser }>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Authentication required.');
    try {
      const payload = this.jwtService.verify<JwtPayload>(authorization.slice(7));
      const id = payload.sub ?? payload.id;
      if (!id) throw new Error('Invalid subject');
      request.user = { id, email: payload.email, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Authentication required.');
    }
  }
}
