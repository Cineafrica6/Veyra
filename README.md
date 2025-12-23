# Veyra Backend

Multi-tenant progress verification and leaderboard platform.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: Supabase (JWT verification)
- **Storage**: Cloudinary (proof uploads)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Supabase project
- Cloudinary account

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Fill in your credentials in .env
```

### Environment Variables

```env
PORT=3001
MONGODB_URI=mongodb+srv://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

**Important**: Get your `SUPABASE_JWT_SECRET` from:
Supabase Dashboard → Settings → API → JWT Secret

### Running

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

### Auth
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update profile

### Organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations` - List my organizations
- `GET /api/organizations/:id` - Get organization
- `PATCH /api/organizations/:id` - Update organization
- `GET /api/organizations/:id/members` - List members
- `POST /api/organizations/:id/members` - Add member
- `PATCH /api/organizations/:id/members/:userId` - Update role
- `DELETE /api/organizations/:id/members/:userId` - Remove member

### Tracks
- `POST /api/tracks/org/:orgId` - Create track
- `GET /api/tracks/org/:orgId` - List tracks
- `GET /api/tracks/:id` - Get track
- `PATCH /api/tracks/:id` - Update track
- `POST /api/tracks/join` - Join via invite code
- `POST /api/tracks/:id/regenerate-invite` - Regenerate invite
- `PATCH /api/tracks/:id/invite` - Toggle invites
- `GET /api/tracks/:id/members` - List track members

### Submissions
- `POST /api/submissions/track/:trackId` - Submit progress
- `GET /api/submissions/track/:trackId` - List submissions
- `GET /api/submissions/track/:trackId/pending` - Pending submissions
- `GET /api/submissions/:id` - Get submission
- `POST /api/submissions/:id/verify` - Verify submission

### Leaderboard
- `GET /api/leaderboard/track/:trackId` - Get leaderboard
- `GET /api/leaderboard/track/:trackId/my-rank` - Get my rank

### Upload
- `POST /api/upload/proof` - Upload proof file
- `DELETE /api/upload/:publicId` - Delete upload

## Architecture

```
src/
├── config/       # Database, Supabase, Cloudinary config
├── controllers/  # Request handlers
├── middleware/   # Auth, RBAC, error handling
├── models/       # Mongoose schemas
├── routes/       # Express routes
├── services/     # Business logic (week calc, leaderboard)
├── types/        # TypeScript interfaces
├── utils/        # Response helpers, errors, invite codes
└── app.ts        # Entry point
```
