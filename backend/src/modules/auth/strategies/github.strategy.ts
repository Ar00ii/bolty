import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly config: ConfigService) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL'),
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
