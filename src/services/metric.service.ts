import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricService {
  async getMetrics(filterDto: any): Promise<any[]> {
    // mock temporário (evita erro de tipo)
    return [];
  }
}