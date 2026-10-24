const express = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    let profile = await prisma.clinicProfile.findFirst();
    if (!profile) {
      profile = await prisma.clinicProfile.create({ data: {} });
    }
    res.json(profile);
  } catch {
    res.status(500).json({ error: 'Error al obtener perfil de clínica' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { name, phone, email, address, city, schedule } = req.body;
    let profile = await prisma.clinicProfile.findFirst();
    if (profile) {
      profile = await prisma.clinicProfile.update({
        where: { id: profile.id },
        data: { name, phone, email, address, city, schedule },
      });
    } else {
      profile = await prisma.clinicProfile.create({
        data: { name, phone, email, address, city, schedule },
      });
    }
    res.json(profile);
  } catch {
    res.status(500).json({ error: 'Error al guardar perfil de clínica' });
  }
});

module.exports = router;
