const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/:patientId', authenticate, async (req, res) => {
  try {
    const record = await prisma.odontogram.findUnique({
      where: { patientId: req.params.patientId },
    });
    res.json({ conditions: record?.conditions ?? {} });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener odontograma' });
  }
});

router.put('/:patientId', authenticate, async (req, res) => {
  const { conditions } = req.body;
  if (!conditions || typeof conditions !== 'object') {
    return res.status(400).json({ error: 'Condiciones inválidas' });
  }
  try {
    const record = await prisma.odontogram.upsert({
      where: { patientId: req.params.patientId },
      update: { conditions },
      create: { patientId: req.params.patientId, conditions },
    });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar odontograma' });
  }
});

module.exports = router;
