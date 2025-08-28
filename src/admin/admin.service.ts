import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { KeycloakAdminClientService } from 'src/auth/keycloak-admin-client/keycloak-admin-client.service';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { CourseEnrollment } from 'src/organizations/organizations/entities/course-enrollment.entity';
import { TrainingItem } from 'src/training/items/entities/item.entity';
import { TrainingReminderTasks } from 'src/training/reminders/training-reminder.tasks';
import { DataSource } from 'typeorm';
import { SendTestTrainingReminderEmailDto } from './dto/send-test-training-reminder-email.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly cls: ClsService<CommonClsStore>,
    private readonly dataSource: DataSource,
    private readonly trainingReminderTasks: TrainingReminderTasks,
    private readonly keycloakAdminService: KeycloakAdminClientService,
  ) {}

  async sendTestTrainingReminderEmail(dto: SendTestTrainingReminderEmailDto) {
    const { email, enrollmentId, itemId } = dto;

    const enrollment = await this.dataSource
      .createQueryBuilder(CourseEnrollment, 'enrollment')
      .leftJoinAndSelect('enrollment.organization', 'organization')
      .where('enrollment.id = :enrollmentId', {
        enrollmentId,
      })
      .getOneOrFail();

    const item = await this.dataSource
      .createQueryBuilder(TrainingItem, 'item')
      .where('item.id = :itemId', {
        itemId,
      })
      .getOneOrFail();

    const keycloakUser = await this.keycloakAdminService.client.users
      .find({
        email,
      })
      .then((users) => users.at(0));

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
