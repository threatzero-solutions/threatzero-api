import { Module } from '@nestjs/common';
import { CoursesModule } from './courses/courses.module';
import { AudiencesModule } from './audiences/audiences.module';
import { SectionsModule } from './sections/sections.module';
import { ItemsModule } from './items/items.module';
import { AudienceChangeListener } from './listeners/audience-change.listener';
import { AuthModule } from 'src/auth/auth.module';
import { TrainingReminderTasks } from './reminders/training-reminder.tasks';
import { OrganizationsModule } from 'src/organizations/organizations/organizations.module';

@Module({
  imports: [
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
