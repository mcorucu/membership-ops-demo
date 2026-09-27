const { PrismaClient, Role, MembershipStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('demo-member-password', 10);
  const adminSeedPassword = process.env.ADMIN_SEED_PASSWORD?.trim();
  const member = await prisma.user.upsert({
    where: { email: 'member@membership-ops.local' },
    update: { passwordHash, role: Role.MEMBER },
    create: { email: 'member@membership-ops.local', passwordHash, role: Role.MEMBER }
  });
  await prisma.membership.upsert({
    where: { userId: member.id },
    update: { plan: 'Performance', monthlyPriceCents: 4900, status: MembershipStatus.ACTIVE },
    create: {
      userId: member.id,
      plan: 'Performance',
      monthlyPriceCents: 4900,
      status: MembershipStatus.ACTIVE,
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21)
    }
  });
  if (adminSeedPassword) {
    const adminPasswordHash = await bcrypt.hash(adminSeedPassword, 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@membership-ops.local' },
      update: { passwordHash: adminPasswordHash, role: Role.ADMIN },
      create: { email: 'admin@membership-ops.local', passwordHash: adminPasswordHash, role: Role.ADMIN }
    });
    await prisma.membership.upsert({
      where: { userId: admin.id },
      update: { plan: 'Operations', monthlyPriceCents: 7900, status: MembershipStatus.ACTIVE },
      create: {
        userId: admin.id,
        plan: 'Operations',
        monthlyPriceCents: 7900,
        status: MembershipStatus.ACTIVE,
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45)
      }
    });
    console.log('Seeded demo member and configured admin account.');
  } else {
    console.log('Seeded demo member account. Admin seed skipped; set ADMIN_SEED_PASSWORD for local admin data.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
