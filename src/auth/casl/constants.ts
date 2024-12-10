export enum Action {
  Manage = 'manage',
  Read = 'read',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

export const LmsTokenSubject = 'lmsToken' as const;
export const LmsScormPackageSubject = 'lmsScormPackage' as const;
