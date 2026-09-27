# Membership Ops

Membership Ops is a small, production-minded membership billing engineering sample. It makes one complete request easy to follow: UI action, validation, authentication, authorization, pricing, payment boundary, database transaction, response, errors, and request-correlated logging.

## Live Demo

[https://vgym.mcorucu.com](https://vgym.mcorucu.com)

The demo runs on Euronodes behind Cloudflare Proxy with Full (strict) TLS. This is the intentionally public, non-production member demo account:

- Member: `member@membership-ops.local` / `demo-member-password`

The payment scenarios are deterministic: `pm_demo_success` and `pm_demo_declined`.

## Reviewer Documentation

[docs.mcorucu.com/projects/membership-ops](https://docs.mcorucu.com/projects/membership-ops)

## Main Request

`POST /api/v1/memberships/:membershipId/renew`

Exact source trace:

| Stage | File and function |
| --- | --- |
| Request entry | `apps/api/src/memberships/memberships.controller.ts` - `MembershipsController.renewMembership` |
| Validation | `apps/api/src/memberships/dto/renew-membership.dto.ts` - `RenewMembershipDto`; `apps/api/src/main.ts` - global `ValidationPipe` |
| Authentication | `apps/api/src/auth/auth.service.ts` - `AuthService.login`; `apps/api/src/auth/guards/jwt-auth.guard.ts` - `JwtAuthGuard.canActivate` |
| Current user | `apps/api/src/auth/decorators/current-user.decorator.ts` - `CurrentUser` |
| Authorization and business logic | `apps/api/src/memberships/memberships.service.ts` - `MembershipsService.renewMembership` |
| Pricing | `apps/api/src/memberships/pricing/pricing.ts` - `calculateRenewalPrice` |
| Payment gateway | `apps/api/src/payments/payment-gateway.ts` - `PaymentGateway`; `apps/api/src/payments/fake-payment.gateway.ts` - `FakePaymentGateway.charge` |
| Transaction | `MembershipsService.renewMembership` - `this.prisma.$transaction` |
| Response | `MembershipsController.renewMembership` returning the service result |
| Error handling | `apps/api/src/common/filters/application-exception.filter.ts` - `ApplicationExceptionFilter.catch` |
| Logging and request ID | `apps/api/src/common/logging/request-logger.middleware.ts` - `requestLogger` |

## Architecture

This is a pnpm monorepo with a NestJS API, Next.js UI, Prisma, and PostgreSQL. `PaymentGateway` is a narrow replaceable boundary; the deterministic fake provider makes success and decline behavior testable. Production uses the isolated Compose project `vgym_membership_ops`, a private database network, and the existing Euronodes proxy edge network.

## Local Setup

Requirements: Node 22+, pnpm 11+, and Docker.

```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm --filter @membership-ops/api prisma:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`. The local API health endpoint is `http://localhost:3001/api/v1/health`.

## Tests

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` runs the API Jest suite. The most useful tests are the pricing, renewal service, authentication, JWT guard, and renewal DTO specs under `apps/api/src/`.

## Documentation

- [DESIGN.md](DESIGN.md) - visual system and accessibility
- [docs/TECHNICAL_HANDBOOK.md](docs/TECHNICAL_HANDBOOK.md) - long-form engineering guide
- [docs/DECISIONS.md](docs/DECISIONS.md) - ADR-style decisions
- [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) - honest scope boundaries
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - local and production deployment shape
- [docs/SECURITY.md](docs/SECURITY.md) - security review notes
- [docs/pdf/membership-ops-technical-handbook.pdf](docs/pdf/membership-ops-technical-handbook.pdf) - rendered handbook

## Known Limitations

The payment provider is fake, the JWT lifecycle is intentionally small, logs are minimal, the UI is a single workspace, and the seed contains one public member demo credential. Admin seed data requires a local-only `ADMIN_SEED_PASSWORD`. A real payment integration would need idempotency, durable payment state, provider webhooks, retries, reconciliation, and compensating actions because an external charge cannot join a PostgreSQL transaction.
