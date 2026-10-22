const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const prisma = require('../lib/prisma');

const router = express.Router();

router.use(authenticate);

router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, newThisMonth, byGender] = await Promise.all([
      prisma.patient.count({ where: { active: true } }),
      prisma.patient.count({ where: { active: true, createdAt: { gte: monthStart } } }),
      prisma.patient.groupBy({
        by: ['gender'],
        where: { active: true },
        _count: { gender: true },
      }),
    ]);

    const genderMap = Object.fromEntries(byGender.map(g => [g.gender, g._count.gender]));
    res.json({
      total,
      newThisMonth,
      byGender: {
        MASCULINO: genderMap.MASCULINO ?? 0,
        FEMENINO: genderMap.FEMENINO ?? 0,
        OTRO: genderMap.OTRO ?? 0,
      },
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const where = {
      active: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } }
        ]
      })
    };

    if (page !== undefined) {
      const take = parseInt(limit) || 20;
      const skip = (parseInt(page) - 1) * take;
      const [patients, total] = await Promise.all([
        prisma.patient.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
        prisma.patient.count({ where }),
      ]);
      return res.json({ data: patients, total, page: parseInt(page), limit: take });
    }

    const patients = await prisma.patient.findMany({ where, orderBy: { createdAt: 'desc' } });
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

router.post('/', validate(schemas.patient), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.birthDate) data.birthDate = new Date(data.birthDate);
    if (data.email === '') data.email = null;
    const patient = await prisma.patient.create({ data });
    res.status(201).json(patient);
  } catch {
    res.status(500).json({ error: 'Error al crear paciente' });
  }
});

router.put('/:id', validate(schemas.patientUpdate), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.birthDate) data.birthDate = new Date(data.birthDate);
    if (data.email === '') data.email = null;
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data
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
