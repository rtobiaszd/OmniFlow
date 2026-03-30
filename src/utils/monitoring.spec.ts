// Updated monitoring to use NestJS testing utilities.
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import request from 'supertest';


describe('Monitoring', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should start', async () => {
    expect(app).toBeDefined();
    const response = await request(app.getHttpServer()).get('/');
    expect(response.status).toBe(200);
  });
});