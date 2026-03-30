import { Injectable } from '@nestjs/common';

export interface Metric {
  id: string;
  name: string;
}

export interface GetMetricsFilterDto {
  search?: string;
}

@Injectable()
export class MetricService {
  async getMetrics(): Promise<Metric[]> {
    return [];
  }
}