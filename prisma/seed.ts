import "dotenv/config";
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const users = [
    { username: 'admin', password: 'adminpassword', role: 'DPC', name: 'DPC Hanura TPI' },
    { username: 'pac_barat', password: 'pacbaratpassword', role: 'PAC_BARAT', name: 'PAC Tanjungpinang Barat' },
    { username: 'pac_kota', password: 'packotapassword', role: 'PAC_KOTA', name: 'PAC Tanjungpinang Kota' },
    { username: 'pac_timur', password: 'pactimurpassword', role: 'PAC_TIMUR', name: 'PAC Tanjungpinang Timur' },
    { username: 'pac_bukit_bestari', password: 'pacbukitpassword', role: 'PAC_BUKIT_BESTARI', name: 'PAC Bukit Bestari' },
  ]

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10)
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        password: hashedPassword,
        role: user.role,
        name: user.name,
      },
    })
  }
  
  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
