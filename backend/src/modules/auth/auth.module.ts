import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
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
        // Get JWT_SECRET from environment, or use a temporary placeholder if not set
        // Must be at least 32 chars to pass AuthService validation
        // AuthService will still validate that a real secret is configured in production
        const jwtSecret = config.get<string>('JWT_SECRET', 'temporary-placeholder-secret-for-testing-purposes-only-32plus-chars');
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
  providers: [AuthService, WalletAuthService, JwtStrategy, GitHubStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
