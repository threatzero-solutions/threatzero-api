import { Module } from '@nestjs/common';
import { ThreatAssessmentsModule } from './threat-assessments/threat-assessments.module';
import { TipsModule } from './tips/tips.module';
import { POCFilesModule } from './poc-files/poc-files.module';
import { ViolentIncidentReportsModule } from './violent-incident-reports/violent-incident-reports.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafetyContact } from './common/entities/safety-contact.entity';
import { OrganizationPolicyFile } from './common/entities/organization-policy-file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SafetyContact, OrganizationPolicyFile]),
    ThreatAssessmentsModule,
    TipsModule,
    POCFilesModule,
    ViolentIncidentReportsModule,
  ],
})
export class SafetyManagementModule {}
