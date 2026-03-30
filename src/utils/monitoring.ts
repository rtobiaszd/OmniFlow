// Updated monitoring to use NestJS testing utilities.
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000, () => {
    console.log('Application is running on: http://localhost:3000');
  });
}
bootstrap();