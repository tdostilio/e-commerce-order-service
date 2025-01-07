import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Orders API') // Title of the API
    .setDescription('The orders API description') // Description of the API
    .setVersion('1.0') // Version of the API
    .addTag('orders') // Tag for the API
    .build(); // Build the configuration

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Serves Swagger UI at /api/docs

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
