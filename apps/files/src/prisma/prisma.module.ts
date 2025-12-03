import { DynamicModule, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({})
export class PrismaModule {
  static forRootAsync(options: {
    useFactory: (...args: any[]) => { url: string };
    inject: any[];
  }): DynamicModule {
    return {
      module: PrismaModule,
      providers: [
        {
          provide: PrismaService,
          useFactory: (...args: any[]) => {
            const config = options.useFactory(...args);
            return new PrismaService(config.url);
          },
          inject: options.inject,
        },
      ],
      exports: [PrismaService],
    };
  }
}
