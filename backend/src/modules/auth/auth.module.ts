import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { StepUpService } from './step-up.service';
import { GitHubStrategy } from './strategies/github.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { WalletAuthService } from './wallet-auth.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const jwtSecret = config.get<string>('JWT_SECRET');
        if (!jwtSecret || jwtSecret.length < 32) {
          throw new Error(
            'CRITICAL: JWT_SECRET must be set and at least 32 characters. Refusing to boot JwtModule with an insecure fallback.',
          );
        }
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m'),
            algorithm: 'HS256',
          },
        };
      },
    }),
    UsersModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, WalletAuthService, StepUpService, JwtStrategy, GitHubStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
