const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Borrando datos...');
  await prisma.payment.deleteMany();
  await prisma.odontogram.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.specialty.deleteMany();
  console.log('Listo. Base de datos limpia (usuarios conservados).');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
