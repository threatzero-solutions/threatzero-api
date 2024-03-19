import { Module } from '@nestjs/common';
import { CoursesModule } from './courses/courses.module';
import { AudiencesModule } from './audiences/audiences.module';
import { SectionsModule } from './sections/sections.module';
import { ItemsModule } from './items/items.module';
import { AudienceChangeListener } from './listeners/audience-change.listener';

@Module({
  imports: [CoursesModule, AudiencesModule, SectionsModule, ItemsModule],
  providers: [AudienceChangeListener],
})
export class TrainingModule {}
