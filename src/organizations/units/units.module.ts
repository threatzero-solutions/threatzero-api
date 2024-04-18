import { Module } from '@nestjs/common';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';
import { Unit } from './entities/unit.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Unit]), MediaModule],
  controllers: [UnitsController],
  providers: [UnitsService],
  exports: [TypeOrmModule, UnitsService],
})
export class UnitsModule {}
