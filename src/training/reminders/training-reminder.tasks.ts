import KeycloakUserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { KeycloakAdminClientService } from 'src/auth/keycloak-admin-client/keycloak-admin-client.service';
import { OpaqueTokenService } from 'src/auth/opaque-token.service';
import { NOTIFICATIONS_QUEUE_NAME } from 'src/common/constants/queue.constants';
import { NotificationsJobNames } from 'src/notifications/notifications.processor';
import { TRAINING_PARTICIPANT_ROLE_GROUP_PATH } from 'src/organizations/organizations/constants';
import { CourseEnrollment } from 'src/organizations/organizations/entities/course-enrollment.entity';
import { In, Repository } from 'typeorm';
import { TrainingParticipantRepresentationDto } from '../items/dto/training-participant-representation.dto';
import { ItemCompletion } from '../items/entities/item-completion.entity';
import { TrainingItem } from '../items/entities/item.entity';

dayjs.extend(duration);

@Injectable()
export class TrainingReminderTasks {
  private readonly logger = new Logger(TrainingReminderTasks.name);
  private trainingParticipantGroupId?: string;

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE_NAME)
    private readonly notificationsQueue: Queue,
    private readonly config: ConfigService,
    @InjectRepository(CourseEnrollment)
    private readonly enrollmentsRepo: Repository<CourseEnrollment>,
    @InjectRepository(ItemCompletion)
    private readonly completionsRepo: Repository<ItemCompletion>,
    private readonly keycloak: KeycloakAdminClientService,
    private readonly opaqueTokenService: OpaqueTokenService,
  ) {}

  async onModuleInit() {
    const parentRoleGroups = this.config.get<string>(
      'keycloak.parentRoleGroupsGroupId',
    );
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
      .where('enrollment.startDate <= :today', {
        today: today.format('YYYY-MM-DD'),
      })
      .andWhere('enrollment.endDate >= :today', {
        today: today.format('YYYY-MM-DD'),
      })
      .getMany();

    for (const enrollment of enrollments) {
      let sectionStartDate = dayjs(enrollment.startDate);
      for (const section of enrollment.course.sections
        .slice()
        .sort((a, b) => a.order - b.order)) {
        const availableOn = sectionStartDate;
        const availableUntil = sectionStartDate.add(
          dayjs.duration(section.duration),
        );

        const initialReminderDate = this.firstWeekday(availableOn);
        const followupReminderDate = this.firstWeekday(
          availableOn.add(
            Math.min(14, availableUntil.diff(availableOn, 'day') / 2),
            'day',
          ),
        );

        if (today.isSame(initialReminderDate, 'day')) {
          await this.sendInitialReminderEmails(
            enrollment.id,
            enrollment.organization.slug,
            section.items.map((item) => item.item),
          );
        }

        if (today.isSame(followupReminderDate, 'day')) {
          await this.sendFollowupReminderEmails(
            enrollment.id,
            enrollment.organization.slug,
            section.items.map((item) => item.item),
          );
        }

        sectionStartDate = availableUntil;
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
          {
            groupQ: {
              key: 'id',
              groups: [this.trainingParticipantGroupId],
              op: 'all',
            },
          },
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
      `/watch-training/${itemId}?watchId=${encodeURIComponent(token)}`;
    return template;
  }

  private async sendInitialReminderEmails(
    enrollmentId: string,
    organizationSlug: string,
    items: TrainingItem[],
  ) {
    const participants = await this.getTrainingParticipants(organizationSlug);
    for (const user of participants) {
      await this.sendReminderEmail({
        user,
        enrollmentId,
        organizationSlug,
        items,
        isInitialReminder: true,
      });
    }
  }

  private async sendFollowupReminderEmails(
    enrollmentId: string,
    organizationSlug: string,
    items: TrainingItem[],
  ) {
    const participants = await this.getTrainingParticipants(organizationSlug);
    const completions = await this.completionsRepo.find({
      where: {
        enrollment: { id: enrollmentId },
        item: { id: In(items.map((item) => item.id)) },
        completed: true,
      },
      select: ['userId', 'item'],
    });
    const completedIds = new Set(
      completions.map((c) => c.userId + '+' + c.item.id),
    );
    for (const user of participants) {
      const incompleteItems = items.filter(
        (item) => !completedIds.has(user.id + '+' + item.id),
      );

      await this.sendReminderEmail({
        user,
        enrollmentId,
        organizationSlug,
        items: incompleteItems,
        isInitialReminder: false,
      });
    }
  }

  private async sendReminderEmail({
    user,
    enrollmentId,
    organizationSlug,
    items,
    isInitialReminder,
  }: {
    user: KeycloakUserRepresentation;
    enrollmentId: string;
    organizationSlug: string;
    items: TrainingItem[];
    isInitialReminder: boolean;
  }) {
    if (!user.id || !user.email) return;
    const userId = user.id;
    const email = user.email;

    const trainingContexts = await Promise.all(
      items.map(async (item) => {
        const tokenValue: TrainingParticipantRepresentationDto = {
          userId,
          email,
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

        return {
          trainingLink: this.buildTrainingLink(item.id, token.key),
          trainingTitle: item.metadata.title,
          trainingDescription: item.metadata.description,
          trainingThumbnailUrl: item.thumbnailUrl ?? '',
        };
      }),
    );

    if (trainingContexts.length === 0) return;

    await this.notificationsQueue.add(
      NotificationsJobNames.SendEmailNotification,
      {
        to: [email],
        templateName: this.config.get<string>(
          'notifications.email.templates.trainingReminder',
        ),
        context: {
          firstName: user.firstName ?? '',
          trainingContexts,
          plural: trainingContexts.length !== 1,
          isInitialReminder,
        },
      },
    );
  }
}
