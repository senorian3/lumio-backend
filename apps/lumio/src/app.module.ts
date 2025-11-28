import { configModule } from '../../../libs/core/config-dynamic.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  imports: [configModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {
  static forRoot: any;
}
