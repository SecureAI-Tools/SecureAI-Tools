// Standalone script to seed database.
// This does not use prisma's seeding mechanism because nanoid doesn't work with it (runs into common-js ESM import issue[1]).
//
// [1]: https://github.com/ai/nanoid/issues/365

import { hash } from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

// TODO: Use Id library instead to keep id generation consistent!
const IDS = {
  userId: nanoid(),
  orgId: nanoid(),
  orgMembershipId: nanoid(),
}

async function main() {
  await prisma.$transaction(async (tx) => {
    // TODO: Use service layer instead to keep creation consistent!
    const createdUser = await tx.user.create({
      data: {
        id: IDS.userId,
        email: 'bruce@wayne-enterprises.com',
        firstName: 'Bruce',
        lastName: 'Wayne',
        passwordHash: await hash('SecureAIToolsFTW!', 12),
        forcePasswordReset: true,
      },
    });

    const createdOrg = await tx.organization.create({
      data: {
        id: IDS.orgId,
        name: 'Wayne Enterprises',
        slug: '-',
        defaultModel: 'mistral',
      },
    });

    const createdOrgMembership = await tx.orgMembership.create({
      data: {
        id: IDS.orgMembershipId,
        role: 'ADMIN',
        status: 'ACTIVE',
        userId: IDS.userId,
        orgId: IDS.orgId,
      },
    });
  });

  console.log("DB seeded successfully 🎉")
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  });
