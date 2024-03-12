import { Module } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from './entities/section.entity';
import { SectionItem } from './entities/section-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Section, SectionItem])],
  controllers: [SectionsController],
  providers: [SectionsService],
})
export class SectionsModule {}
