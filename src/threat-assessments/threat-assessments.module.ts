import { Module } from '@nestjs/common';
import { ThreatAssessmentsService } from './threat-assessments.service';
import { ThreatAssessmentsController } from './threat-assessments.controller';
import { ThreatAssessment } from './entities/threat-assessment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsModule } from 'src/forms/forms.module';

@Module({
  imports: [TypeOrmModule.forFeature([ThreatAssessment]), FormsModule],
  controllers: [ThreatAssessmentsController],
  providers: [ThreatAssessmentsService],
})
export class ThreatAssessmentsModule {}
