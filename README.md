# OTP88

OTP88 sends one-time passcodes over **WhatsApp**, **SMS** and **Email** through a single REST endpoint, posts delivery updates to customer webhooks, and bills a prepaid balance per message. It ships with a marketing site, a developer console and an admin console.

- API reference: `/docs.html` (served by the app)
- Console: `/login`
- Backend: Node.js 20+, Express 4, MongoDB (Mongoose)
- Frontend: React 19 bundled with Vite into `public/dist/app.bundle.js`

## Quick start

```bash
npm install
cp .env.example .env        # fill in MONGODB_URI, JWT_SECRET, ADMIN_PASSWORD and provider keys
npm run build               # build the console bundle once
npm run dev                 # nodemon server + vite --watch, http://localhost:8884
```

Production:

```bash
NODE_ENV=production npm start
```

In production the server refuses to start if `JWT_SECRET`, `ADMIN_PASSWORD` or `MONGODB_URI` are missing or still set to development defaults.

## Environment variables

See `.env.example` for the full list. The important ones:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string. Without it, sign-in, API keys and billing are unavailable. |
| `JWT_SECRET` | Signs console session tokens. |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Administrator sign-in. The account is created on first boot with a hashed password. |
| `DLR_WEBHOOK_SECRET` | Optional. When set, Bulk360 and VerifyWay must append `?token=<value>` to their callback URLs. When empty, the delivery-report endpoints stay open as before. |
| `ALLOWED_ORIGINS` | Comma-separated browser origins allowed to call the API cross-origin. Same-origin and server-to-server calls are always allowed. |
| `RESEND_API_KEY`, `RESEND_DOMAIN_ID`, `EMAIL_FROM`, `EMAIL_SENDER_DOMAIN` | Email channel (Resend). |
| `SMS360_APP_KEY`, `SMS360_APP_SECRET`, `SMS360_SENDER_ID` | SMS channel (Bulk360). |
| `VERIFYWAY_API_KEY` | WhatsApp channel (VerifyWay). |

Provider credentials can also be entered in the admin console; values saved there take precedence over the environment.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Server with auto-restart plus a watching Vite build |
| `npm run build` | Production console bundle |
| `npm test` | Unit and HTTP tests (`node --test`), no database needed |
| `npm run normalize-phones` | One-off migration that rewrites stored phone numbers to `+` international format |

## Project layout

```
server.js                  Express app: security headers, CORS, JSON limits, routes
src/config/constants.js    Environment variables, supported channels, default rates
src/config/db.js           MongoDB connection and first-boot seeding
src/middleware/            auth (API keys + JWT), validate (request bodies), rateLimit
src/routes/                One file per API area; admin routes under routes/admin/
src/services/dispatchers/  One module per channel (sms, whatsapp, email) with a shared send() shape
src/services/              balance (atomic deduct/refund), webhooks, email templates, passwords
src/utils/format.js        Phone normalisation, date formatting
public/                    Marketing pages, docs, CSS, landing scripts
public/js/react-app/       Console (App.jsx, hooks/, views, api.js, routes.js)
test/                      node:test suites
```

## How a send works

1. `POST /v1/otp/send` authenticates the API key (or console token) and validates the body.
2. The price for the channel and destination is looked up and reserved from the account balance with an atomic conditional update.
3. The channel dispatcher calls the provider. On rejection the reservation is refunded, a `FAILED` log is written and the client receives HTTP 502.
4. On success a `SENT` log is written, an `otp.sent` webhook is queued, and the response returns `transactionId`, `otpCode` and the cost.
5. Provider delivery reports arrive at `/api/webhooks/sms360/dlr` and `/api/webhooks/whatsapp/dlr` (optionally protected by `DLR_WEBHOOK_SECRET`), update the log by message ID, and are forwarded to the customer's webhook.

There is no verify endpoint: the caller stores `otpCode` and compares it themselves.

## Deployment notes

- The Dockerfile builds the console bundle in a first stage and runs `node server.js` in a second stage.
- Behind a reverse proxy (Render, Nginx) the app trusts the first proxy hop so rate limits and IP logging use the real client address.
- Rotate any provider credential that was ever committed to the repository; they are no longer read from source.
