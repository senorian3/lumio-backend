import { PrismaService } from '@lumio/prisma/prisma.service';
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
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData(): Promise<void> {
    await this.prismaService.$transaction([
      this.prismaService.session.deleteMany(),
      this.prismaService.emailConfirmation.deleteMany(),
      this.prismaService.yandex.deleteMany(),
      this.prismaService.postFile.deleteMany(),
      this.prismaService.post.deleteMany(),
      this.prismaService.user.deleteMany(),
    ]);
  }

  @Post('create-users-with-posts')
  @HttpCode(HttpStatus.CREATED)
  async createUsersWithPosts(): Promise<void> {
    await this.prismaService.$transaction(async (prisma) => {
      // Создаем 4 пользователей с постами и фотографиями
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
            description: `Пост пользователя ${i}`,
            userId: user.id,
          },
        });

        // Количество фотографий: для первых 3 пользователей - 1, для 4-го - 3
        const photoCount = i === 4 ? 3 : 1;
        for (let j = 1; j <= photoCount; j++) {
          await prisma.postFile.create({
            data: {
              postId: post.id,
              url: `https://test-bucket-lumio.storage.yandexcloud.net/content/posts/1/1_image_1_c915352c.png`,
            },
          });
        }
      }
    });
  }
}
