import { Module } from '@nestjs/common';
import { TrainingAdminService } from './training-admin.service';
import { TrainingAdminController } from './training-admin.controller';
import { UsersModule } from 'src/users/users.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ItemsModule } from 'src/training/items/items.module';
import { UnitsModule } from 'src/organizations/units/units.module';

@Module({
  imports: [UsersModule, ItemsModule, NotificationsModule, UnitsModule],
  providers: [TrainingAdminService],
  controllers: [TrainingAdminController],
})
export class TrainingAdminModule {}
