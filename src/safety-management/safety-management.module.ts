import { Module } from '@nestjs/common';
import { ThreatAssessmentsModule } from './threat-assessments/threat-assessments.module';
import { TipsModule } from './tips/tips.module';
import { POCFilesModule } from './poc-files/poc-files.module';
import { ViolentIncidentReportsModule } from './violent-incident-reports/violent-incident-reports.module';

@Module({
  imports: [ThreatAssessmentsModule, TipsModule, POCFilesModule, ViolentIncidentReportsModule],
})
export class SafetyManagementModule {}
