import KeycloakUserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { DEFAULT_THUMBNAIL_URL } from 'src/common/constants/items.constants';
import { MediaService } from 'src/media/media.service';
import { OrganizationStatus } from 'src/organizations/organizations/entities/organization.entity';
import { UsersService } from 'src/users/users.service';
import { In, Repository } from 'typeorm';
import { KeycloakAdminClientService } from '../../auth/keycloak-admin-client/keycloak-admin-client.service';
import { OpaqueTokenService } from '../../auth/opaque-token.service';
import { NOTIFICATIONS_QUEUE_NAME } from '../../common/constants/queue.constants';
import { NotificationsJobNames } from '../../notifications/notifications.processor';
import { TRAINING_PARTICIPANT_ROLE_GROUP_PATH } from '../../organizations/organizations/constants';
import { CourseEnrollment } from '../../organizations/organizations/entities/course-enrollment.entity';
import { TrainingVisibility } from '../common/training.types';
import { TrainingParticipantRepresentationDto } from '../items/dto/training-participant-representation.dto';
import { ItemCompletion } from '../items/entities/item-completion.entity';
import { TrainingItem } from '../items/entities/item.entity';
import { Video } from '../items/entities/video-item.entity';

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
    private readonly mediaService: MediaService,
    private readonly users: UsersService,
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
    this.logger.log(
      `Starting daily training reminder check for ${today.format('YYYY-MM-DD')}`,
    );

    try {
      // Query only active enrollments with optimized date filtering
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
        .andWhere('enrollment.visibility = :visibility', {
          visibility: TrainingVisibility.VISIBLE,
        })
        .andWhere('organization.status = :status', {
          status: OrganizationStatus.ACTIVE,
        })
        .getMany();

      this.logger.log(
        `Found ${enrollments.length} active enrollments to process`,
      );

      let processedCount = 0;
      let errorCount = 0;

      for (const enrollment of enrollments) {
        try {
          // Null check for course sections
          if (
            !enrollment.course?.sections ||
            enrollment.course.sections.length === 0
          ) {
            this.logger.warn(
              `Enrollment ${enrollment.id} has no course sections, skipping`,
            );
            continue;
          }

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

            if (
              today.isSame(initialReminderDate, 'day') &&
              enrollment.organization.notificationSettings
                ?.initialReminderEmailsEnabled
            ) {
              this.logger.log(
                `Sending initial reminders for enrollment ${enrollment.id}, section ${section.id}`,
              );
              await this.sendInitialReminderEmails(
                enrollment.id,
                enrollment.organization.slug,
                section.items.map((item) => item.item),
              );
              processedCount++;
            }

            if (
              today.isSame(followupReminderDate, 'day') &&
              enrollment.organization.notificationSettings
                ?.followUpReminderEmailsEnabled
            ) {
              this.logger.log(
                `Sending follow-up reminders for enrollment ${enrollment.id}, section ${section.id}`,
              );
              await this.sendFollowupReminderEmails(
                enrollment.id,
                enrollment.organization.slug,
                section.items.map((item) => item.item),
              );
              processedCount++;
            }

            sectionStartDate = availableUntil;
          }
        } catch (enrollmentError) {
          this.logger.error(
            `Error processing enrollment ${enrollment.id}: ${enrollmentError.message}`,
            enrollmentError.stack,
          );
          errorCount++;
        }
      }

      this.logger.log(
        `Training reminder processing complete. Processed: ${processedCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Fatal error in training reminder task: ${error.message}`,
        error.stack,
      );
    }
  }

  private firstWeekday(d: dayjs.Dayjs) {
    if (d.day() === 0) return d.add(1, 'day');
    if (d.day() === 6) return d.add(2, 'day');
    return d;
  }

  private async *getTrainingParticipants(organizationSlug: string) {
    if (!this.trainingParticipantGroupId) {
      return;
    }

    for await (const user of this.users.getAllUsersGenerator({
      organizationSlug,
      keycloakGroupIds: [this.trainingParticipantGroupId],
    })) {
      yield user;
    }
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
    const participants = this.getTrainingParticipants(organizationSlug);

    let sentCount = 0;
    let participantCount = 0;

    for await (const user of participants) {
      participantCount++;
      try {
        await this.sendReminderEmail({
          user,
          enrollmentId,
          organizationSlug,
          items,
          isInitialReminder: true,
        });
        sentCount++;
      } catch (error) {
        this.logger.error(
          `Failed to send initial reminder to user ${user.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Sent ${sentCount}/${participantCount} initial reminder emails for enrollment ${enrollmentId}`,
    );
  }

  private async sendFollowupReminderEmails(
    enrollmentId: string,
    organizationSlug: string,
    items: TrainingItem[],
  ) {
    const completions = await this.completionsRepo.find({
      where: {
        enrollment: { id: enrollmentId },
        item: { id: In(items.map((item) => item.id)) },
        completed: true,
      },
      select: ['userId', 'item'],
      relations: ['item'],
    });
    const completedIds = new Set(
      completions.map((c) => c.userId + '+' + c.item.id),
    );

    let sentCount = 0;
    let skippedCount = 0;
    let participantCount = 0;

    for await (const user of this.getTrainingParticipants(organizationSlug)) {
      participantCount++;
      const incompleteItems = items.filter(
        (item) => !completedIds.has(user.id + '+' + item.id),
      );

      if (incompleteItems.length === 0) {
        skippedCount++;
        continue;
      }

      try {
        await this.sendReminderEmail({
          user,
          enrollmentId,
          organizationSlug,
          items: incompleteItems,
          isInitialReminder: false,
        });
        sentCount++;
      } catch (error) {
        this.logger.error(
          `Failed to send follow-up reminder to user ${user.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Sent ${sentCount}/${participantCount} follow-up reminder emails (${skippedCount} completed all items) for enrollment ${enrollmentId}`,
    );
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

        if (item instanceof Video) {
          item.loadThumbnailUrl((url) =>
            this.mediaService.getThumbnailUrlForVimeoUrl(url),
          );
        }

        return {
          trainingLink: this.buildTrainingLink(item.id, token.key),
          trainingTitle: item.metadata.title,
          trainingDescription: item.metadata.description,
          trainingThumbnailUrl: item.thumbnailUrl ?? DEFAULT_THUMBNAIL_URL,
        };
      }),
    );

    if (trainingContexts.length === 0) {
      this.logger.debug(
        `No training contexts to send for user ${userId}, skipping email`,
      );
      return;
    }

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
