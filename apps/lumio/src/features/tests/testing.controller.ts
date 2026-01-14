import { PrismaService } from '@lumio/prisma/prisma.service';
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
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData(): Promise<void> {
    await this.prismaService.session.deleteMany();
    await this.prismaService.emailConfirmation.deleteMany();
    await this.prismaService.yandex.deleteMany();
    await this.prismaService.postFile.deleteMany();
    await this.prismaService.post.deleteMany();
    await this.prismaService.user.deleteMany();
  }
}
