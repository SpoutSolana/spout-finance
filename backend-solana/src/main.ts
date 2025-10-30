import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with explicit configuration
  app.enableCors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
    credentials: false,
  });
  
  // Listen on all interfaces (0.0.0.0)
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
