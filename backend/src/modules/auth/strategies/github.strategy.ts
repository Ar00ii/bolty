import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly config: ConfigService) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID') || process.env.GITHUB_CLIENT_ID || 'Ov23liO79MvZtWDEdy2a',
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET') || process.env.GITHUB_CLIENT_SECRET || 'b9e08f25b6e46d0b012e7be6183e38bb0d43d662',
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL') || process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/github/callback',
      scope: ['read:user', 'public_repo'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: {
      id: string;
      username: string;
      photos?: Array<{ value: string }>;
      _json: { bio?: string; avatar_url: string; login: string };
    },
  ) {
    return {
      id: profile.id,
      login: profile.username,
      avatar_url: profile._json.avatar_url,
      bio: profile._json.bio,
      accessToken, // Used for fetching repos
    };
  }
}
