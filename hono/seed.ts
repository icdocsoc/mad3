import { db } from './db';
import { meta } from './admin/schema';

await db.insert(meta).values({
  id: 1,
  state: 'parents_open'
});
