import { PrismaService } from '@files/prisma/prisma.service';
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';

@Controller('testing')
export class TestingController {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(S3FilesHttpAdapter) private readonly s3Adapter: S3FilesHttpAdapter,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData(): Promise<void> {
    await this.s3Adapter.deleteAllFiles();
    await this.prismaService.$transaction([
      this.prismaService.postFile.deleteMany(),
      this.prismaService.userAvatar.deleteMany(),
    ]);
  }
}
