import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from '@/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard'; 

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  
  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Global API prefix to match frontend calls
  app.setGlobalPrefix('api/v1');

  app.useStaticAssets(join(__dirname, '..', 'public')); //js, css, images
  app.setBaseViewsDir(join(__dirname, '..', 'views')); //view 
  app.setViewEngine('ejs');

  // Bật validation toàn cục
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('HRM Agribank API')
    .setDescription('API quản lý nhân sự (NestJS + Prisma)')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('HRM')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = configService.get<string>('PORT');
  await app.listen(Number(port));

  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📘 Swagger UI available at http://localhost:${port}/api-docs`);
}

bootstrap().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});
