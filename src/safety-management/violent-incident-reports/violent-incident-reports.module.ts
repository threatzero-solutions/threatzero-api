import { Module } from '@nestjs/common';
import { ViolentIncidentReportsService } from './violent-incident-reports.service';
import { ViolentIncidentReportsController } from './violent-incident-reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViolentIncidentReport } from './entities/violent-incident-report.entity';
import { FormsModule } from 'src/forms/forms/forms.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ViolentIncidentReport]),
    FormsModule,
    UsersModule,
  ],
  controllers: [ViolentIncidentReportsController],
  providers: [ViolentIncidentReportsService],
})
export class ViolentIncidentReportsModule {}
