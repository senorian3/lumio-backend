import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github';
import axios from 'axios';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    let email: string | null = null;

    if (!profile.emails || profile.emails.length === 0) {
      try {
        const { data } = await axios.get('https://api.github.com/user/emails', {
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        const primaryEmail = data.find((e: any) => e.primary && e.verified);
        email = primaryEmail ? primaryEmail.email : null;
      } catch (err) {
        console.error('Ошибка при запросе email из GitHub API:', err);
      }
    } else {
      email = profile.emails[0].value;
    }

    return {
      gitId: profile.id,
      username: profile.username || profile.displayName || profile.login,
      email,
    };
  }
}
