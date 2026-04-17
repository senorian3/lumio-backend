import { getThemeSync } from '@intelika/swagger-theme';
import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';

export function swaggerSetup(app: INestApplication, isSwaggerEnabled: boolean) {
  if (isSwaggerEnabled) {
    const swaggerPath = '/api/v1/swagger';

    const builder = new DocumentBuilder()
      .setTitle('CHAT API')
      .addBearerAuth()
      .addServer('https://lumio.su', 'Testing')
      .addServer('http://localhost:3004', 'Local')
      .setVersion('1.0')
      .setDescription('Lumio Chat API documentation')
      .addSecurity('internal', {
        type: 'apiKey',
        name: 'x-internal-api-key',
        in: 'header',
        description: 'Internal API key for service-to-service communication',
      })
      .addGlobalResponse({
        status: 500,
        description: 'Internal server error',
      });

    const config = builder.build();

    const swaggerOptions: SwaggerDocumentOptions = {
      ignoreGlobalPrefix: false,
      autoTagControllers: true,
    };

    const SwaggerCustomOptions: SwaggerCustomOptions = {
      raw: ['json'],
      customSiteTitle: 'Chat swagger',
      customCss: getThemeSync().toString(),
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
