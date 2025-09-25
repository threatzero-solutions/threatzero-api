export interface UnifiedUser {
  id: string;
  idpId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  picture?: string;
  organizationSlug?: string;
  unitSlug?: string;
  audiences?: string[];
  source: 'keycloak' | 'opaque_token';
  enrollmentId?: string;
  trainingItemId?: string;
  canAccessTraining: boolean;
}
