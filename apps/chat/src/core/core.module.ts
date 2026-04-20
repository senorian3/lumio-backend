import { ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreConfig } from './core.config';

@Global()
@Module({
  imports: [
    CqrsModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CoreConfig, ConfigService],
  exports: [CoreConfig, CqrsModule, JwtModule],
})
export class ChatCoreModule {}
