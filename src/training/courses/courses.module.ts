import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingCourse } from './entities/course.entity';
import { MediaModule } from 'src/media/media.module';
import { OrganizationsModule } from 'src/organizations/organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainingCourse]),
    MediaModule,
    OrganizationsModule,
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
