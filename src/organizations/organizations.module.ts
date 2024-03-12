import { Module } from '@nestjs/common';
import { OrganizationsModule as OrganizationsEntityModule } from './organizations/organizations.module';
import { UnitsModule } from './units/units.module';
import { LocationsModule } from './locations/locations.module';

@Module({
  imports: [OrganizationsEntityModule, UnitsModule, LocationsModule],
})
export class OrganizationsModule {}
