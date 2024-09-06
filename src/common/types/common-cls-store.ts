import { ClsStore } from 'nestjs-cls';
import { StatelessUser } from 'src/auth/user.factory';

export interface CommonClsStore extends ClsStore {
  user?: StatelessUser;
  ip?: string;
}
