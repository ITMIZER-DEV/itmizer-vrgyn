import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { IncomingMessage, ServerResponse } from 'http';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require('express');
const server = express();
let isInitialized = false;

async function bootstrap() {
  if (!isInitialized) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    app.enableCors();
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    app.useGlobalPipes(new ValidationPipe());

    const config = new DocumentBuilder()
      .setTitle('Itmizer VR API')
      .setDescription('Documentação da API Itmizer VR')
      .setVersion('1.0')
      .addTag('api')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('apiDocs', app, document, {
      customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
      ],
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: 'Itmizer VR API Docs',
    });

    await app.init();
    isInitialized = true;
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await bootstrap();
  server(req, res);
}
