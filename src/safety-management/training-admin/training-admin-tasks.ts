import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class TrainingAdminTasks {
  logger = new Logger(TrainingAdminTasks.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleRefreshWatchStats() {
    this.logger.log('Refreshing watch stats...');
    await this.dataSource.query('REFRESH MATERIALIZED VIEW watch_stat;');
  }
}
