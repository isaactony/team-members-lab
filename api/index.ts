import { createDatabase } from '../db/client';
import { seedMembers } from '../db/seed';
import { createApp } from './server';

const port = Number(process.env.PORT ?? 3000);

const db = await createDatabase();
seedMembers(db);

createApp(db).listen(port, () => {
  console.log(`Team members API running on http://localhost:${port}`);
  console.log('Try it with:');
  console.log(`  curl -H "x-member-id: mem_owner" http://localhost:${port}/api/members`);
});
