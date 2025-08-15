export interface UnifiedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  organizationSlug?: string;
  unitSlug?: string;
  audiences?: string[];
  source: 'keycloak' | 'opaque_token';
  enrollmentId?: string;
  trainingItemId?: string;
}
