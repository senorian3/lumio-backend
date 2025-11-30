import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma-lumio';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(url: string) {
    super({
      datasources: {
        db: {
          url: url,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect(); // подключение к БД
  }

  async onModuleDestroy() {
    await this.$disconnect(); // отключение при завершении
  }
}
