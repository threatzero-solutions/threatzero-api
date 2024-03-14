import { Module } from '@nestjs/common';
import { OrganizationsModule as OrganizationsEntityModule } from './organizations/organizations.module';
import { UnitsModule } from './units/units.module';
import { LocationsModule } from './locations/locations.module';
import { OrganizationChangeListener } from './listeners/organization-change.listener';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    OrganizationsEntityModule,
    UnitsModule,
    LocationsModule,
    AuthModule,
  ],
  providers: [OrganizationChangeListener],
})
export class OrganizationsModule {}
