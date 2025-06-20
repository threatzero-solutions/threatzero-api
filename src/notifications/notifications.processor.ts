import {
  SendTextMessageCommand,
  SendTextMessageCommandInput,
} from '@aws-sdk/client-pinpoint-sms-voice-v2';
import { SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-sesv2';
import {
  InjectQueue,
  Processor,
  WorkerHost,
  OnWorkerEvent,
} from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bullmq';
import { Cache } from 'cache-manager';
import { RedisStore } from 'cache-manager-ioredis-yet';
import { KeycloakAdminClientService } from 'src/auth/keycloak-admin-client/keycloak-admin-client.service';
import { PinpointSmsService } from 'src/aws/pinpoint-sms/pinpoint-sms.service';
import { SesService } from 'src/aws/ses/ses.service';
import {
  NOTIFICATIONS_QUEUE_NAME,
  NOTIFICATIONS_QUEUE_PREFIX,
} from 'src/common/constants/queue.constants';
import { getUserAttr, truthyAttr } from 'src/common/utils';
import { Tip } from 'src/safety-management/tips/entities/tip.entity';
import { DataSource } from 'typeorm';

export enum NotificationsJobNames {
  SendEmailNotification = 'send-email-notification',
  SendSMSNotification = 'send-sms-notification',
  SendNewTipNotifications = 'send-new-tip-notifications',
}

const SMS_THROTTLING_BUFFER = 0.1;
const SMS_MESSAGES_PER_SECOND = 3;

@Processor(NOTIFICATIONS_QUEUE_NAME, { prefix: NOTIFICATIONS_QUEUE_PREFIX })
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE_NAME) private readonly queue: Queue,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly config: ConfigService,
    private readonly ses: SesService,
    private readonly pinpointSms: PinpointSmsService,
    private readonly keycloak: KeycloakAdminClientService,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(
      `Received shutdown signal: ${signal}. Closing BullMQ queue and Redis cache...`,
    );
    await this.worker.close().catch((e: any) => this.logger.warn(e));
    await this.queue.close().catch((e: any) => this.logger.warn(e));
    // Redis client cleanup is handled automatically by cache-manager v7
  }

  async process(job: Job<unknown>) {
    switch (job.name) {
      case NotificationsJobNames.SendEmailNotification:
        await this.sendEmailNotification(job.data);
        break;
      case NotificationsJobNames.SendSMSNotification:
        await this.sendSMSNotification(job.data);
        break;
      case NotificationsJobNames.SendNewTipNotifications:
        await this.sendNewTipNotifications(job.data);
        break;
      default:
        break;
    }
  }

  @OnWorkerEvent('failed')
  async onWorkerFailed(job: Job<unknown>, error: Error) {
    this.logger.error(`Job ${job.name} failed`, error.stack);
  }

  private async sendEmailNotification(data: any) {
    const params: SendEmailCommandInput = {
      FromEmailAddress: this.config.getOrThrow<string>(
        'notifications.email.defaultFrom',
      ),
      Destination: {
        ToAddresses: data.to,
      },
      Content: {
        Template: {
          TemplateName: data.templateName,
          TemplateData: JSON.stringify(data.context),
        },
      },
    };
    const cmd = new SendEmailCommand(params);
    await this.ses.client.send(cmd);
  }

  private async sendSMSNotification(data: any) {
    const params: SendTextMessageCommandInput = {
      DestinationPhoneNumber: data.to,
      MessageBody: data.messageBody,
      OriginationIdentity: this.config.get<string>(
        'notifications.sms.originationPhoneNumber',
      ),
    };
    const cmd = new SendTextMessageCommand(params);
    await this.pinpointSms.client.send(cmd);
  }

  private async sendNewTipNotifications(data: any) {
    const tip = await this.dataSource.getRepository(Tip).findOneOrFail({
      where: {
        id: data.tipId,
      },
      relations: {
        unit: {
          organization: true,
        },
      },
    });
    const cacheKey = `unit:${tip.unit.slug}:tat-member-contacts`;
    const cachedContacts = await this.cache.get(cacheKey);
    let contacts: { email?: string; phoneNumber?: string }[] | undefined;
    if (cachedContacts && typeof cachedContacts === 'string') {
      try {
        contacts = JSON.parse(cachedContacts);
      } catch (e) {
        this.logger.error('Failed to parse cached contacts', e);
      }
      if (
        !Array.isArray(contacts) ||
        !contacts.every((c) => c.email || c.phoneNumber)
      ) {
        contacts = undefined;
      }
    }
    if (!contacts) {
      const tatGroupId = tip.unit.tatGroupId;
      const orgTatGroupId = tip.unit.organization.tatGroupId;
      if (!tatGroupId) {
        this.logger.warn(`No TAT group found for ${tip.unit.slug}`);
        return;
      }
      const tatMembers = await Promise.all(
        [tatGroupId, orgTatGroupId]
          .filter((id) => !!id)
          .map((id) =>
            this.keycloak.client.groups.listMembers({
              id: id!,
            }),
          ),
      ).then((results) => results.flat(2));

      contacts = [];
      const foundUserIds = new Set();
      for (const user of tatMembers) {
        // Ensure only one contact per user.
        if (foundUserIds.has(user.id)) {
          continue;
        }
        foundUserIds.add(user.id);

        const userAttributes = user.attributes || {};

        if (!truthyAttr(userAttributes.sosNotificationsEnabled)) {
          continue;
        }

        let phoneNumber: string | undefined;
        let email: string | undefined;

        // Get phone number if user has verified phone number.
        const userPhoneNumber = getUserAttr(userAttributes.phoneNumber);
        if (truthyAttr(userAttributes.phoneNumberVerified) && userPhoneNumber) {
          phoneNumber = userPhoneNumber;
        }

        // Get user email.
        if (user.email) {
          email = user.email;
        }

        if (phoneNumber || email) {
          contacts.push({
            email,
            phoneNumber,
          });
        }
      }
      this.cache.set(cacheKey, JSON.stringify(contacts), 5 * 60 * 1000); // Cache expires in 5 minutes
    }
    const tipUrl =
      this.config.get<string>('general.appHost') +
      '/safety-management/safety-concerns/' +
      tip.id;
    const phoneNumbers = contacts
      .filter((c) => c.phoneNumber)
      .map((c) => c.phoneNumber);
    this.queue.addBulk(
      phoneNumbers.map((phoneNumber, idx) => ({
        name: NotificationsJobNames.SendSMSNotification,
        data: {
          to: phoneNumber,
          messageBody: `[THREATZERO] A new safety concern has been submitted. View at ${tipUrl}`,
        },
        opts: {
          delay:
            ((1000 * (1 + SMS_THROTTLING_BUFFER)) / SMS_MESSAGES_PER_SECOND) *
            idx,
          attempts: 3,
        },
      })),
    );
    const emails = contacts.filter((c) => c.email).map((c) => c.email);
    if (emails.length) {
      this.queue.add(NotificationsJobNames.SendEmailNotification, {
        to: emails,
        templateName: this.config.get<string>(
          'notifications.email.templates.newTip',
        ),
        context: {
          tipUrl,
        },
      });
    }
  }
}
