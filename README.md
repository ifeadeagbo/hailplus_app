# Hailplus

A full-stack online store for a small UK business, live at **[www.hailplus.co.uk](https://www.hailplus.co.uk)**.

Customers browse products, fill a cart, pay by card and track their orders. The owner manages products, orders and users from an admin panel.

> The live site runs on free hosting, so the first visit can take about a minute to wake up. Payments are in Stripe test mode: use card `4242 4242 4242 4242` with any future expiry, any CVC and a UK postcode such as `AB10 1XG`.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 18, React Router 6, Tailwind CSS, Stripe Elements, React Hook Form |
| Backend | Node.js, Express, Sequelize, PostgreSQL |
| Payments and email | Stripe PaymentIntents and webhooks, Resend |
| Testing and CI | Jest, Supertest, GitHub Actions |
| Hosting | Render (web service), Supabase (PostgreSQL), Cloudflare (DNS) |

## Features

**Storefront**
- Product search, category filters, sorting and pagination, all driven by the URL
- Guest cart stored in the browser and merged into the account at sign-in
- Checkout with UK address validation, card payment and 3D Secure
- Order history, with self-service cancellation and automatic refund before dispatch
- Account pages: profile, password change, password reset by email, account deletion

**Admin panel**
- Sales dashboard
- Product management, including stock levels
- Order management: ship, deliver, or cancel with an automatic refund
- User management: search, deactivate and reactivate accounts

## Engineering highlights

**Payments and stock**
- Prices are calculated on the server in integer pence; the browser never decides what an order costs.
- Product rows are locked (`SELECT ... FOR UPDATE`) during checkout, so two customers can't buy the last item.
- Stripe requests carry idempotency keys, and order status changes are conditional updates, so a retried request or duplicate webhook can't charge or refund twice.
- Webhooks confirm payment even if the customer closes the tab, and unpaid orders release their stock after 30 minutes.

**Security**
- Sign-in uses a JWT in an `httpOnly`, `SameSite` cookie, with CSRF protection and session revocation on password change.
- Two-factor sign-in with authenticator apps (TOTP); secrets are encrypted with AES-256-GCM and backed by single-use recovery codes.
- New passwords are checked against known data breaches (Have I Been Pwned, using k-anonymity).
- Email confirmation and password reset tokens are single use and stored only as hashes.
- Rate limits on sign-in, sign-up, password reset and orders; input validation on every route; a Content Security Policy; Row Level Security on every table.

**Quality**
- 124 automated tests cover pricing, authentication, two-factor sign-in, the cart, checkout (including simultaneous purchases), webhooks, refunds and admin actions.
- CI runs the tests on every push, checks that database migrations roll back and re-apply, and builds the frontend with warnings treated as errors.
- The database schema is managed by versioned migrations; the server refuses to start if any are pending.

## Project structure

```
backend/server/     Express API: routes, controllers, models, migrations, tests
frontend/client/    React storefront and admin panel
render.yaml         Deployment configuration
.github/workflows/  CI pipeline
```

In production, one Express service serves both the API and the built React app from the same origin.

## Running it locally

You need Node 20+, PostgreSQL 15+ and a Stripe account in test mode.

```bash
# 1. Databases: one for the app, one for the tests
psql -d postgres -c "CREATE ROLE ecommerce_app LOGIN PASSWORD 'choose-a-password';"
psql -d postgres -c "CREATE DATABASE ecommerce_db OWNER ecommerce_app;"
psql -d postgres -c "CREATE DATABASE ecommerce_test OWNER ecommerce_app;"

# 2. Backend, on http://localhost:5050
cd backend/server
cp .env.example .env      # fill in the values; comments explain each one
npm install
npm run migrate
npm run seed              # optional: sample products and demo accounts
npm run dev

# 3. Frontend, on http://localhost:3000
cd frontend/client
cp .env.example .env      # add your Stripe publishable key
npm install
npm start
```

## Tests

```bash
cd backend/server
npm test
```

The tests run against the `ecommerce_test` database. Stripe and email are mocked, so no keys or network access are needed.

## Deployment

`render.yaml` defines the Render web service. Each deploy builds the frontend, applies database migrations, then starts the server. The database is hosted on Supabase and connected over TLS, and secrets are set as environment variables on Render, never committed.
