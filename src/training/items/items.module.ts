import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CacheConfigService } from 'src/common/cache-config/cache-config.service';
import { MediaModule } from 'src/media/media.module';
import { OrganizationsModule } from 'src/organizations/organizations/organizations.module';
import { UnitsModule } from 'src/organizations/units/units.module';
import { UsersModule } from 'src/users/users.module';
import { ItemCompletion } from './entities/item-completion.entity';
import { TrainingItem } from './entities/item.entity';
import { Video } from './entities/video-item.entity';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainingItem, Video, ItemCompletion]),
    MediaModule,
    AuthModule,
    UnitsModule,
    OrganizationsModule,
    UsersModule,
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
