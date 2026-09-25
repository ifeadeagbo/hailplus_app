# E-commerce Store

A full-stack store: React storefront and admin panel, Express + PostgreSQL API, Stripe card payments.

```
backend/server/    Express API (Sequelize, Stripe, Passport)
frontend/client/   React app (Create React App, Tailwind, Stripe Elements)
```

## Local setup

**Requirements:** Node 20+, PostgreSQL 15+ (e.g. [Postgres.app](https://postgresapp.com)), a Stripe account in test mode.

### 1. Database

Create a database user and two databases: one for the app, one for the automated tests (tests wipe it).

```bash
psql -d postgres -c "CREATE ROLE ecommerce_app LOGIN PASSWORD 'choose-a-password';"
psql -d postgres -c "CREATE DATABASE ecommerce_db OWNER ecommerce_app;"
psql -d postgres -c "CREATE DATABASE ecommerce_test OWNER ecommerce_app;"
```

### 2. Backend

```bash
cd backend/server
cp .env.example .env        # then fill in the values (comments explain each one)
npm install
npm run migrate             # create/update tables
npm run seed                # optional: sample products + admin@example.com (wipes local data)
npm run dev                 # http://localhost:5050
```

### 3. Frontend

```bash
cd frontend/client
cp .env.example .env        # add your Stripe publishable key (pk_test_...)
npm install
npm start                   # http://localhost:3000
```

Test cards: `4242 4242 4242 4242` (succeeds), `4000 0027 6000 3184` (asks for bank verification), `4000 0000 0000 0002` (declined). Any future expiry and any CVC.

### 4. Stripe webhooks (local)

Orders are confirmed by the browser right after payment, but webhooks are the safety net for customers who close the tab mid-payment. To receive them locally:

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:5050/api/webhooks/stripe
```

Copy the `whsec_...` secret it prints into `STRIPE_WEBHOOK_SECRET` in `backend/server/.env` and restart the backend.

## Tests

```bash
cd backend/server
npm test
```

Runs against the `ecommerce_test` database (override with `TEST_DB_NAME`; the name must contain "test"). Stripe and email are mocked, so no keys or network are needed. CI runs the same suite plus a strict frontend build on every push (`.github/workflows/ci.yml`).

## Database migrations

The schema is managed by migrations in `backend/server/db/migrations` (never by `sequelize.sync`). The server refuses to start while migrations are pending.

```bash
npm run migrate          # apply pending migrations
npm run migrate:status   # list applied / pending
npm run migrate:undo     # roll back the latest one
```

To change the schema, add a new file named `YYYYMMDDHHMMSS-description.js` exporting `up(queryInterface, Sequelize)` and `down(...)`, and update the matching model.

## Deploying

Both apps ship with a Dockerfile. Any host that runs containers or Node apps works (Render, Railway, Fly.io, AWS, ...), with a managed PostgreSQL database.

**Backend**
1. Set every variable from `.env.example` in the host's settings, with `NODE_ENV=production`, live Stripe keys, strong random `JWT_SECRET`/`SESSION_SECRET` (`openssl rand -hex 48`) and `CLIENT_URL` set to the storefront's URL.
2. Set `TRUST_PROXY=1` when the host puts a load balancer in front of the app (almost all do).
3. Run `npm run migrate` as the release step before new instances start.
4. Point the host's health check at `GET /health`.
5. In the Stripe Dashboard, add a webhook endpoint `https://<api-domain>/api/webhooks/stripe` for `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled` and `charge.refunded`, and set its signing secret as `STRIPE_WEBHOOK_SECRET`.

**Frontend**
Build with `REACT_APP_API_URL` and `REACT_APP_STRIPE_PUBLIC_KEY` (they are baked into the bundle) and serve the `build/` folder from a static host or the included nginx image. Unknown paths must fall back to `index.html`.

**Serve both from the same site** (e.g. `yourshop.com` and `api.yourshop.com`) over HTTPS. The login cookie is `SameSite=Lax`, so the API and storefront must share a registrable domain.

## Before launch

- [ ] Fill in `frontend/client/src/config/store.js` (store name, business name, address, support email, jurisdiction, social links).
- [ ] Replace every `[PLACEHOLDER]` in `frontend/client/src/pages/legal/` and have the Privacy Policy, Terms and Returns policy reviewed for your business and country.
- [ ] Set `STORE_NAME` and `SUPPORT_EMAIL` in the backend environment (used in emails) and configure a real SMTP provider.
- [ ] Replace the hard-coded discount codes in `backend/server/utils/pricing.js` with your real ones.
- [ ] Prices are in GBP with no VAT (the business is not VAT registered). If you register for VAT, set `TAX_RATE` in `pricing.js` and `taxRatePercent` in `store.js`, and show VAT-inclusive prices. Review the £10 / free-over-£100 shipping in the same two files.
- [ ] Register with the ICO (UK data protection fee) before collecting customer data: https://ico.org.uk/for-organisations/data-protection-fee/
- [ ] Switch Stripe to live keys and register the production webhook (see Deploying).
- [ ] Create a real admin account and remove the seeded demo users.
- [ ] If you add analytics or marketing scripts, add a cookie consent banner and list them on the Cookie Policy page.

## Operations

- **Logs:** one JSON line per event on stdout in production, including every request with its `X-Request-Id`. Set `LOG_LEVEL` to adjust.
- **Abandoned checkouts:** unpaid orders release their reserved stock after 30 minutes (checked every 5 minutes).
- **Shutdown:** on `SIGTERM` the server finishes in-flight requests, then closes the database pool.
