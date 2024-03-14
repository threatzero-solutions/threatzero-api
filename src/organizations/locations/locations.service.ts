import { Injectable } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { ConfigService } from '@nestjs/config';
import { GenerateQrCodeQueryDto } from './dto/generate-qr-code-query.dto';
import { Response } from 'express';
import QRCode from 'qrcode';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

@Injectable()
export class LocationsService extends BaseEntityService<Location> {
  alias = 'location';

  constructor(
    @InjectRepository(Location)
    private locationsRepository: Repository<Location>,
    private readonly config: ConfigService,
  ) {
    super();
  }

  getRepository() {
    return this.locationsRepository;
  }

  getQb(query?: BaseQueryDto) {
    return super.getQb(query).leftJoinAndSelect('location.unit', 'unit');
  }

  async findUnitForLocationId(locationId: string) {
    const location = await this.getRepository().findOne({
      where: {
        locationId,
      },
      relations: {
        unit: true,
      },
    });
    return location?.unit;
  }

  generateQRCode(locationId: string, query: GenerateQrCodeQueryDto) {
    const tipUrl = `${this.config.get<string>('general.host')}/sos/?loc_id=${locationId}`;

    return (res: Response) => {
      res.setHeader('Content-Type', 'image/png');
      QRCode.toFileStream(res, tipUrl, {
        margin: query.margin,
        color: {
          dark: query.color_dark,
          light: query.color_light,
        },
      });
    };
  }
}
