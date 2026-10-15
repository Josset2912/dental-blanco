const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const patients = await prisma.patient.findMany({
      where: {
        active: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } }
          ]
        })
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(patients);
  } catch {
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        appointments: { include: { doctor: true }, orderBy: { date: 'desc' } },
        treatments: { orderBy: { startDate: 'desc' } }
      }
    });
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json(patient);
  } catch {
    res.status(500).json({ error: 'Error al obtener paciente' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.birthDate) data.birthDate = new Date(data.birthDate);
    const patient = await prisma.patient.create({ data });
    res.status(201).json(patient);
  } catch {
    res.status(500).json({ error: 'Error al crear paciente' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(patient);
  } catch {
    res.status(500).json({ error: 'Error al actualizar paciente' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.patient.update({
      where: { id: req.params.id },
      data: { active: false }
    });
    res.json({ message: 'Paciente eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar paciente' });
  }
});

module.exports = router;
