import { Module } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingSection } from './entities/section.entity';
import { SectionItem } from './entities/section-item.entity';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainingSection, SectionItem]),
    MediaModule,
  ],
  controllers: [SectionsController],
  providers: [SectionsService],
})
export class SectionsModule {}
