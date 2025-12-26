import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';

export function swaggerSetup(app: INestApplication, isSwaggerEnabled: boolean) {
  if (isSwaggerEnabled) {
    const swaggerPath = '/api/v1/swagger';

    const builder = new DocumentBuilder()
      .setTitle('LUMIO API')
      .addBearerAuth()
      .setVersion('1.0')
      .setDescription('Lumio backend API documentation')
      .addServer('https://lumio.su', 'Lumio (Testing)')
      .addGlobalResponse({
        status: 500,
        description: 'Internal server error',
      });

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
      jsonDocumentUrl: 'api/v1/swagger/json',
      swaggerOptions: {
        filter: true,
        showCommonExtensions: true,
        showExtensions: true,
        displayRequestDuration: true,
        urls: [
          {
            url: '/api/v1/swagger/json',
            name: 'API v1',
          },
        ],
      },
    };

    const document = SwaggerModule.createDocument(app, config, swaggerOptions);
    SwaggerModule.setup(swaggerPath, app, document, SwaggerCustomOptions);
  }
}
