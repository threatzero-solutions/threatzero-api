import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingItem } from './entities/item.entity';
import { Video } from './entities/video-item.entity';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingItem, Video]), MediaModule],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
