const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const total = await p.member.count();
  const male = await p.member.count({ where: { OR: [{ gender: 'L' }, { gender: 'l' }] } });
  const female = await p.member.count({ where: { OR: [{ gender: 'P' }, { gender: 'p' }] } });
  const other = total - male - female;

  console.log('Total Members:', total);
  console.log('Male (L/l):', male);
  console.log('Female (P/p):', female);
  console.log('Not classified (other/null):', other);
}

main().finally(() => p.$disconnect());
