import { DynamicModule, Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { configModule } from '@libs/core/config-dynamic.module';
import { PrismaModule } from '@files/prisma/prisma.module';
import { CoreConfig } from '@files/core/core.config';
import { CoreModule } from '@files/core/core.module';
import { TestingModule } from '@nestjs/testing';

@Module({
  imports: [
    configModule,
    PrismaModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        const uri = coreConfig.dbUrl;
        console.log('DB_URL', uri);
        return { url: uri };
      },
      inject: [CoreConfig],
    }),
    CoreModule,
  ],
  controllers: [FilesController],
})
export class FilesModule {
  static async forRoot(coreConfig: CoreConfig): Promise<DynamicModule> {
    return {
      module: FilesModule,
      imports: [...(coreConfig.includeTestingModule ? [TestingModule] : [])],
    };
  }
}
