# Deployment

## Local

Local PostgreSQL runs in the root Compose file on `127.0.0.1:5433`, avoiding collision with an existing local PostgreSQL service. The API reads the example development URL. Apply the Prisma migration and seed before starting the API.

## Production shape

The Compose project identity is `vgym_membership_ops`. Its source directory is `/srv/vgym-membership-ops`. The stack contains:

- `vgym-membership-db`: PostgreSQL 16 with a dedicated database, user, generated password, and named persistent volume
- `vgym-membership-api`: NestJS production build, private to the Compose network and the shared proxy network
- `vgym-membership-web`: Next.js standalone production build, private to the Compose network and the shared proxy network

The database is never published on a host port. API and web join the existing external Docker network named `eskisehiraraba_prod_edge` only so the existing Nginx proxy can route to them. The database stays on a project-specific internal network. No unrelated Compose project, volume, image, or container is part of the deployment command.

## Existing Euronodes integration

The verified host is Euronodes SSH alias `marketplace-prod-01`. Its shared proxy is container `eskisehiraraba_proxy-proxy-1`, with configuration under `/srv/shared/reverse-proxy` and external network `eskisehiraraba_prod_edge`. The safe integration is a new server block for `vgym.mcorucu.com` pointing to the new web and API container names, followed by `nginx -t` and an in-place reload. The existing proxy is not replaced. The certificate is stored in the shared Let's Encrypt tree and is mounted read-only into the proxy.

Expected routing:

```text
Cloudflare DNS (proxied; Full (strict))
        |
        v
shared Nginx :80/:443
   /api/v1/* -> vgym-membership-api:3001
   /*     -> vgym-membership-web:3000
        |
        +-- private PostgreSQL network -> vgym-membership-db:5432
```

## Release checklist

1. Build and verify `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
2. Copy the source and production Compose file to an isolated host directory.
3. Generate `.env` on the server with a unique database password and JWT secret, mode `0600`.
4. Build and start only the `vgym_membership_ops` Compose project.
5. Wait for database health, run migrations, and seed only safe demo data.
6. Validate API health from the proxy network.
7. Add or verify the Nginx server block and certificate, run `nginx -t`, and reload the shared proxy.
8. Verify HTTPS, HTTP redirect, API routing, login, both renewal scenarios, and browser behavior.
9. Record the actual state in the final release report without printing secrets.

## Verified release state

The release is running on `marketplace-prod-01` in `/srv/vgym-membership-ops` with `vgym-membership-db`, `vgym-membership-api`, and `vgym-membership-web`. `vgym.mcorucu.com` is Cloudflare-proxied with Full (strict) TLS, HTTP redirects to HTTPS, the Let's Encrypt certificate covers the hostname, and the shared proxy serves the app and `/api/v1/health`. The deployment did not modify the Hetzner host or existing AutoCore/EskişehirAraba projects.

## Cloudflare

The `vgym` record is proxied through Cloudflare and SSL/TLS is Full (strict). Keep application authentication in the product; Cloudflare Access is not required. Use normal managed WAF protections and no caching for `/api/v1/*` or private application responses. Rate limiting for login should be enabled if the account plan and existing convention support it.
