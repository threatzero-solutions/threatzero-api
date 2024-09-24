export const ALLOWED_DEFAULT_ROLE_GROUPS = ['Training Participant'] as const;
export type AllowedDefaultRoleGroups =
  (typeof ALLOWED_DEFAULT_ROLE_GROUPS)[number];

// IMPORTANT: These attributes should never conflict with system attributes, such
// as 'unit', 'organization', 'audience', etc.
export const ALLOWED_IMPORTED_ATTRIBUTES = [
  'firstName',
  'lastName',
  'email',
  'picture',
  // For Google.
  'organizationUnitPath',
  // Others.
  'location',
  'title',
  'jobTitle',
  'school',
] as const;

export type AllowedImportedAttribute =
  (typeof ALLOWED_IMPORTED_ATTRIBUTES)[number];
