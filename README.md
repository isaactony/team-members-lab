# Team members lab

A small team members app built to test AI code review on a large pull request.

It has an Express API, a SQLite database that runs in memory through sql.js, and a few React components rendered on the server in tests. There is no real login. The acting member is passed in the `x-member-id` header.

## Run it

```bash
npm install
npm run dev
curl -H "x-member-id: mem_owner" http://localhost:3000/api/members
```

### Invite a teammate

Owners and admins can invite people by email. In development the email is printed to the console instead of being sent.

```bash
curl -X POST http://localhost:3000/api/invitations \
  -H "x-member-id: mem_owner" -H "content-type: application/json" \
  -d '{"email":"new@example.com","role":"member"}'
```

Copy the token from the link in the console, then accept the invitation.

```bash
curl -X POST http://localhost:3000/api/invitations/accept \
  -H "content-type: application/json" \
  -d '{"token":"<token>","name":"New Person"}'
```

Invitations expire after 7 days and can be resent up to 3 times. Each resend issues a new link and turns off the old one.

## Check it

```bash
npm run check
```

That runs the TypeScript compiler and the test suite, which is the same thing CI runs on every pull request.

## Layout

| Folder | What lives there |
| --- | --- |
| `db/` | Database client, migration runner, SQL migrations and seed data |
| `lib/` | Domain logic, permissions, invitations, email, formatting, validation, auth and errors |
| `api/` | Express routes and the app factory |
| `ui/` | React components |
| `tests/` | Vitest suites |
