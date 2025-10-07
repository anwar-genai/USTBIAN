## Ustbian Backend (NestJS)

Backend API for the Ustbian university social app. Stack: NestJS v11, TypeORM (PostgreSQL), Passport (Local + JWT), Socket.IO.

### Features implemented
- **Auth**: register, login (JWT), `GET /auth/me`
- **Users**: create, get by id, update profile
- **Posts**: list, create, get by id, update, delete (with author authorization)
- **Likes**: like/unlike posts with realtime Socket.IO events
- **Follows**: follow/unfollow users, get followers/following lists
- **Notifications**: create, list, mark as read (individual or all), realtime delivery
- **Realtime**: Socket.IO gateway for:
  - `post.like.added` / `post.like.removed`
  - `notification.{userId}` for user-specific notifications
- **Health**: `GET /health`
- **Swagger docs**: available at `/docs` with full API documentation

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

### WebSocket (realtime) testing
- Connect a Socket.IO client to `ws://localhost:3000` and listen for:
  - `post.like.added` { postId, userId }
  - `post.like.removed` { postId, userId }
  - `notification.{userId}` for user-specific notification events

### Notes
- TypeORM is configured with `synchronize: false`. For local bootstrapping, either:
  - temporarily set `synchronize: true` to create tables, or
  - add and run migrations (recommended for shared environments).

