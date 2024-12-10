import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { CreateOrganizationUserDto } from './dto/create-organization-user.dto';
import { OrganizationUserQueryDto } from './dto/organization-user-query.dto';
import { OrganizationUserDto } from './dto/organization-user.dto';
import { UpdateOrganizationUserDto } from './dto/update-organization-user.dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations/organizations/:id/users')
@CheckPolicies(new EntityAbilityChecker(OrganizationUserDto))
export class UsersController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  getUsers(@Param('id') id: string, @Query() query: OrganizationUserQueryDto) {
    return this.organizationsService.getOrganizationUsers(id, query);
  }

  @Post()
  createUser(
    @Param('id') id: string,
    @Body() createOrganizationUserDto: CreateOrganizationUserDto,
  ) {
    return this.organizationsService.createOrganizationUser(
      id,
      createOrganizationUserDto,
    );
  }

  @Patch(':userId')
  updateUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() updateOrganizationUserDto: UpdateOrganizationUserDto,
  ) {
    return this.organizationsService.updateOrganizationUser(
      id,
      userId,
      updateOrganizationUserDto,
    );
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.organizationsService.deleteOrganizationUser(id, userId);
  }

  @Post(':userId/assign-role-group')
  @HttpCode(HttpStatus.NO_CONTENT)
  assignUserToGroup(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Query('groupId') groupId: string,
    @Query('groupPath') groupPath: string,
  ) {
    return this.organizationsService.assignUserToRoleGroup(
      id,
      userId,
      groupId,
      groupPath,
    );
  }

  @Post(':userId/revoke-role-group')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeUserToGroup(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Query('groupId') groupId: string,
    @Query('groupPath') groupPath: string,
  ) {
    return this.organizationsService.revokeUserFromRoleGroup(
      id,
      userId,
      groupId,
      groupPath,
    );
  }
}
