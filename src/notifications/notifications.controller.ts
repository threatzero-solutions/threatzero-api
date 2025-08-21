import { Controller, Get, Param, Post } from '@nestjs/common';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { LEVEL } from 'src/auth/permissions';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@CheckPolicies(
  (ability, context) => !!context.request.user?.hasPermission?.(LEVEL.ADMIN),
)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('job-queues')
  async getJobQueues() {
    return this.notifications.getJobQueues();
  }

  @Post('job-queues/:queueName/retry-job/:jobId')
  async retryJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    return this.notifications.retryJob(queueName, jobId);
  }

  @Post('job-queues/:queueName/remove-job/:jobId')
  async removeJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    return this.notifications.removeJob(queueName, jobId);
  }
}
