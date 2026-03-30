import { Controller, Get, Query } from '@nestjs/common';
import { MetricService, GetMetricsFilterDto } from '../services/metric.service';

@Controller('metrics')
export class MetricController {
  constructor(private readonly metricService: MetricService) { }

  @Get()
  async getMetrics(@Query() filterDto: GetMetricsFilterDto) {
    return this.metricService.getMetrics(filterDto);
  }
}