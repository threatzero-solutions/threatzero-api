import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { MediaModule } from 'src/media/media.module';
import { AuthModule } from 'src/auth/auth.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CourseEnrollment } from './entities/course-enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, CourseEnrollment]),
    MediaModule,
    AuthModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [TypeOrmModule, OrganizationsService],
})
export class OrganizationsModule {}
