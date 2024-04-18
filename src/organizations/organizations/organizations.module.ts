import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Organization]), MediaModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [TypeOrmModule],
})
export class OrganizationsModule {}
