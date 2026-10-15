require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const doctorPassword = await bcrypt.hash('doctor123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@dentalblanco.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@dentalblanco.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  await prisma.user.upsert({
    where: { email: 'doctor@dentalblanco.com' },
    update: {},
    create: {
      name: 'Dr. García',
      email: 'doctor@dentalblanco.com',
      password: doctorPassword,
      role: 'DOCTOR',
      specialty: 'Odontología General',
      phone: '555-0001'
    }
  });

  await prisma.specialty.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Odontología General' },
      { name: 'Ortodoncia' },
      { name: 'Endodoncia' },
      { name: 'Periodoncia' },
      { name: 'Cirugía Oral' },
      { name: 'Odontopediatría' },
      { name: 'Implantología' }
    ]
  });

  console.log('✅ Seed completado');
  console.log('   Admin: admin@dentalblanco.com / admin123');
  console.log('   Doctor: doctor@dentalblanco.com / doctor123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
