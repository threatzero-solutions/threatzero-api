import { Module } from '@nestjs/common';
import { ResourcesModule } from './resources/resources.module';
import { MediaService } from './media.service';

@Module({
  imports: [ResourcesModule],
  providers: [MediaService]
})
export class MediaModule {}
