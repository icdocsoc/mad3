import { db } from './db';
import { meta } from './admin/schema';

db.insert(meta).values({
  id: 1,
  state: 'parents_open'
});
