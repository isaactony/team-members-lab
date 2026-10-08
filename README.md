# Team members lab

A small team members app built to test AI code review on a large pull request.

It has an Express API, a SQLite database that runs in memory through sql.js, and a few React components rendered on the server in tests. There is no real login. The acting member is passed in the `x-member-id` header.

## Run it

```bash
npm install
npm run dev
curl -H "x-member-id: mem_owner" http://localhost:3000/api/members
```

## Check it

```bash
npm run check
```

That runs the TypeScript compiler and the test suite, which is the same thing CI runs on every pull request.

## Layout

| Folder | What lives there |
| --- | --- |
| `db/` | Database client, migration runner, SQL migrations and seed data |
| `lib/` | Domain logic, validation, auth and errors |
| `api/` | Express routes and the app factory |
| `ui/` | React components |
| `utils/` | Formatting helpers |
| `tests/` | Vitest suites |
