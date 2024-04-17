import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TipSubmittedEvent } from '../events/tip-submitted.event';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NOTIFICATIONS_QUEUE_NAME } from 'src/common/constants/queue.constants';
import { NotificationsJobNames } from 'src/notifications/notifications.processor';

export const TIP_SUBMITTED_EVENT = 'tip.submitted';

@Injectable()
export class SubmitTipListener {
  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE_NAME) private notificationsQueue: Queue,
  ) {}

  @OnEvent(TIP_SUBMITTED_EVENT)
  handleTipSubmissionEvent(event: TipSubmittedEvent) {
    this.notificationsQueue.add(NotificationsJobNames.SendNewTipNotifications, {
      tipId: event.tipId,
    });
  }
}
