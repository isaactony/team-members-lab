import { createDatabase } from '../db/client';
import { seedMembers } from '../db/seed';
import { createApp } from './server';

const port = Number(process.env.PORT ?? 3000);

const db = await createDatabase();
seedMembers(db);

createApp(db, { appUrl: process.env.APP_URL ?? `http://localhost:${port}` }).listen(port, () => {
  console.log(`Team members API running on http://localhost:${port}`);
  console.log('Try it with:');
  console.log(`  curl -H "x-member-id: mem_owner" http://localhost:${port}/api/members`);
  console.log(
    `  curl -X POST -H "x-member-id: mem_owner" -H "content-type: application/json" \\
    -d '{"email":"new@example.com","role":"member"}' http://localhost:${port}/api/invitations`,
  );
});
