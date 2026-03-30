import { Injectable } from '@nestjs/common';
import { MetricService, GetMetricsFilterDto } from './services/metric.service';

@Injectable()
export class AppService {
  constructor(private readonly metricService: MetricService) { }

  async getMetrics(filterDto: GetMetricsFilterDto) {
    return this.metricService.getMetrics(filterDto);
  }
}