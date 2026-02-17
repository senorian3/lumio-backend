import axios from 'axios';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { CoreConfig } from '@lumio/core/core.config';
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';

@Controller('testing')
export class TestingController {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(CoreConfig) private readonly coreConfig: CoreConfig,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData(): Promise<void> {
    const filesResponse = await axios.delete(
      `${this.coreConfig.filesFrontendUrl}/api/v1/testing/all-data`,
    );

    if (filesResponse.status !== 204) {
      throw new Error('Failed to delete all data in files');
    }

    const paymentsResponse = await axios.delete(
      `${this.coreConfig.paymentsFrontendUrl}/api/v1/testing/all-data`,
    );

    if (paymentsResponse.status !== 204) {
      throw new Error('Failed to delete all data in payments');
    }

    try {
      await this.prismaService.$transaction([
        this.prismaService.session.deleteMany(),
        this.prismaService.emailConfirmation.deleteMany(),
        this.prismaService.yandex.deleteMany(),
        this.prismaService.postFile.deleteMany(),
        this.prismaService.post.deleteMany(),
        this.prismaService.user.deleteMany(),
      ]);
    } catch (error) {
      console.error(error);
      throw new Error('Failed to delete all data in lumio');
    }
  }
}
