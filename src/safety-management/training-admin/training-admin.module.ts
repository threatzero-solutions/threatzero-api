import { Module } from '@nestjs/common';
import { TrainingAdminService } from './training-admin.service';
import { TrainingAdminController } from './training-admin.controller';
import { UsersModule } from 'src/users/users.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ItemsModule } from 'src/training/items/items.module';
import { UnitsModule } from 'src/organizations/units/units.module';
import { CoursesModule } from 'src/training/courses/courses.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchStat } from './entities/watch-stat.entity';
import { OrganizationsModule } from 'src/organizations/organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WatchStat]),
    UsersModule,
    ItemsModule,
    CoursesModule,
    NotificationsModule,
    UnitsModule,
    OrganizationsModule,
  ],
  providers: [TrainingAdminService],
  controllers: [TrainingAdminController],
})
export class TrainingAdminModule {}
