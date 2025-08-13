import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import {
  NOTIFICATIONS_QUEUE_NAME,
  NOTIFICATIONS_QUEUE_PREFIX,
} from 'src/common/constants/queue.constants';
import { CourseEnrollment } from 'src/organizations/organizations/entities/course-enrollment.entity';
import { OrganizationsModule } from 'src/organizations/organizations/organizations.module';
import { AudiencesModule } from './audiences/audiences.module';
import { CoursesModule } from './courses/courses.module';
import { ItemCompletion } from './items/entities/item-completion.entity';
import { ItemsModule } from './items/items.module';
import { AudienceChangeListener } from './listeners/audience-change.listener';
import { TrainingReminderTasks } from './reminders/training-reminder.tasks';
import { SectionsModule } from './sections/sections.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFICATIONS_QUEUE_NAME,
      prefix: NOTIFICATIONS_QUEUE_PREFIX,
    }),
    TypeOrmModule.forFeature([CourseEnrollment, ItemCompletion]),
    CoursesModule,
    AudiencesModule,
    SectionsModule,
    ItemsModule,
    AuthModule,
    OrganizationsModule,
  ],
  providers: [AudienceChangeListener, TrainingReminderTasks],
})
export class TrainingModule {}
