import { DynamicModule, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from '@chat/core/core.module';
import { PrismaModule } from '@chat/prisma/prisma.module';
import { CoreConfig } from '@chat/core/core.config';
import { AppModule } from './app.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.chat.${process.env.NODE_ENV || 'development'}`,
    }),
    CoreModule,
    PrismaModule,
  ],
})
class ConfigBootstrapModule {}

export async function initAppModule(): Promise<DynamicModule> {
  const appContext = await NestFactory.createApplicationContext(
    ConfigBootstrapModule,
  );
  const coreConfig = appContext.get<CoreConfig>(CoreConfig);
  await appContext.close();
  return AppModule.forRoot(coreConfig);
}
