import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';

export function swaggerSetup(
  app: INestApplication,
  isSwaggerEnabled: boolean,
  port: number,
) {
  if (isSwaggerEnabled) {
    const swaggerPath = 'swagger';

    const builder = new DocumentBuilder()
      .setTitle('LUMIO API')
      .addBearerAuth()
      .setVersion('1.0')
      .setDescription('Lumio backend API documentation')
      .addServer(`localhost:${port}', 'Lumio (development)`)
      .addServer('lumio.su', 'Lumio (production)');

    const config = builder.build();

    const swaggerOptions: SwaggerDocumentOptions = {
      ignoreGlobalPrefix: false,
      autoTagControllers: true,
    };

    const theme = new SwaggerTheme().getBuffer(SwaggerThemeNameEnum.MUTED);

    const SwaggerCustomOptions: SwaggerCustomOptions = {
      raw: ['json'],
      customSiteTitle: 'Lumio swagger',
      customCss: theme,
      jsonDocumentUrl: '/swagger/json',
      swaggerOptions: {
        filter: true,
        showCommonExtensions: true,
        showExtensions: true,
      },
    };

    const document = SwaggerModule.createDocument(app, config, swaggerOptions);
    SwaggerModule.setup(swaggerPath, app, document, SwaggerCustomOptions);
  }
}
