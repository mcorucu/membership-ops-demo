# Decision log

## ADR-001: NestJS for the API

**Context:** The sample needs an explicit HTTP boundary, dependency injection, guards, pipes, and a structure that a reviewer can navigate quickly.

**Decision:** Use NestJS with small feature modules.

**Alternatives:** Express with handwritten composition; Fastify; a serverless handler.

**Trade-offs:** NestJS adds framework ceremony, but the ceremony makes validation, guards, filters, and test seams obvious during review.

## ADR-002: PostgreSQL and Prisma

**Context:** Membership, payment, and user data need relational constraints and an atomic write path.

**Decision:** Use PostgreSQL with Prisma migrations and a typed client.

**Alternatives:** SQLite for a simpler demo; an ORM-free SQL layer; a document database.

**Trade-offs:** PostgreSQL needs a local container, while the relational model and transaction semantics are closer to the production conversation.

## ADR-003: JWT authentication

**Context:** The frontend and API are separate processes and the sample needs an easy-to-follow authenticated request.

**Decision:** Login signs a short-lived JWT; `JwtAuthGuard` verifies it and `CurrentUser` exposes the verified subject.

**Alternatives:** Server sessions; OAuth/OIDC; a long-lived API key.

**Trade-offs:** JWT verification is stateless and simple, but revocation and refresh-token rotation are intentionally outside this sample.

## ADR-004: bcrypt password hashing

**Context:** Demo credentials must be stored as one-way hashes.

**Decision:** Hash with bcrypt at seed time and compare with bcrypt during login.

**Alternatives:** Argon2; plaintext demo passwords; framework-managed identity.

**Trade-offs:** Argon2 would be a credible production choice; bcrypt keeps the implementation conventional and easy to explain.

## ADR-005: FakePaymentGateway

**Context:** The request must show an external payment boundary without accepting card data or making real charges.

**Decision:** Depend on `PaymentGateway` and inject `FakePaymentGateway` with deterministic success and decline IDs.

**Alternatives:** Stripe test mode; a direct conditional in the service; no payment abstraction.

**Trade-offs:** It is not a payment integration, but it leaves a replaceable seam and deterministic tests.

## ADR-006: Monolithic service

**Context:** The domain is intentionally small and must remain understandable end to end.

**Decision:** Keep one NestJS application with feature modules.

**Alternatives:** Microservices; a separate payment service; event-driven orchestration.

**Trade-offs:** Fewer operational boundaries and less deployment complexity; future scale would require stronger isolation and asynchronous workflows.

## ADR-007: No Redis or Kafka

**Context:** The brief explicitly excludes infrastructure that does not materially improve this bounded flow.

**Decision:** Use PostgreSQL and in-process orchestration only.

**Alternatives:** Cache, queue, event bus.

**Trade-offs:** No distributed retry or cache layer is demonstrated. That is an explicit non-goal, not an omitted requirement.

## ADR-008: Next.js UI

**Context:** A reviewer needs a real product surface that calls the API and makes the request trace visible.

**Decision:** Use Next.js with a responsive single-workspace UI and same-origin production API paths.

**Alternatives:** Server-rendered templates; React without Next; a static HTML demo.

**Trade-offs:** Next adds a build/runtime layer, but gives a credible frontend boundary and simple deployment artifact.

## ADR-009: Developer View source extraction

**Context:** Manually duplicated snippets would drift from implementation.

**Decision:** `scripts/extract-developer-flow.mjs` reads marked ranges from real API files into `apps/web/public/developer-flow.json` during dev/build.

**Alternatives:** Hardcoded snippets; a runtime source-file endpoint; an IDE plugin.

**Trade-offs:** Marker extraction is intentionally lightweight and can fail if the source shape changes; it is transparent and reviewable.

## ADR-010: Environment configuration

**Context:** Database credentials and signing keys must not be tracked.

**Decision:** Read `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`, and ports from environment variables; provide only placeholders in `.env.example`.

**Alternatives:** Checked-in config; a secret manager only; compile-time public configuration.

**Trade-offs:** Local setup has one explicit environment step; deployment can inject secrets without changing code.

## ADR-011: Production deployment

**Context:** The verified Euronodes server (`marketplace-prod-01`) already has a shared Nginx proxy and other Docker Compose projects.

**Decision:** Deploy an isolated Compose project named `vgym_membership_ops`, from `/srv/vgym-membership-ops`, joining only the existing `eskisehiraraba_prod_edge` network for proxy routing and keeping PostgreSQL on a private project network. Integrate through the existing shared proxy with a scoped vhost and graceful reload.

**Alternatives:** Host ports; a second reverse proxy; reuse of the existing database.

**Trade-offs:** The shared proxy remains a coordination point, but the app, database, credentials, volume, and containers are isolated.
