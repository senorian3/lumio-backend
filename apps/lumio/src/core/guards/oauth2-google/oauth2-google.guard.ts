import { CoreConfig } from '@lumio/core/core.config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly coreConfig: CoreConfig) {
    super({
      clientID: coreConfig.googleClientId,
      clientSecret: coreConfig.googleClientSecret,
      callbackURL: coreConfig.googleCallbackUrl,
      scope: ['profile', 'email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value ?? null;
    return {
      googleId: profile.id,
      email,
      username: profile.displayName ?? null,
    };
  }
}
