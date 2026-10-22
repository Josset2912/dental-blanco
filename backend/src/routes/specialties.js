const express = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const specialties = await prisma.specialty.findMany({ where: { active: true } });
    res.json(specialties);
  } catch {
    res.status(500).json({ error: 'Error al obtener especialidades' });
  }
});

router.post('/', async (req, res) => {
  try {
    const specialty = await prisma.specialty.create({ data: req.body });
    res.status(201).json(specialty);
  } catch {
    res.status(500).json({ error: 'Error al crear especialidad' });
  }
});

module.exports = router;
