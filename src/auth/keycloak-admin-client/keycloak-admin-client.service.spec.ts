import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakAdminClientService } from './keycloak-admin-client.service';

describe('KeycloakAdminClientService', () => {
  let service: KeycloakAdminClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KeycloakAdminClientService],
    }).compile();

    service = module.get<KeycloakAdminClientService>(
      KeycloakAdminClientService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
