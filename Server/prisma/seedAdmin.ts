import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcrypt'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env')
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { adminProfile: true },
  })

  if (existing) {
    // Ensure role is ADMIN
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    })

    // Ensure AdminProfile exists
    if (!existing.adminProfile) {
      await prisma.adminProfile.create({
        data: {
          userId: existing.id,
          niveauAcces: 1,
        },
      })
      console.log(`✅ AdminProfile created for existing user: ${email}`)
    } else {
      console.log(`✅ Admin user and AdminProfile already exist: ${email}`)
    }
  } else {
    const motDePasseHash = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: {
        nom: 'Admin',
        prenom: 'Bideyati',
        email,
        motDePasseHash,
        role: 'ADMIN',
        adminProfile: {
          create: {
            niveauAcces: 1,
          },
        },
      },
    })
    console.log(`✅ Admin user + AdminProfile created successfully: ${email}`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
