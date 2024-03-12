import { Module } from '@nestjs/common';
import { CoursesModule } from './courses/courses.module';
import { AudiencesModule } from './audiences/audiences.module';
import { SectionsModule } from './sections/sections.module';
import { ItemsModule } from './items/items.module';

@Module({
  imports: [CoursesModule, AudiencesModule, SectionsModule, ItemsModule],
})
export class TrainingModule {}
