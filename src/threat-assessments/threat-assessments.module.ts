import { Module } from '@nestjs/common';
import { ThreatAssessmentsService } from './threat-assessments.service';
import { ThreatAssessmentsController } from './threat-assessments.controller';
import { ThreatAssessment } from './entities/threat-assessment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ThreatAssessment])],
  controllers: [ThreatAssessmentsController],
  providers: [ThreatAssessmentsService],
})
export class ThreatAssessmentsModule {}
