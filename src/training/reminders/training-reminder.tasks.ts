import { InjectQueue } from '@nestjs/bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import dayjs from 'dayjs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationsJobNames } from 'src/notifications/notifications.processor';
import { NOTIFICATIONS_QUEUE_NAME } from 'src/common/constants/queue.constants';
import { CourseEnrollment } from 'src/organizations/organizations/entities/course-enrollment.entity';
import { TRAINING_PARTICIPANT_ROLE_GROUP_PATH } from 'src/organizations/organizations/constants';
import { KeycloakAdminClientService } from 'src/auth/keycloak-admin-client/keycloak-admin-client.service';
import { TrainingItem } from '../items/entities/item.entity';
import { ItemCompletion } from '../items/entities/item-completion.entity';
import { OpaqueTokenService } from 'src/auth/opaque-token.service';
import { TrainingParticipantRepresentationDto } from '../items/dto/training-participant-representation.dto';

@Injectable()
export class TrainingReminderTasks {
  private readonly logger = new Logger(TrainingReminderTasks.name);
  private trainingParticipantGroupId?: string;

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE_NAME) private readonly notificationsQueue: Queue,
    private readonly config: ConfigService,
    @InjectRepository(CourseEnrollment)
    private readonly enrollmentsRepo: Repository<CourseEnrollment>,
    @InjectRepository(ItemCompletion)
    private readonly completionsRepo: Repository<ItemCompletion>,
    private readonly keycloak: KeycloakAdminClientService,
    private readonly opaqueTokenService: OpaqueTokenService,
  ) {}

  async onModuleInit() {
    const parentRoleGroups = this.config.get<string>('keycloak.parentRoleGroupsGroupId');
    const group = await this.keycloak.findGroup({
      path: TRAINING_PARTICIPANT_ROLE_GROUP_PATH,
      ancestorId: parentRoleGroups,
    });
    this.trainingParticipantGroupId = group?.id;
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async handleReminders() {
    const today = dayjs().startOf('day');
    const enrollments = await this.enrollmentsRepo
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.organization', 'organization')
      .leftJoinAndSelect('enrollment.course', 'course')
      .leftJoinAndSelect('course.sections', 'section')
      .leftJoinAndSelect('section.items', 'sectionItem')
      .leftJoinAndSelect('sectionItem.item', 'item')
      .where('enrollment.startDate <= :today', { today: today.format('YYYY-MM-DD') })
      .andWhere('enrollment.endDate >= :today', { today: today.format('YYYY-MM-DD') })
      .getMany();

    for (const enrollment of enrollments) {
      for (const sectionItem of enrollment.course.sections) {
        const section: any = sectionItem as any;
        const item: TrainingItem = (sectionItem as any).item;
        const available = dayjs(section.availableOn ?? enrollment.startDate);
        const availableDate = available.isBefore(dayjs(enrollment.startDate))
          ? dayjs(enrollment.startDate)
          : available;
        const firstWeekday = this.firstWeekday(availableDate);
        const durationDays = section.duration?.days ?? 14;
        const periodEnd = availableDate.add(durationDays, 'day');
        const reminderDate = this.firstWeekday(
          availableDate.add(Math.min(14, durationDays / 2), 'day'),
        );

        if (today.isSame(firstWeekday, 'day')) {
          await this.sendTrainingEmails(enrollment.id, enrollment.organization.slug, item);
        }

        if (today.isSame(reminderDate, 'day')) {
          await this.sendReminderEmails(enrollment.id, enrollment.organization.slug, item);
        }
      }
    }
  }

  private firstWeekday(d: dayjs.Dayjs) {
    if (d.day() === 0) return d.add(1, 'day');
    if (d.day() === 6) return d.add(2, 'day');
    return d;
  }

  private async getTrainingParticipants(organizationSlug: string) {
    if (!this.trainingParticipantGroupId) {
      return [];
    }
    const users = await this.keycloak.findUsersByAttribute({
      filter: {
        AND: [
          { q: { key: 'organization', value: organizationSlug } },
          { groupQ: { key: 'id', groups: [this.trainingParticipantGroupId], op: 'all' } },
        ],
      },
      limit: 1000,
      offset: 0,
      order: 'firstName',
    });
    return users.results;
  }

  private buildTrainingLink(itemId: string, token: string) {
    const template =
      this.config.get<string>('general.appHost') +
      `/training/${itemId}?token=${encodeURIComponent(token)}`;
    return template;
  }

  private async sendTrainingEmails(
    enrollmentId: string,
    organizationSlug: string,
    item: TrainingItem,
  ) {
    const participants = await this.getTrainingParticipants(organizationSlug);
    for (const user of participants) {
      if (!user.id || !user.email) continue;
      const tokenValue: TrainingParticipantRepresentationDto = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        unitSlug: (user.attributes?.unit ?? [])[0] ?? '',
        organizationSlug,
        audiences: user.attributes?.audience ?? [],
        enrollmentId,
        trainingItemId: item.id,
      };
      const token = await this.opaqueTokenService.create(tokenValue, {
        valueClass: TrainingParticipantRepresentationDto,
        type: 'training',
      });
      await this.notificationsQueue.add(NotificationsJobNames.SendEmailNotification, {
        to: [user.email],
        templateName: this.config.get<string>('notifications.email.templates.trainingLink'),
        context: {
          firstName: tokenValue.firstName,
          trainingLink: this.buildTrainingLink(item.id, token.key),
          trainingTitle: item.metadata.title,
          trainingDescription: item.metadata.description,
          trainingThumbnailUrl: item.thumbnailUrl,
        },
      });
    }
  }

  private async sendReminderEmails(
    enrollmentId: string,
    organizationSlug: string,
    item: TrainingItem,
  ) {
    const participants = await this.getTrainingParticipants(organizationSlug);
    const completions = await this.completionsRepo.find({
      where: {
        enrollment: { id: enrollmentId },
        item: { id: item.id },
        completed: true,
      },
      select: ['userId'],
    });
    const completedIds = new Set(completions.map((c) => c.userId));
    for (const user of participants) {
      if (!user.id || !user.email) continue;
      if (completedIds.has(user.id)) continue;
      const tokenValue: TrainingParticipantRepresentationDto = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        unitSlug: (user.attributes?.unit ?? [])[0] ?? '',
        organizationSlug,
        audiences: user.attributes?.audience ?? [],
        enrollmentId,
        trainingItemId: item.id,
      };
      const token = await this.opaqueTokenService.create(tokenValue, {
        valueClass: TrainingParticipantRepresentationDto,
        type: 'training',
      });
      await this.notificationsQueue.add(NotificationsJobNames.SendEmailNotification, {
        to: [user.email],
        templateName: this.config.get<string>('notifications.email.templates.trainingReminder'),
        context: {
          firstName: tokenValue.firstName,
          trainingLink: this.buildTrainingLink(item.id, token.key),
          trainingTitle: item.metadata.title,
          trainingDescription: item.metadata.description,
          trainingThumbnailUrl: item.thumbnailUrl,
        },
      });
    }
  }
}
