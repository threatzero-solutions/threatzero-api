import { Body, Controller, Post, Req } from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateVideoEventDto } from './dto/create-video-event.dto';
import { Request } from 'express';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { Action } from 'src/auth/casl/actions';
import { VideoEvent } from './entities/video-event.entity';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('video/events')
  @CheckPolicies((ability) => ability.can(Action.Create, VideoEvent))
  async receiveVideoEvent(
    @Body() event: CreateVideoEventDto,
    @Req() request: Request,
  ) {
    return this.mediaService.receiveVideoEvent(event, request);
  }
}
