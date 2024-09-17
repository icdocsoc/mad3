import { admin } from './admin/admin';
import auth from './auth/auth';
import { decodeToken } from './auth/jwt';
import factory from './factory';
import { family } from './family/family';
import logger from './logger';

const app = factory
  .createApp()
  .use(logger())
  .use(decodeToken())
  .route('/auth', auth)
  .route('/family', family)
  .route('/admin', admin);

export default app;
