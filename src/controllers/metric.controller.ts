// Optimized query logic in MetricController to reduce database load.
import { Controller, Get, Query } from '@nestjs/common';
import { MetricService } from '../services/metric.service';

@Controller('metrics')
class MetricController {
  constructor(private readonly metricService: MetricService) {}

  @Get()
  async getMetrics(@Query() filterDto: any) {
    return this.metricService.getMetrics(filterDto);
  }
}