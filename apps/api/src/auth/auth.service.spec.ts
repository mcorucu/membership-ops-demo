import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = { user: { findUnique: jest.fn() } } as any;
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed-demo-token') } as unknown as JwtService;
  const service = new AuthService(prisma, jwt);

  beforeEach(() => jest.clearAllMocks());

  it('rejects an invalid password with a generic auth error', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'member@example.com', role: 'MEMBER', passwordHash: await bcrypt.hash('correct-password', 4) });
    await expect(service.login({ email: 'member@example.com', password: 'wrong-password' })).rejects.toMatchObject({ code: 'AUTHENTICATION_FAILED', statusCode: 401 });
  });

  it('returns a signed token without returning the password hash', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'member@example.com', role: 'MEMBER', passwordHash: await bcrypt.hash('correct-password', 4) });
    await expect(service.login({ email: 'member@example.com', password: 'correct-password' })).resolves.toEqual({ accessToken: 'signed-demo-token', user: { id: 'u1', email: 'member@example.com', role: 'MEMBER' } });
  });
});
