import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [],
  controllers: [FilesController],
  providers: [FilesService, PrismaService],
  exports: [FilesService, PrismaService],
})
export class FilesModule {}
