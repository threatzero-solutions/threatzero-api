import { Module } from '@nestjs/common';
import { TrainingModule } from 'src/training/training.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TrainingModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
