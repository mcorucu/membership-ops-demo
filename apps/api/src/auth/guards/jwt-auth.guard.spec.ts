import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('rejects an unauthenticated request', () => {
    const guard = new JwtAuthGuard({ verify: jest.fn() } as unknown as JwtService);
    const context = { switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }) } as unknown as ExecutionContext;
    expect(() => guard.canActivate(context)).toThrow();
  });

  it('attaches the verified identity to the request', () => {
    const guard = new JwtAuthGuard({ verify: jest.fn().mockReturnValue({ sub: 'user-1', email: 'member@example.com', role: 'MEMBER' }) } as unknown as JwtService);
    const request = { headers: { authorization: 'Bearer signed' } } as any;
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
    expect(guard.canActivate(context)).toBe(true);
    expect(request.user).toEqual({ id: 'user-1', email: 'member@example.com', role: 'MEMBER' });
  });
});
