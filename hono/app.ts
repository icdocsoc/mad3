import auth from './auth/auth';
import { decodeToken } from './auth/jwt';
import factory from './factory';
import logger from './logger';

const app = factory
  .createApp()
  .use(logger())
  .use(decodeToken())
  .route('/auth', auth);

export default app;
