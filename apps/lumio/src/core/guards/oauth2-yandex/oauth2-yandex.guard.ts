import { CoreConfig } from '@lumio/core/core.config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-yandex';

@Injectable()
export class YandexStrategy extends PassportStrategy(Strategy, 'yandex') {
  constructor(private readonly coreConfig: CoreConfig) {
    super({
      clientID: coreConfig.yandexClientId,
      clientSecret: coreConfig.yandexClientSecret,
      callbackURL: coreConfig.yandexCallbackUrl,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return {
      yandexId: profile.id,
      email: profile.emails?.[0]?.value,
      username: profile.username,
    };
  }
}
