const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

function withBalance(t) {
  const totalPaid = t.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const balance = Math.max(0, parseFloat(t.cost) - totalPaid);
  return { ...t, totalPaid, balance };
}

router.get('/', async (req, res) => {
  try {
    const { patientId, status } = req.query;
    const treatments = await prisma.treatment.findMany({
      where: {
        ...(patientId && { patientId }),
        ...(status && { status }),
      },
      include: {
        patient: { select: { id: true, name: true, lastName: true, phone: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { startDate: 'desc' },
    });
    res.json(treatments.map(withBalance));
  } catch {
    res.status(500).json({ error: 'Error al obtener tratamientos' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const treatment = await prisma.treatment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { select: { id: true, name: true, lastName: true, phone: true } },
        payments: { select: { amount: true } },
      },
    });
    if (!treatment) return res.status(404).json({ error: 'Tratamiento no encontrado' });
    res.json(withBalance(treatment));
  } catch {
    res.status(500).json({ error: 'Error al obtener tratamiento' });
  }
});

router.post('/', async (req, res) => {
  try {
    const treatment = await prisma.treatment.create({
      data: {
        ...req.body,
        cost: parseFloat(req.body.cost),
      },
      include: {
        patient: { select: { id: true, name: true, lastName: true, phone: true } },
      },
    });
    res.status(201).json(treatment);
  } catch (e) {
    console.error('treatment POST error:', e.message);
    res.status(500).json({ error: 'Error al crear tratamiento', detail: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.cost !== undefined) data.cost = parseFloat(data.cost);
    const treatment = await prisma.treatment.update({
      where: { id: req.params.id },
      data,
      include: {
        patient: { select: { id: true, name: true, lastName: true, phone: true } },
      },
    });
    res.json(treatment);
  } catch {
    res.status(500).json({ error: 'Error al actualizar tratamiento' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.treatment.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    res.json({ message: 'Tratamiento cancelado' });
  } catch {
    res.status(500).json({ error: 'Error al cancelar tratamiento' });
  }
});

module.exports = router;
