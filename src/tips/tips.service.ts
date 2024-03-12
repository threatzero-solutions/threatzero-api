import { Injectable } from '@nestjs/common';
import { CreateTipDto } from './dto/create-tip.dto';
import { UpdateTipDto } from './dto/update-tip.dto';
import { BaseEntityService } from 'src/common/base-entity.service';
import { Tip } from './entities/tip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TipsService extends BaseEntityService<Tip> {
  constructor(@InjectRepository(Tip) private tipsRepository: Repository<Tip>) {
    super();
  }

  getRepository() {
    return this.tipsRepository;
  }
}
