import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID') || '',
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET') || '',
      callbackURL:
        config.get<string>('GITHUB_CALLBACK_URL') ||
        'http://localhost:3001/api/v1/auth/github/callback',
      scope: ['read:user', 'repo'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
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
