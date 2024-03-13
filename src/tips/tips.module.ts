import { Module } from '@nestjs/common';
import { TipsService } from './tips.service';
import { TipsController } from './tips.controller';
import { Tip } from './entities/tip.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsModule } from 'src/forms/forms.module';
import { SubmitTipListener } from './listeners/submit-tip.listener';
import { BullModule } from '@nestjs/bullmq';
import { NOTIFICATIONS_QUEUE_NAME } from 'src/common/constants/queue.constants';
import { LocationsModule } from 'src/organizations/locations/locations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tip]),
    BullModule.registerQueue({
      name: NOTIFICATIONS_QUEUE_NAME,
    }),
    FormsModule,
    LocationsModule,
  ],
  controllers: [TipsController],
  providers: [TipsService, SubmitTipListener],
  exports: [TypeOrmModule],
})
export class TipsModule {}
