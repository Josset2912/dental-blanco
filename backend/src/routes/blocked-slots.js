const express = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    const where = { doctorId: req.user.id };
    if (month) where.date = { startsWith: month };
    const slots = await prisma.blockedSlot.findMany({ where, orderBy: { date: 'asc' } });
    res.json(slots);
  } catch { res.status(500).json({ error: 'Error al obtener bloqueos' }); }
});

router.post('/', async (req, res) => {
  try {
    const slot = await prisma.blockedSlot.create({
      data: { ...req.body, doctorId: req.user.id },
    });
    res.status(201).json(slot);
  } catch { res.status(500).json({ error: 'Error al crear bloqueo' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.blockedSlot.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Error al eliminar bloqueo' }); }
});

module.exports = router;
