import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserAccountsConfig } from '@lumio/modules/user-accounts/config/user-accounts.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(userAccountsConfig: UserAccountsConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: userAccountsConfig.accessTokenSecret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: {
    userId: number;
    deviceId: string;
  }): Promise<{ userId: number; deviceId: string }> {
    return {
      userId: payload.userId,
      deviceId: payload.deviceId,
    };
  }
}
