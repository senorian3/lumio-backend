import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { LumioAccessTokenContextDto } from '@chat/core/adapters/dto/lumio-access-token-context.dto';
import { AppLoggerService } from '@libs/logger/logger.service';

@Injectable()
export class LumioAuthHttpAdapter {
  private readonly lumioServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly logger: AppLoggerService,
  ) {
    this.lumioServiceUrl = this.configService.get<string>('LUMIO_SERVICE_URL');
  }

  async validateAccessToken(
    accessToken: string,
  ): Promise<LumioAccessTokenContextDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<LumioAccessTokenContextDto>(
          `${this.lumioServiceUrl}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      if (!response.data?.userId) {
        throw new UnauthorizedException('Unauthorized: Invalid token payload');
      }

      return { userId: response.data.userId };
    } catch (error) {
      this.logger.warn(
        'Failed to validate access token through Lumio',
        LumioAuthHttpAdapter.name,
      );

      if (error instanceof AxiosError && error.response?.status === 401) {
        throw new UnauthorizedException('Unauthorized: Invalid token');
      }

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Unauthorized: Token validation failed');
    }
  }
}
