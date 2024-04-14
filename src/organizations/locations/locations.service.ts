import { Inject, Injectable, Scope } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { ConfigService } from '@nestjs/config';
import { GenerateQrCodeQueryDto } from './dto/generate-qr-code-query.dto';
import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { REQUEST } from '@nestjs/core';
import { getOrganizationLevel } from '../common/organizations.utils';
import { LEVEL } from 'src/auth/permissions';

@Injectable({ scope: Scope.REQUEST })
export class LocationsService extends BaseEntityService<Location> {
  alias = 'location';

  constructor(
    @InjectRepository(Location)
    private locationsRepository: Repository<Location>,
    @Inject(REQUEST) private request: Request,
    private readonly config: ConfigService,
  ) {
    super();
  }

  getRepository() {
    return this.locationsRepository;
  }

  getQb(query?: BaseQueryDto) {
    let qb = super.getQb(query).leftJoinAndSelect('location.unit', 'unit');

    switch (getOrganizationLevel(this.request)) {
      case LEVEL.ADMIN:
        return qb;
      case LEVEL.ORGANIZATION:
        return qb
          .leftJoinAndSelect('unit.organization', 'organization')
          .andWhere('organization.slug = :organizationSlug', {
            organizationSlug: this.request.user?.organizationSlug,
          });
      case LEVEL.UNIT:
        return qb.andWhere('unit.slug = :unitSlug', {
          unitSlug: this.request.user?.unitSlug,
        });
      default:
        return qb.where('1 = 0');
    }
  }

  async findUnitLocation(locationId: string) {
    const location = await this.getRepository().findOne({
      where: {
        locationId,
      },
      relations: {
        unit: true,
      },
    });
    return location;
  }

  generateQRCode(locationId: string, query: GenerateQrCodeQueryDto) {
    const tipUrl = `${this.config.get<string>('general.appHost')}/sos/?loc_id=${locationId}`;

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
