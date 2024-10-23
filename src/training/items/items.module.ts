import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingItem } from './entities/item.entity';
import { Video } from './entities/video-item.entity';
import { MediaModule } from 'src/media/media.module';
import { AuthModule } from 'src/auth/auth.module';
import { ItemCompletion } from './entities/item-completion.entity';
import { UnitsModule } from 'src/organizations/units/units.module';
import { OrganizationsModule } from 'src/organizations/organizations/organizations.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainingItem, Video, ItemCompletion]),
    MediaModule,
    AuthModule,
    UnitsModule,
    OrganizationsModule,
    UsersModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
