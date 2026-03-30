// Updated to use optimized MetricService methods.
import { Injectable } from '@nestjs/common';

@Injectable()
class AppService {
  constructor(private readonly metricService: MetricService) {}

  async getMetrics(filterDto: any) {
    return this.metricService.getMetrics(filterDto);
  }
}