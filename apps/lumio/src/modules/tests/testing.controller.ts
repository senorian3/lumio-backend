import axios from 'axios';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { CoreConfig } from '@lumio/core/core.config';
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
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

  @Post('create-users-with-posts')
  @HttpCode(HttpStatus.CREATED)
  async createUsersWithPosts(): Promise<void> {
    await this.prismaService.$transaction(async (prisma) => {
      for (let i = 1; i <= 4; i++) {
        const user = await prisma.user.create({
          data: {
            username: `hellotestuser${i}`,
            email: `hellotestuser${i}@example.com`,
            password: `Password${i}`,
          },
        });

        const post = await prisma.post.create({
          data: {
            id: `post-${i}-${Date.now()}`,
            description: `Пост пользователя ${i}`,
            user: { connect: { id: user.id } },
          },
        });

        const photoCount = i === 4 ? 3 : 1;
        for (let j = 1; j <= photoCount; j++) {
          await prisma.postFile.create({
            data: {
              post: { connect: { id: post.id } },
              url: `https://test-bucket-lumio.storage.yandexcloud.net/content/posts/1/1_image_1_c915352c.png`,
            },
          });
        }
      }
    });
  }
}
