# Security notes

## Secrets and identity

`DATABASE_URL` and `JWT_SECRET` are environment-only. `.env` and `.env.*` are ignored, with `.env.example` explicitly allowed. The seed has demo passwords only for local or controlled demo use. Passwords are hashed with `bcrypt.hash` and checked with `bcrypt.compare`; password hashes are never selected into API responses.

The login failure is generic for unknown email and wrong password. `JwtAuthGuard` verifies the signature and expiry using the server-side secret. Controllers use `CurrentUser`, and the membership service compares the verified JWT subject to the membership owner. The client cannot choose identity by sending a user ID.

## Input and database safety

`ValidationPipe` uses `whitelist` and `forbidNonWhitelisted`. Renewal months and demo payment IDs are allow-listed. Prisma uses typed queries and parameterized client operations; the app does not concatenate request data into SQL.

Money is integer cents. `monthlyPriceCents`, payment amounts, and discount calculations never use floating-point currency values.

## Logging and errors

The request middleware accepts or generates a bounded correlation ID and returns it in `X-Request-Id`. Logs include method, route, status, duration, user ID when authenticated, and stable error code. They do not intentionally include request bodies, passwords, hashes, JWTs, authorization headers, database URLs, or credentials. The global filter returns stable client codes and hides unexpected internal details.

## Browser token choice

The demo web app stores its short-lived bearer token in `sessionStorage`, sends it only in the `Authorization` header, and uses same-origin API paths in production. This keeps the sample easy to follow, but it is not immune to a future XSS bug. A production product could instead use a secure, HttpOnly, SameSite cookie with CSRF protection, or an OIDC/BFF model. The choice should follow the actual frontend and identity architecture, not a generic rule.

## Deployment posture

Production uses `NODE_ENV=production`, built containers, a private PostgreSQL network, no public database port, controlled CORS, security response headers from Next, and the existing Euronodes Nginx TLS termination convention. Authenticated API responses are marked `no-store` and are not cached by the proxy. The origin certificate covers `vgym.mcorucu.com`; Cloudflare proxy mode and Full (strict) remain an external account-level configuration step.

## Review checklist

- [x] `.env` ignored and no production values committed
- [x] bcrypt hashing and generic invalid login response
- [x] JWT verification and server-side ownership authorization
- [x] no password/hash/token/header logging
- [x] DTO allow-list validation
- [x] Prisma typed queries, no unsafe raw SQL
- [x] integer cents for money
- [x] generic 500 response
- [x] Production DNS record, origin certificate, HTTP redirect, and origin HTTPS routing
- [ ] Cloudflare Proxy and Full (strict) mode, pending external account configuration
- [ ] Production rate limiting and full identity lifecycle, deliberately out of scope for this interview sample
