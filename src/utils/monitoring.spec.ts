// Updated monitoring spec to use NestJS testing utilities.
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';

describe('Monitoring', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('should start the application and listen on port 3000', async () => {
    const app = module.get<INestApplication>(NestApplication);
    await app.listen(3000);
    console.log('Application is running on: http://localhost:3000');
    await app.close();
  });
});