import { Module } from '@nestjs/common';
import { POCFilesService } from './poc-files.service';
import { POCFilesController } from './poc-files.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { POCFile } from './entities/poc-file.entity';
import { UnitsModule } from 'src/organizations/units/units.module';
import { TipsModule } from '../tips/tips.module';
import { ThreatAssessmentsModule } from '../threat-assessments/threat-assessments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([POCFile]),
    UnitsModule,
    TipsModule,
    ThreatAssessmentsModule,
  ],
  controllers: [POCFilesController],
  providers: [POCFilesService],
})
export class POCFilesModule {}
