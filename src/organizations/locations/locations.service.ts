import { Injectable } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';

// TODO: Add tip QR code generator for location

@Injectable()
export class LocationsService extends BaseEntityService<Location> {
  constructor(
    @InjectRepository(Location)
    private locationsRepository: Repository<Location>,
  ) {
    super();
  }

  getRepository() {
    return this.locationsRepository;
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
}
