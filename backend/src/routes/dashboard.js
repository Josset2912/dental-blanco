const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalPatients,
      appointmentsToday,
      appointmentsPending,
      completedThisMonth,
      todayAppointments,
      recentPatients,
      monthRevenueResult,
    ] = await Promise.all([
      prisma.patient.count({ where: { active: true } }),
      prisma.appointment.count({
        where: { date: { gte: todayStart, lte: todayEnd }, status: { not: 'CANCELLED' } }
      }),
      prisma.appointment.count({ where: { status: 'SCHEDULED' } }),
      prisma.appointment.count({
        where: { status: 'COMPLETED', date: { gte: monthStart, lte: monthEnd } }
      }),
      prisma.appointment.findMany({
        where: { date: { gte: todayStart, lte: todayEnd }, status: { not: 'CANCELLED' } },
        include: { patient: { select: { name: true, lastName: true, phone: true } } },
        orderBy: { date: 'asc' },
        take: 8,
      }),
      prisma.patient.findMany({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, lastName: true, phone: true, createdAt: true },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: monthStart, lte: monthEnd } },
      }),
    ]);

    res.json({
      stats: {
        totalPatients,
        appointmentsToday,
        appointmentsPending,
        completedThisMonth,
        monthRevenue: monthRevenueResult._sum.amount ?? 0,
      },
      todayAppointments,
      recentPatients,
    });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
});

module.exports = router;
