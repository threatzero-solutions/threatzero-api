import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { KeycloakAdminClientService } from 'src/auth/keycloak-admin-client/keycloak-admin-client.service';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { CourseEnrollment } from 'src/organizations/organizations/entities/course-enrollment.entity';
import { TrainingVisibility } from 'src/training/common/training.types';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';
import { TrainingItem } from 'src/training/items/entities/item.entity';
import { TrainingReminderTasks } from 'src/training/reminders/training-reminder.tasks';
import { TrainingSectionItem } from 'src/training/sections/entities/section-item.entity';
import { TrainingSection } from 'src/training/sections/entities/section.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class AdminService {
  constructor(
    private readonly cls: ClsService<CommonClsStore>,
    private readonly dataSource: DataSource,
    private readonly trainingReminderTasks: TrainingReminderTasks,
    private readonly keycloakAdminService: KeycloakAdminClientService,
  ) {}

  async sendTestTrainingReminderEmail() {
    const user = this.cls.get('user');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.organizationSlug) {
      throw new UnauthorizedException('User is not set up properly');
    }

    const enrollment = await this.dataSource
      .createQueryBuilder(CourseEnrollment, 'enrollment')
      .leftJoinAndSelect('enrollment.organization', 'organization')
      .where('organization.slug = :organizationSlug', {
        organizationSlug: user.organizationSlug,
      })
      .andWhere('enrollment.visibility = :visibility', {
        visibility: TrainingVisibility.VISIBLE,
      })
      .getOneOrFail();

    const item = await this.dataSource
      .createQueryBuilder(TrainingItem, 'item')
      .leftJoinAndSelect(
        TrainingSectionItem,
        'sectionItem',
        'sectionItem.itemId = item.id',
      )
      .leftJoinAndSelect(
        TrainingSection,
        'section',
        'section.id = sectionItem.sectionId',
      )
      .leftJoinAndSelect(
        TrainingCourse,
        'course',
        'course.id = section.courseId',
      )
      .where('course.id = :courseId', {
        courseId: enrollment.courseId,
      })
      .getOneOrFail();

    const keycloakUser = await this.keycloakAdminService.client.users.findOne({
      id: user.id,
    });

    if (!keycloakUser) {
      throw new UnauthorizedException('User not found');
    }

    await this.trainingReminderTasks.sendReminderEmail({
      participant: { keycloakUser, opaqueToken: null },
      enrollmentId: enrollment.id,
      organization: enrollment.organization,
      items: [item],
      isInitialReminder: true,
    });
  }
}
