import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { PrismaService } from './database/prisma.service';
import {
  swaggerConfig,
  swaggerCustomOptions,
} from './core/config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = swaggerConfig();

  app.get(PrismaService);
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, swaggerCustomOptions);
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
