import { PrismaService } from '@files/prisma/prisma.service';
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
  async deleteAllData(): Promise<void> {}
}
