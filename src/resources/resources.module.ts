import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from './entities/resource.entity';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Resource]), MediaModule],
  controllers: [ResourcesController],
  providers: [ResourcesService],
})
export class ResourcesModule {}
