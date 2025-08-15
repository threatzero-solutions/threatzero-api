import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { AuthModule } from 'src/auth/auth.module';
import { AwsModule } from 'src/aws/aws.module';
import { CacheConfigService } from 'src/common/cache-config/cache-config.service';
import { MediaModule } from 'src/media/media.module';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { CourseEnrollment } from './entities/course-enrollment.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, CourseEnrollment]),
    MediaModule,
    AuthModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
    AwsModule,
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
  ],
  controllers: [
    OrganizationsController,
    EnrollmentsController,
    UsersController,
  ],
  providers: [OrganizationsService, EnrollmentsService],
  exports: [TypeOrmModule, OrganizationsService, EnrollmentsService],
})
export class OrganizationsModule {}
