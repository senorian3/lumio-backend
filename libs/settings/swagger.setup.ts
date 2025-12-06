import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';

export function swaggerSetup(app: INestApplication, isSwaggerEnabled: boolean) {
  if (isSwaggerEnabled) {
    const swaggerPath = 'api/swagger';
    const config = new DocumentBuilder()
      .setTitle('LUMIO API')
      .addBearerAuth()
      .setVersion('1.0')
      .setDescription('Lumio backend API documentation')
      .addBearerAuth()
      .addServer(swaggerPath)
      .build();

    const swaggerOptions: SwaggerDocumentOptions = {
      ignoreGlobalPrefix: false,
      autoTagControllers: true,
    };

    const SwaggerCustomOptions: SwaggerCustomOptions = {
      raw: ['json'],
      customSiteTitle: 'Lumio swagger',
      customCss: customCss,
      jsonDocumentUrl: '/api/swagger/json',
      swaggerOptions: {
        filter: true,
        showExtensions: true,
      },
    };

    const document = SwaggerModule.createDocument(app, config, swaggerOptions);
    SwaggerModule.setup(swaggerPath, app, document, SwaggerCustomOptions);
  }
}

const customCss = `
  /* ===== МИНИМАЛИСТИЧНЫЙ СТИЛЬ ===== */
  
  /* Убираем стандартную верхнюю панель */
  .swagger-ui .topbar { 
    display: none !important; 
  }
  
  /* ===== КРАСИВЫЙ ЗАГОЛОВОК ===== */
  .swagger-ui .info {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 0 0 20px 20px;
    padding: 50px 20px 40px;
    color: white;
    margin: 0 0 40px 0;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
    position: relative;
    overflow: hidden;
  }
  
  /* Декоративный элемент для заголовка */
  .swagger-ui .info::before {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 150px;
    height: 150px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }
  
  .swagger-ui .info::after {
    content: '';
    position: absolute;
    bottom: -30px;
    left: -30px;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
  }
  
  .swagger-ui .info .title {
    color: white !important;
    font-size: 2.8rem !important;
    font-weight: 700 !important;
    text-align: center;
    margin-bottom: 15px !important;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 1;
  }
  
  .swagger-ui .info .description {
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
    font-size: 1.2rem;
    opacity: 0.95;
    line-height: 1.6;
    position: relative;
    z-index: 1;
    font-weight: 300;
  }
  
  /* ===== ВЕРСИЯ ===== */
  .swagger-ui .info .version {
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.9rem;
    margin-top: 15px;
    backdrop-filter: blur(10px);
  }
  
  /* ===== ГРУППЫ (ТЕГИ) ===== */
  .swagger-ui .opblock-tag {
    font-size: 1.4rem;
    font-weight: 600;
    color: #2d3748;
    border-bottom: 3px solid #e2e8f0;
    padding: 15px 0 12px;
    margin: 30px 0 20px;
    position: relative;
    transition: all 0.3s ease;
  }
  
  .swagger-ui .opblock-tag:hover {
    color: #667eea;
    border-bottom-color: #667eea;
  }
  
  .swagger-ui .opblock-tag::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    width: 60px;
    height: 3px;
    background: #667eea;
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }
  
  .swagger-ui .opblock-tag:hover::after {
    transform: scaleX(1);
  }
  
  /* ===== ENDPOINT БЛОКИ ===== */
  .swagger-ui .opblock {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin: 15px 0;
    background: white;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .swagger-ui .opblock:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    border-color: #cbd5e0;
  }
  
  /* Цвета методов HTTP */
  .swagger-ui .opblock-summary-method {
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 6px 15px;
    min-width: 85px;
    text-align: center;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .swagger-ui .opblock-get .opblock-summary-method { 
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }
  
  .swagger-ui .opblock-post .opblock-summary-method { 
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }
  
  .swagger-ui .opblock-put .opblock-summary-method { 
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
  }
  
  .swagger-ui .opblock-delete .opblock-summary-method { 
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }
  
  .swagger-ui .opblock-patch .opblock-summary-method { 
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
  }
  
  /* ===== КНОПКИ ===== */
  .swagger-ui .btn {
    border-radius: 8px;
    font-weight: 500;
    padding: 10px 24px;
    transition: all 0.2s ease !important;
    border: none;
    font-size: 0.95rem;
  }
  
  .swagger-ui .btn.execute {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
  }
  
  .swagger-ui .btn.execute:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
  }
  
  .swagger-ui .btn.try-out__btn {
    background: white;
    color: #3b82f6;
    border: 2px solid #3b82f6;
  }
  
  .swagger-ui .btn.try-out__btn:hover {
    background: #3b82f6;
    color: white;
  }
  
  .swagger-ui .btn.cancel {
    background: #f1f5f9;
    color: #64748b;
  }
  
  .swagger-ui .btn.cancel:hover {
    background: #e2e8f0;
    color: #475569;
  }
  
  /* ===== INPUT ПОЛЯ ===== */
  .swagger-ui input[type="text"],
  .swagger-ui input[type="email"],
  .swagger-ui input[type="password"],
  .swagger-ui input[type="number"],
  .swagger-ui select,
  .swagger-ui textarea {
    border-radius: 8px;
    border: 2px solid #e2e8f0;
    padding: 10px 14px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }
  
  .swagger-ui input:focus,
  .swagger-ui select:focus,
  .swagger-ui textarea:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    outline: none;
  }
  
  /* ===== ТАБЛИЦЫ ===== */
  .swagger-ui table thead tr {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  }
  
  .swagger-ui table thead tr th {
    font-weight: 600;
    color: #475569;
    border-bottom: 2px solid #e2e8f0;
  }
  
  .swagger-ui table tbody tr {
    border-bottom: 1px solid #f1f5f9;
  }
  
  .swagger-ui table tbody tr:hover {
    background: #f8fafc;
  }
  
  /* ===== СКРОЛЛБАР ===== */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  /* ===== АНИМАЦИИ ===== */
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .swagger-ui .opblock {
    animation: slideUp 0.4s ease-out;
  }
  
  /* Задержка для последовательного появления */
  .swagger-ui .opblock:nth-child(1) { animation-delay: 0.1s; }
  .swagger-ui .opblock:nth-child(2) { animation-delay: 0.2s; }
  .swagger-ui .opblock:nth-child(3) { animation-delay: 0.3s; }
  .swagger-ui .opblock:nth-child(4) { animation-delay: 0.4s; }
  
  /* ===== РАЗДЕЛИТЕЛИ ===== */
  .swagger-ui .opblock-summary {
    border-bottom: 1px solid #f1f5f9;
    padding: 20px;
  }
  
  .swagger-ui .opblock-summary:hover {
    background: #f8fafc;
  }
  
  /* ===== МОДЕЛИ ===== */
  .swagger-ui .model-box {
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    padding: 15px;
  }
  
  /* ===== RESPONSIVE ===== */
  @media (max-width: 768px) {
    .swagger-ui .info {
      padding: 40px 15px 30px;
      border-radius: 0 0 15px 15px;
      margin-bottom: 30px;
    }
    
    .swagger-ui .info .title {
      font-size: 2.2rem !important;
    }
    
    .swagger-ui .info .description {
      font-size: 1.1rem;
      padding: 0 10px;
    }
    
    .swagger-ui .opblock-tag {
      font-size: 1.2rem;
      padding: 12px 0 10px;
    }
    
    .swagger-ui .opblock {
      margin: 12px 0;
    }
    
    .swagger-ui .btn {
      padding: 8px 16px;
      font-size: 0.9rem;
    }
  }
  
  /* ===== СЕКЦИИ С ДЕТАЛЯМИ ===== */
  .swagger-ui .opblock-body {
    padding: 20px;
  }
  
  .swagger-ui .opblock-description-wrapper,
  .swagger-ui .opblock-external-docs-wrapper,
  .swagger-ui .opblock-title_normal {
    color: #4a5568;
    line-height: 1.6;
  }
  
  /* ===== ССЫЛКИ ===== */
  .swagger-ui a {
    color: #3b82f6;
    text-decoration: none;
    transition: color 0.2s ease;
  }
  
  .swagger-ui a:hover {
    color: #2563eb;
    text-decoration: underline;
  }
  
  /* ===== СПИННЕР ЗАГРУЗКИ ===== */
  .swagger-ui .loading-container .loading::after {
    border: 3px solid #e2e8f0;
    border-top-color: #3b82f6;
  }
  
  /* ===== ФУТЕР (если есть) ===== */
  .swagger-ui .footer {
    margin-top: 40px;
    padding: 20px;
    text-align: center;
    color: #94a3b8;
    font-size: 0.9rem;
    border-top: 1px solid #e2e8f0;
  }
`;
