import { Body, Controller, Post, Request } from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateVideoEventDto } from './dto/create-video-event.dto';
import { Request as ExpRequest } from 'express';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('video/events')
  async receiveVideoEvent(
    @Body() event: CreateVideoEventDto,
    @Request() request: ExpRequest,
  ) {
    return this.mediaService.receiveVideoEvent(event, request);
  }
}
