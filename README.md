# NorzaMart

A full-stack e-commerce marketplace connecting local sellers with buyers in Norzagaray, Bulacan — built with the Next.js App Router and MongoDB.

**Status:** Core marketplace features (auth, product catalog, checkout, messaging) are complete. Online payment processing is intentionally deferred — the app currently supports cash-on-delivery / manual payment only.

## Features

- **Multi-role platform** — separate buyer, seller, and admin experiences on one codebase
- **Authentication** — credentials-based login via NextAuth.js, passwords hashed with bcrypt, JWT sessions
- **Product discovery** — search, category browsing, and location-aware sections (nearby sellers, trending in barangay, seller of the week)
- **Checkout** — multi-seller cart support: a single cart is split into per-seller orders, with stock decremented and coupon discounts distributed proportionally across sellers
- **Coupons** — expiry, usage-limit, minimum-spend, and max-discount validation
- **Buyer-seller chat** — real-time-style messaging stored in MongoDB, with per-conversation unread counts and read receipts
- **Reviews** — product ratings with like/unlike toggling
- **Seller dashboard** — product CRUD, order fulfillment, payout requests, analytics
- **Admin dashboard** — seller approval, product moderation, coupon and category management, payout review, announcements

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes
- **Database:** MongoDB Atlas, Mongoose
- **Auth:** NextAuth.js (Credentials provider, JWT sessions), bcryptjs
- **Media:** Cloudinary

## Getting Started

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your own values:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `NEXTAUTH_URL` | App URL, e.g. `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Random secret for NextAuth session encryption |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

Then run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Roadmap

- Real payment gateway integration (currently COD/manual payment only)
- Automated seller payouts (currently admin-approved internal records, not automatic fund transfers)
- Seller-facing analytics expansion
