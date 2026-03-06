import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

export const swaggerConfig = () => {
  return new DocumentBuilder()
    .setTitle('HR API')
    .setDescription('API documentation for HR project')
    .setVersion('1.0')
    .addBearerAuth() // Enable Bearer authentication
    .build();
};

export const swaggerCustomOptions: SwaggerCustomOptions = {
  swaggerOptions: { persistAuthorization: true },
};
