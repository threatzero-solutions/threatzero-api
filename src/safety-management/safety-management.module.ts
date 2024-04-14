import { Module } from '@nestjs/common';
import { ThreatAssessmentsModule } from './threat-assessments/threat-assessments.module';
import { TipsModule } from './tips/tips.module';
import { POCFilesModule } from './poc-files/poc-files.module';

@Module({
  imports: [ThreatAssessmentsModule, TipsModule, POCFilesModule],
})
export class SafetyManagementModule {}
