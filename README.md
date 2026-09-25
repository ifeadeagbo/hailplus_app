# Hailplus

The online store for **Hailplus**, based in Aberdeen, Scotland. Customers browse and buy with card payments through Stripe; the owner manages products and orders in an admin panel.

- **Storefront:** home page, shop with search and categories, product pages, guest cart, checkout with UK addresses, order history, account and password reset pages, policy pages.
- **Admin:** dashboard, products, orders (ship, deliver, cancel with automatic refund), users.
- **UK setup:** prices and payments in GBP, UK postcode validation, no VAT charged (the business is not VAT registered), policies written for UK consumer law.

```
backend/server/     Express API: Sequelize + PostgreSQL, Stripe, Passport
frontend/client/    React storefront: Create React App, Tailwind CSS, Stripe Elements
render.yaml         Render deployment (web service; database on Supabase)
.github/workflows/  CI: backend tests and a strict frontend build on every push
```

## Running it locally

**You need:** Node 20+, PostgreSQL 15+ ([Postgres.app](https://postgresapp.com) on a Mac), and a Stripe account in test mode.

### 1. Database

Create a user and two databases: one for the app, one for the automated tests (the tests wipe it).

```bash
psql -d postgres -c "CREATE ROLE ecommerce_app LOGIN PASSWORD 'choose-a-password';"
psql -d postgres -c "CREATE DATABASE ecommerce_db OWNER ecommerce_app;"
psql -d postgres -c "CREATE DATABASE ecommerce_test OWNER ecommerce_app;"
```

Add `-p <port>` if your PostgreSQL isn't on the default port 5432 (this project's Mac setup uses Postgres.app on **5433**).

### 2. Backend (API on port 5050)

```bash
cd backend/server
cp .env.example .env        # fill in the values; comments explain each one
npm install
npm run migrate             # create or update the tables
npm run seed                # optional: sample products and demo accounts (wipes local data)
npm run dev                 # http://localhost:5050
```

Port 5050 is used because macOS's AirPlay Receiver takes port 5000.

Demo accounts after `npm run seed` (local only, never in production):
- Admin: `admin@example.com` / `admin123456`
- Customers: `john@example.com`, `jane@example.com` / `password123`

### 3. Frontend (storefront on port 3000)

```bash
cd frontend/client
cp .env.example .env        # add your Stripe publishable key (pk_test_...)
npm install
npm start                   # http://localhost:3000
```

**Test payments:** card `4242 4242 4242 4242` succeeds, `4000 0027 6000 3184` asks for bank verification, `4000 0000 0000 0002` is declined. Use any future expiry, any CVC and a UK postcode such as `AB10 1XG`.

### 4. Stripe webhooks (optional locally)

The browser confirms each order right after payment. Webhooks are the safety net for customers who close the tab mid-payment. To receive them locally, install the [Stripe CLI](https://docs.stripe.com/stripe-cli) (`brew install stripe/stripe-cli/stripe`, or download it from that page), then:

```bash
stripe login
stripe listen --forward-to localhost:5050/api/webhooks/stripe
```

Put the `whsec_...` secret it prints into `STRIPE_WEBHOOK_SECRET` in `backend/server/.env` and restart the backend.

## Customising the store

| What | Where |
|---|---|
| Store name, business name, address, support email, social links, categories, home page images | `frontend/client/src/config/store.js` |
| Store name and support email in emails | `STORE_NAME`, `SUPPORT_EMAIL` in the backend environment |
| Currency, VAT rate, shipping cost and free-shipping threshold, discount codes | `backend/server/utils/pricing.js` (and the matching FAQ numbers in `store.js`) |
| Colours, fonts, corner style | `frontend/client/tailwind.config.js` and `frontend/client/src/index.css` |
| Logo | `frontend/client/src/components/common/Logo.js` and `logoMark.js`; browser tab icon in `frontend/client/public/favicon.svg` |
| Home page wording | `frontend/client/src/pages/HomePage.js` |
| Policy pages (privacy, terms, cookies, returns, FAQ) | `frontend/client/src/pages/legal/` |

The logo's arc mark comes from `frontend/client/src/assets/hailplus-logo-traced.svg`. That file was traced from a photo, so its lettering is tilted and cut off and isn't used; the site uses the Comfortaa font for "hailplus". With the designer's original logo file (SVG, AI, EPS or PDF), both can be replaced exactly.

## Tests

```bash
cd backend/server
npm test
```

90 tests covering pricing, sign-in and security, the guest cart, checkout (stock locking, simultaneous purchases, payments, refunds, abandoned checkouts), Stripe webhooks, admin actions and input validation. They run against `ecommerce_test` (override with `TEST_DB_NAME`; the name must contain "test"). Stripe and email are mocked, so no keys or network are needed.

CI (`.github/workflows/ci.yml`) runs the same tests on every push, checks that migrations roll back and re-apply, and builds the storefront in strict mode (lint warnings fail the build).

## Database

The schema is managed by migrations in `backend/server/db/migrations`, never by `sequelize.sync`. The server refuses to start while migrations are pending.

```bash
npm run migrate          # apply pending migrations
npm run migrate:status   # list applied and pending
npm run migrate:undo     # roll back the latest one
npm run bootstrap        # first-run setup (see below); safe to repeat
```

- **Adding a migration:** create `YYYYMMDDHHMMSS-description.js` exporting `up(queryInterface, Sequelize)` and `down(...)`, and update the matching model.
- **Row Level Security** is on for every table. It stops Supabase's public Data API from touching store data; the app connects as the tables' owner and is unaffected.
- **Bootstrap** creates the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (12+ characters with a letter and a number) if there is no admin yet, and adds the sample products if the store is empty (`SAMPLE_PRODUCTS=false` to skip). It never deletes anything. `npm run seed` does wipe data and refuses to run in production.

## Deploying to Render with Supabase

In production one service serves both the API and the storefront from the same address. This is required: the login cookie is `SameSite=Lax`, and separate `*.onrender.com` subdomains count as different sites.

**1. Supabase (database)**
1. Create a project at https://supabase.com in the **London (eu-west-2)** region. Save the database password.
2. **Connect** (top of the dashboard) → **Session pooler**: note the host (e.g. `aws-0-eu-west-2.pooler.supabase.com`) and user (e.g. `postgres.abcdefghijklmnop`). Use the pooler, because Supabase's direct connection is IPv6-only.
3. **Project Settings → Database → SSL Configuration → Download certificate**, and open the file in a text editor.

**2. Render (web service)**
1. Sign up at https://render.com with GitHub, then **New → Blueprint** and pick this repository.
2. Fill in the values it asks for:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_SSL_CA` (the certificate text) from Supabase
   - `REACT_APP_STRIPE_PUBLIC_KEY` and `STRIPE_SECRET_KEY` (Stripe **test** keys to start)
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD`
   - leave `STRIPE_WEBHOOK_SECRET` blank for now
3. **Apply.** Each deploy builds the storefront, runs migrations and bootstrap, then starts the server. The health check is `GET /health`.

**3. Stripe webhook**

In the Stripe Dashboard, add a webhook endpoint `https://<your-service>.onrender.com/api/webhooks/stripe` for `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled` and `charge.refunded`. Paste its signing secret into `STRIPE_WEBHOOK_SECRET` on Render.

**Free plan limits:** the Render service sleeps after 15 minutes without visitors (the next visit takes about a minute), and a free Supabase project pauses after a week without activity (restore it from the Supabase dashboard).

**Going live with real payments:** activate the Stripe account, replace both Stripe keys with live ones (`pk_live_...`, `sk_live_...`), and create the webhook again in live mode. Keep test keys in local `.env` files, and never commit a live key.

## Deploying elsewhere

Any host that runs Node works, with a managed PostgreSQL database.

- **Settings:** set every variable from `backend/server/.env.example`, with `NODE_ENV=production`, strong random `JWT_SECRET` / `SESSION_SECRET` (`openssl rand -hex 48`), `CLIENT_URL` set to the site's public URL, and `TRUST_PROXY=1` behind a load balancer.
- **Build:** build the storefront with `REACT_APP_API_URL=/api`, `INLINE_RUNTIME_CHUNK=false` (required by the Content Security Policy) and `REACT_APP_STRIPE_PUBLIC_KEY`. In production the backend serves `frontend/client/build` automatically (or set `CLIENT_BUILD_DIR`).
- **Deploy:** run `npm run migrate` and `npm run bootstrap` before starting new instances.

`backend/server/Dockerfile` and `frontend/client/Dockerfile` (nginx) are also included for serving the two separately. They haven't been built yet. When separate, the storefront and API must share a registrable domain (e.g. `hailplus.co.uk` and `api.hailplus.co.uk`) for the login cookie to work.

## Before launch

**Done:**
- [x] Store name, address, UK currency, postcodes and consumer-law wording
- [x] Support email: hailplusinc@gmail.com (site, policy pages and emails)
- [x] Admin account created on first deploy from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (demo accounts never exist in production)

**To do:**
- [ ] Gmail app password for hailplusinc@gmail.com in `EMAIL_PASS` (local `.env` and Render). Until then, order and password emails are not sent. Gmail allows about 500 emails a day; move to a provider such as Resend with your own domain as the store grows.
- [ ] Replace every `[PLACEHOLDER]` in `frontend/client/src/pages/legal/`, then have the Privacy Policy, Terms and Returns policy reviewed.
- [ ] Decide shipping prices (currently £10, free over £100) and replace the demo discount codes (`WELCOME10`, `SAVE20`, `FREESHIP`, `FLAT50`) in `pricing.js`.
- [ ] Register with the ICO (UK data protection fee): https://ico.org.uk/for-organisations/data-protection-fee/
- [ ] Switch Stripe to live keys and register the live webhook.
- [ ] Upgrade from free hosting before real trading, and consider the domain `hailplus.co.uk` (available at the time of writing).
- [ ] Keep the GitHub repository private.
- [ ] If the business registers as a company, set `legalName` in `store.js` (e.g. "Hailplus Ltd"). If it registers for VAT, set the VAT rate in `pricing.js` and `store.js` and show VAT-inclusive prices.
- [ ] Before adding analytics or marketing scripts, add a cookie consent banner and list them on the Cookie Policy page.

## Operations

- **Logs:** one JSON line per event on stdout in production, including every request with its `X-Request-Id`. Set `LOG_LEVEL` to adjust, or `DB_LOGGING=true` to print SQL.
- **Abandoned checkouts:** unpaid orders release their reserved stock after 30 minutes (checked every 5 minutes).
- **Security:** sign-in uses an httpOnly cookie. Changing or resetting a password signs out other devices. Sign-in and password reset are rate limited, and a Content Security Policy only allows Stripe, Google Fonts, Font Awesome and HTTPS images.
- **Shutdown:** on `SIGTERM` the server finishes in-flight requests, then closes the database connections.
