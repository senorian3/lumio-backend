import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@libs/logger/logger.module';
import { CoreModule } from '@payments/core/core.module';
import { CoreConfig } from '@payments/core/core.config';
import { PrismaModule } from '@payments/prisma/prisma.module';

const services = [];

const useCases = [];

const queryHandler = [];

const repository = [];

const queryRepository = [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CoreModule,
    LoggerModule,
    PrismaModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => ({ url: coreConfig.dbUrl }),
      inject: [CoreConfig],
    }),
  ],

  controllers: [],
  providers: [
    ...services,
    ...useCases,
    ...queryHandler,
    ...repository,
    ...queryRepository,
  ],
})
export class PaymentsModule {
  static forRoot(coreConfig: CoreConfig): DynamicModule {
    return {
      module: PaymentsModule,
      providers: [
        {
          provide: CoreConfig,
          useValue: coreConfig,
        },
      ],
    };
  }
}
