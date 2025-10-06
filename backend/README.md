## Ustbian Backend (NestJS)

Backend API for the Ustbian university social app. Stack: NestJS v11, TypeORM (PostgreSQL), Passport (Local + JWT), Socket.IO.

### Features implemented
- Auth: register, login (JWT), `GET /auth/me`
- Users: create, get by id, update
- Posts: list, create, get by id, update, delete
- Likes: like/unlike a post with realtime events
- Realtime: Socket.IO gateway emitting `post.like.added` and `post.like.removed`
- Health: `GET /health`

### Prerequisites
- Node.js LTS
- PostgreSQL running and accessible

### Environment
Create `.env` in `backend/`:

```
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ustbian
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=7d
```

### Install

```bash
npm install
```

### Run

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### API quickstart

1) Start the API: `npm run start:dev`
2) Register:
```
POST /auth/register
{ "email":"a@b.com","username":"alice","displayName":"Alice","password":"password123" }
```
3) Login and copy `access_token`:
```
POST /auth/login
{ "email":"a@b.com","password":"password123" }
```
4) Use Bearer token for protected routes (Posts, Likes)

### API testing (Swagger)
- Swagger UI is available at `http://localhost:3000/docs`.
- Use the Authorize button to paste your Bearer JWT.
- Try endpoints directly from the browser.

### WebSocket testing
- Connect a Socket.IO client to `ws://localhost:3000` and listen for:
  - `post.like.added` { postId, userId }
  - `post.like.removed` { postId, userId }

### Notes
- TypeORM is configured with `synchronize: false`. For local bootstrapping, either:
  - temporarily set `synchronize: true` to create tables, or
  - add and run migrations (recommended for shared environments).

