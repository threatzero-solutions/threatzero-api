import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingItem } from './entities/item.entity';
import { VideoItem } from './entities/video-item.entity';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingItem, VideoItem]), MediaModule],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
