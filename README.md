# Blog

A full-stack blogging platform built with React, Express, and PostgreSQL. It allows users to create accounts, write and publish blog posts, read posts from other users, and interact through comments.

The platform includes a public-facing blog website and a separate writing dashboard. It supports JWT-based authentication, role-based access control, post management, and comment moderation.

## Demo

The screenshots below show the public blog, the authoring dashboard, and the post discussion experience.

### Public blog

Readers can browse published stories, see the author and comment count, and use the navigation to write or manage their account.

![Public blog homepage with published stories and account navigation](docs/screenshots/blog-home.png)

### Writing dashboard

Signed-in authors can create and edit posts, save drafts, publish posts, and delete their own work from the dashboard.

![Writing dashboard showing a draft post editor and publishing controls](docs/screenshots/blog-editor.png)

### Story and comments

Readers can open a story and view its comments. Signed-in users can add comments, while post owners can moderate comments on their own posts.

![Published story page with its comment section](docs/screenshots/blog-comments.png)

## Project layout

| Path | Purpose |
| --- | --- |
| `src/` | Express routes, controllers, authentication, validation, and data access |
| `prisma/schema.prisma` | PostgreSQL data model |
| `prisma/migrations/` | Versioned database migrations; keep these in source control |
| `blog-client/` | Public React/Vite site for viewing posts and comments |
| `blog-admin/` | React/Vite dashboard for writing posts |
| `generated/prisma/` | Generated Prisma client; created locally or during deployment and ignored by Git |

## Requirements

- Node.js 22.12 or later
- Express
- PostgreSQL
- npm
- prisma

## Local setup

### 1. Configure the API

Create a `.env` file 

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/blog_db?schema=public
JWT_SECRET=replace-with-a-long-random-secret
SESSION_SECRET=replace-with-another-long-random-secret
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
ADMIN_ORIGIN=http://localhost:5174
```

Create an empty PostgreSQL database named `blog_db`, or change `DATABASE_URL` to your database.

### 2. Install packages and set up Prisma

Run these commands from the repository root:

```sh
npm ci
npm ci --prefix blog-client
npm ci --prefix blog-admin
npm run prisma:generate
npm run db:deploy
```
### 3. Configure both Vite apps

The repository contains local `.env` files for both frontends. If you need to create them, copy the matching example files:

```sh
cp blog-client/.env.example blog-client/.env
cp blog-admin/.env.example blog-admin/.env
```

`blog-client/.env`:

```dotenv
VITE_API_URL=http://localhost:3000
VITE_ADMIN_URL=http://localhost:5174
```

`blog-admin/.env`:

```dotenv
VITE_API_URL=http://localhost:3000
VITE_CLIENT_URL=http://localhost:5173
```

### 4. Start the three apps

Open three terminals in the repository root.

**Terminal 1 — API**

```sh
npm run dev
```

The API runs at `http://localhost:3000`.

**Terminal 2 — public site**

```sh
cd blog-client
npm run dev
```

Open `http://localhost:5173`.

**Terminal 3 — writing dashboard**

```sh
cd blog-admin
npm run dev
```

Open `http://localhost:5174`, or open it with **Write** on the public site. The public app passes the active login to the dashboard using an origin-checked `postMessage` handshake. The dashboard still asks for login when opened directly.

### 5. Create an account and publish a post

1. Select **Sign Up** on the public site. Usernames must be 1–10 letters or numbers. Passwords must be at least 8 characters and contain an uppercase letter and a number.
2. Sign-up creates the account and signs the new user in. Open a published story to read comments or add one.
3. Select **Write** to open the dashboard without signing in again. Create a post and publish it to make it visible on the public site.

Regular users can see and manage their own posts and moderate comments on their posts. They can read and comment on other users' published posts. Users with the `ADMIN` role can manage all posts. New accounts have the `USER` role by default.

## API routes

The API prefix is `/api`.

| Method and route | Access | Behavior |
| --- | --- | --- |
| `POST /api/users` | Public | Register an account |
| `POST /api/auth/login` | Public | Sign in and receive a one-day JWT |
| `POST /api/auth/logout` | Public | Confirm client-side sign-out |
| `GET /api/posts` | Public | List published posts |
| `GET /api/posts/:id` | Public / owner / admin | Read a published post; drafts are visible only to their owner or an admin |
| `GET /api/posts/:postId/comments` | Public / owner / admin | Read comments on published posts; draft comments are private to the owner or admin |
| `GET /api/posts/admin/all` | Signed in | List the user's own posts, or all posts for `ADMIN` |
| `POST /api/posts` | Signed in | Create a draft attributed to the current user |
| `PUT /api/posts/:id` | Owner / admin | Edit or publish/unpublish a post |
| `DELETE /api/posts/:id` | Owner / admin | Delete a post and its comments |
| `POST /api/posts/:postId/comments` | Signed in | Comment on a published post; authors/admins can also comment on their drafts |
| `PUT /api/posts/:postId/comments/:commentId` | Post owner / admin | Edit a comment on the owned post |
| `DELETE /api/posts/:postId/comments/:commentId` | Post owner / admin | Delete a comment on the owned post |

Protected requests use `Authorization: Bearer <token>`. Post and comment authors are assigned from the authenticated user, not from an `authorId` supplied by the browser.
