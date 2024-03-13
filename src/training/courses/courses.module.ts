import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Course]), MediaModule],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
