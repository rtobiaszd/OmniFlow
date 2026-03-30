import { Injectable } from '@nestjs/common';
import { MetricService } from './services/metric.service';

@Injectable()
export class AppService {
  constructor(private readonly metricService: MetricService) { }

  async getMetrics(filterDto: any) {
    return this.metricService.getMetrics(filterDto);
  }
}