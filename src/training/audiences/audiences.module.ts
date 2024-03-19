import { Module } from '@nestjs/common';
import { AudiencesService } from './audiences.service';
import { AudiencesController } from './audiences.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audience } from './entities/audience.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Audience])],
  controllers: [AudiencesController],
  providers: [AudiencesService],
  exports: [TypeOrmModule],
})
export class AudiencesModule {}
