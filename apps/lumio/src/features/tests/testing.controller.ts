import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
    await this.prismaService.gitHub.deleteMany();
    await this.prismaService.post.deleteMany();
    await this.prismaService.user.deleteMany();
  }
}
