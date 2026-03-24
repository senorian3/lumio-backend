import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CoreConfig } from '../core.config';
import { FileDto } from './dto/file.dto';
import { FileSortBy } from './dto/file-sort-by.enum';
import { FilesResponse } from './dto/files-response.dto';
import { AppLoggerService } from '@libs/logger/logger.service';

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
    sortBy: FileSortBy = FileSortBy.DATE_DESC,
  ): Promise<FileDto[]> {
    try {
      const url = `${this.config.filesServiceUrl}/api/v1/files/user/${userId}/files`;

      const sortByParam = this.mapSortByToApiParam(sortBy);

      const response = await firstValueFrom(
        this.httpService.get<FilesResponse>(url, {
          params: {
            page,
            limit,
            sortBy: sortByParam,
          },
          headers: {
            'x-internal-api-key': this.config.internalApiKey,
          },
          timeout: 10000,
        }),
      );

      const items = Array.isArray(response.data)
        ? response.data
        : response.data.items || [];

      return items.map(
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

  private mapSortByToApiParam(sortBy: FileSortBy): string {
    switch (sortBy) {
      case FileSortBy.DATE_ASC:
        return 'date_asc';
      case FileSortBy.DATE_DESC:
        return 'date_desc';
      default:
        return 'date_desc';
    }
  }
}
