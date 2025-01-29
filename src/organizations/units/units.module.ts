import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AwsModule } from 'src/aws/aws.module';
import { MediaModule } from 'src/media/media.module';
import { Unit } from './entities/unit.entity';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';

@Module({
  imports: [TypeOrmModule.forFeature([Unit]), MediaModule, AwsModule],
  controllers: [UnitsController],
  providers: [UnitsService],
  exports: [TypeOrmModule, UnitsService],
})
export class UnitsModule {}
