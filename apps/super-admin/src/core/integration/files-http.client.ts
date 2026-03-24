import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CoreConfig } from '../core.config';
import { FileDto } from './dto/file.dto';
import { AppLoggerService } from '@libs/logger/logger.service';

interface FileResponse {
  id: number;
  url: string;
  postId: string;
}

@Injectable()
export class FilesHttpClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: CoreConfig,
    private readonly logger: AppLoggerService,
  ) {}

  async getUserFiles(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<FileDto[]> {
    try {
      const url = `${this.config.filesServiceUrl}/api/v1/files/user/${userId}/files`;

      const response = await firstValueFrom(
        this.httpService.get<FileResponse[]>(url, {
          params: {
            page,
            limit,
          },
          headers: {
            'x-internal-api-key': this.config.internalApiKey,
          },
          timeout: 10000,
        }),
      );

      return response.data.map(
        (item) =>
          new FileDto({
            id: item.id,
            url: item.url,
            postId: item.postId,
          }),
      );
    } catch (error) {
      this.logger.error(
        `Files service error for user ${userId}: ${error.message}`,
        FilesHttpClient.name,
      );
      return [];
    }
  }
}
