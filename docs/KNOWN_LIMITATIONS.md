# Known limitations

This sample is deliberately candid about what it does not solve.

- The payment provider is fake. No card numbers, provider SDK, fraud checks, settlement, or real charge exists.
- The external payment call happens before the PostgreSQL transaction. A real provider cannot participate in the same database transaction. Production needs idempotency keys, durable provider state, asynchronous webhooks, retries, an outbox or equivalent, and compensating actions.
- JWT access tokens are short-lived but there is no refresh-token rotation or revocation list. The demo keeps the bearer token in browser `sessionStorage`.
- Membership states are only `ACTIVE`, `EXPIRED`, and `CANCELLED`; there is no pause, grace period, trial, proration, entitlement ledger, or plan catalog.
- Observability is intentionally minimal: structured JSON console logs, a request ID, and a health endpoint. There is no metrics backend, distributed tracing, alerting, or log retention policy in the sample.
- There is no fraud/risk logic, rate limiting middleware, account lockout, email verification, MFA, or password reset flow.
- The UI is one workspace and does not model multiple organizations, admin management screens, or a full subscription product catalog.
- The Developer View is a build-time source explorer, not an IDE. It is a teaching aid and does not replace opening real source files.
- Production DNS and TLS depend on the existing Cloudflare and Nginx setup. If DNS credentials are unavailable, deployment can be prepared but the public hostname cannot be truthfully marked live.
- The production seed contains safe demo credentials. A real deployment would remove demo credentials, use a controlled bootstrap, and rotate all secrets.

The correct production evolution is not to add every fashionable component. It is to add a durable payment state machine, idempotency, provider reconciliation, better identity lifecycle, durable observability, and operational controls when the product actually needs them.
