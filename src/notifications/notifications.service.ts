import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  NOTIFICATIONS_QUEUE_NAME,
  NOTIFICATIONS_QUEUE_PREFIX,
} from 'src/common/constants/queue.constants';

@Injectable()
export class NotificationsService {
  private readonly queues: Record<string, Queue>;

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE_NAME) private readonly queue: Queue,
  ) {
    this.queues = {
      [this.queue.name]: this.queue,
    };
  }

  async getJobQueues() {
    return Promise.all(
      Object.values(this.queues).map(async (q) => {
        const [failedJobs, waitingJobs, activeJobs] = await Promise.all([
          q.getFailed(),
          q.getWaiting(),
          q.getActive(),
        ]);

        // Transform jobs to plain objects to avoid class-transformer issues
        const transformJob = (job: any) => JSON.parse(JSON.stringify(job));

        return {
          queueName: q.name,
          failedJobs: failedJobs.map(transformJob),
          waitingJobs: waitingJobs.map(transformJob),
          activeJobs: activeJobs.map(transformJob),
        };
      }),
    );
  }

  async retryJob(queueName: string, jobId: string) {
    const job =
      await this.queues[this.cleanQueueName(queueName)]?.getJob(jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    await job.retry();
  }

  async removeJob(queueName: string, jobId: string) {
    await this.queues[this.cleanQueueName(queueName)]?.remove(jobId);
  }

  private cleanQueueName(queueName: string) {
    return queueName.replace(NOTIFICATIONS_QUEUE_PREFIX + ':', '');
  }
}
