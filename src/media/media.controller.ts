import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
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
  @HttpCode(202)
  async receiveVideoEvent(
    @Body() event: CreateVideoEventDto,
    @Req() request: Request,
  ) {
    await this.mediaService.receiveVideoEvent(event, request);
  }
}
