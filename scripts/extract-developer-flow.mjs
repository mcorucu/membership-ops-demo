import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'apps/web/public/developer-flow.json');

const snippets = [
  {
    id: 'request',
    title: 'Request received',
    label: 'HTTP boundary',
    path: 'apps/api/src/memberships/memberships.controller.ts',
    start: '  @Post(\':membershipId/renew\')',
    end: '  }',
    description: 'The controller owns the HTTP contract and delegates application work to the service.'
  },
  {
    id: 'validation',
    title: 'Input validated',
    label: 'DTO + pipe',
    path: 'apps/api/src/memberships/dto/renew-membership.dto.ts',
    start: 'export class RenewMembershipDto',
    end: '}',
    description: 'class-validator rejects unsupported months and payment methods before business logic runs.'
  },
  {
    id: 'authentication',
    title: 'User authenticated',
    label: 'JWT guard',
    path: 'apps/api/src/auth/guards/jwt-auth.guard.ts',
    start: '  canActivate',
    end: '  }',
    description: 'The guard verifies the bearer token and places the verified identity on the request.'
  },
  {
    id: 'authorization',
    title: 'Ownership authorized',
    label: 'Access rule',
    path: 'apps/api/src/memberships/memberships.service.ts',
    start: '    if (user.role === \'MEMBER\'',
    end: '    }',
    description: 'A member can renew only the membership belonging to the authenticated JWT subject.'
  },
  {
    id: 'business',
    title: 'Business rules applied',
    label: 'Orchestration',
    path: 'apps/api/src/memberships/memberships.service.ts',
    start: '  async renewMembership',
    end: '  }',
    description: 'The service checks membership state, calculates the renewal period, and coordinates payment plus persistence.'
  },
  {
    id: 'pricing',
    title: 'Price calculated',
    label: 'Pure domain function',
    path: 'apps/api/src/memberships/pricing/pricing.ts',
    start: 'export function calculateRenewalPrice',
    end: '}',
    description: 'Pricing is isolated from HTTP and Prisma so it is easy to reason about and unit test.'
  },
  {
    id: 'payment',
    title: 'Payment executed',
    label: 'External boundary',
    path: 'apps/api/src/payments/fake-payment.gateway.ts',
    start: '  async charge',
    end: '  }',
    description: 'The fake gateway makes success and decline deterministic without handling card data.'
  },
  {
    id: 'database',
    title: 'Transaction committed',
    label: 'Prisma transaction',
    path: 'apps/api/src/memberships/memberships.service.ts',
    start: 'await this.prisma.$transaction',
    end: '    );',
    description: 'Payment creation and membership expiration update commit together or roll back together.'
  },
  {
    id: 'response',
    title: 'Response returned',
    label: 'Response DTO',
    path: 'apps/api/src/memberships/memberships.controller.ts',
    start: '    return this.membershipsService.renewMembership',
    end: '    );',
    description: 'The controller returns a stable success payload with the updated membership and payment.'
  },
  {
    id: 'errors',
    title: 'Errors normalized',
    label: 'Global filter',
    path: 'apps/api/src/common/filters/application-exception.filter.ts',
    start: '  catch',
    end: '  }',
    description: 'Known domain failures retain their stable code; unexpected failures become a generic 500 response.'
  },
  {
    id: 'logging',
    title: 'Request correlated',
    label: 'Request logger',
    path: 'apps/api/src/common/logging/request-logger.middleware.ts',
    start: 'export function requestLogger',
    end: '}',
    description: 'Every request gets a correlation ID while secrets and sensitive bodies stay out of logs.'
  }
];

function extract(source, start, end) {
  const lines = source.split('\n');
  const startIndex = lines.findIndex((line) => line.includes(start));
  if (startIndex < 0) return ['Source marker not found.'];
  const endIndex = lines.findIndex((line, index) => index > startIndex && line.includes(end));
  const sliceEnd = endIndex >= 0 ? endIndex + 1 : Math.min(startIndex + 18, lines.length);
  return lines.slice(startIndex, sliceEnd).slice(0, 28);
}

const result = [];
for (const item of snippets) {
  const absolutePath = join(root, item.path);
  const source = await readFile(absolutePath, 'utf8');
  result.push({
    id: item.id,
    title: item.title,
    label: item.label,
    path: item.path,
    description: item.description,
    lines: extract(source, item.start, item.end)
  });
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ generatedFrom: 'real source files', generatedAt: new Date().toISOString(), stages: result }, null, 2)}\n`);
console.log(`Extracted ${result.length} developer-view snippets to ${relative(root, output)}`);
