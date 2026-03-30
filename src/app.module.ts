
import { Module } from '@nestjs/common';
import monitoring from '../utils/monitoring';

@Module({
  imports: [],
  controllers: [],
  providers: []})
export class AppModule {}

if (require.main === module) {
  monitoring();
}
      