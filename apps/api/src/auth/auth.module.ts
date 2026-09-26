import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me', signOptions: { expiresIn: '2h' } })],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule]
})
export class AuthModule {}
