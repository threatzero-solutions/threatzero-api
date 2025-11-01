export type UnifiedUser =
  | {
      source: 'keycloak';
      id: string;
      idpId: string | undefined;
      email: string;
      firstName: string | undefined;
      lastName: string | undefined;
      name: string | undefined;
      picture: string | undefined;
      organizationSlug: string | undefined;
      unitSlug: string | undefined;
      audiences: string[] | undefined;
      canAccessTraining: boolean;
      enabled: boolean;
    }
  | {
      source: 'opaque_token';
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      name: string | undefined;
      organizationSlug: string | undefined;
      unitSlug: string | undefined;
      audiences: string[] | undefined;
      enrollmentId: string;
      trainingItemId: string;
      canAccessTraining: boolean;
    };
