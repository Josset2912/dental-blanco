const express = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { date, month, doctorId } = req.query;
    let dateFilter = {};
    if (month) {
      // month = "YYYY-MM" → all appointments in that month
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end   = new Date(y, m, 1);
      dateFilter = { date: { gte: start, lt: end } };
    } else if (date) {
      dateFilter = { date: { gte: new Date(date + 'T00:00:00'), lte: new Date(date + 'T23:59:59') } };
    }
    const appointments = await prisma.appointment.findMany({
      where: { ...dateFilter, ...(doctorId && { doctorId }) },
      include: { patient: true, doctor: true },
      orderBy: { date: 'asc' }
    });
    res.json(appointments);
  } catch {
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { patientId, doctorId, date, duration, reason, notes, status } = req.body;
    const data = {
      patientId,
      doctorId,
      date: new Date(date),
      duration: Number(duration),
      reason,
      ...(notes && { notes }),
      ...(status && { status }),
    };
    const appointment = await prisma.appointment.create({
      data,
      include: { patient: true, doctor: true }
    });
    res.status(201).json(appointment);
  } catch (e) {
    console.error('appointment POST error:', e.message);
    res.status(500).json({ error: 'Error al crear cita' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: req.body,
      include: { patient: true, doctor: true }
    });
    res.json(appointment);
  } catch {
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });
    res.json({ message: 'Cita cancelada' });
  } catch {
    res.status(500).json({ error: 'Error al cancelar cita' });
  }
});

module.exports = router;
