const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Overview: key metrics for current month
router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [totalPatients, newPatientsMonth, appointmentsMonth, paymentsMonth, pendingTreatments] =
      await Promise.all([
        prisma.patient.count({ where: { active: true } }),
        prisma.patient.count({ where: { active: true, createdAt: { gte: monthStart, lt: monthEnd } } }),
        prisma.appointment.count({ where: { date: { gte: monthStart, lt: monthEnd }, status: { not: 'CANCELLED' } } }),
        prisma.payment.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: monthStart, lt: monthEnd } } }),
        prisma.treatment.count({ where: { status: 'IN_PROGRESS' } }),
      ]);

    res.json({
      totalPatients,
      newPatientsMonth,
      appointmentsMonth,
      revenueMonth: Number(paymentsMonth._sum.amount ?? 0),
      pendingTreatments,
    });
  } catch (e) {
    console.error('overview error:', e.message);
    res.status(500).json({ error: 'Error al obtener resumen', detail: e.message });
  }
});

// Monthly revenue for the last 12 months
router.get('/revenue', async (req, res) => {
  try {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: new Date(months[0].year, months[0].month - 1, 1) } },
      select: { amount: true, createdAt: true },
    });

    const data = months.map(({ year, month }) => {
      const total = payments
        .filter(p => {
          const d = new Date(p.createdAt);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const label = new Date(year, month - 1, 1).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
      return { label, total };
    });

    res.json(data);
  } catch {
    res.status(500).json({ error: 'Error al obtener ingresos' });
  }
});

// New patients per month (last 12 months)
router.get('/patients', async (req, res) => {
  try {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const patients = await prisma.patient.findMany({
      where: { createdAt: { gte: new Date(months[0].year, months[0].month - 1, 1) } },
      select: { createdAt: true },
    });

    const data = months.map(({ year, month }) => {
      const count = patients.filter(p => {
        const d = new Date(p.createdAt);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }).length;
      const label = new Date(year, month - 1, 1).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
      return { label, count };
    });

    res.json(data);
  } catch {
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
});

// Treatments by status + payment methods breakdown
router.get('/treatments', async (req, res) => {
  try {
    const [byStatus, byMethod] = await Promise.all([
      prisma.treatment.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.payment.groupBy({ by: ['method'], _sum: { amount: true }, _count: { _all: true } }),
    ]);

    const STATUS_LABEL = { IN_PROGRESS: 'En progreso', COMPLETED: 'Completado', CANCELLED: 'Cancelado' };
    const METHOD_LABEL = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia' };

    res.json({
      byStatus: byStatus.map(r => ({
        label: STATUS_LABEL[r.status] ?? r.status,
        value: r._count._all,
      })),
      byMethod: byMethod.map(r => ({
        label: METHOD_LABEL[r.method] ?? r.method,
        count: r._count._all,
        total: Number(r._sum.amount ?? 0),
      })),
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener tratamientos' });
  }
});

// Balance mensual detallado: pagos del mes con info de paciente y tratamiento
router.get('/balance', async (req, res) => {
  try {
    const now = new Date();
    const year  = parseInt(req.query.year)  || now.getFullYear();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);

    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 1);

    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: {
        patient:   { select: { name: true, lastName: true, phone: true } },
        treatment: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total    = payments.reduce((s, p) => s + Number(p.amount), 0);
    const count    = payments.length;
    const average  = count > 0 ? total / count : 0;

    // Desglose por método
    const byMethod = {};
    for (const p of payments) {
      if (!byMethod[p.method]) byMethod[p.method] = { count: 0, total: 0 };
      byMethod[p.method].count++;
      byMethod[p.method].total += Number(p.amount);
    }

    // Comparar con mes anterior
    const prevStart = new Date(year, month - 2, 1);
    const prevEnd   = new Date(year, month - 1, 1);
    const prevAgg   = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: prevStart, lt: prevEnd } },
    });
    const prevTotal = Number(prevAgg._sum.amount ?? 0);
    const growth    = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;

    const METHOD_LABEL = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia' };

    res.json({
      total,
      count,
      average,
      prevTotal,
      growth,
      byMethod: Object.entries(byMethod).map(([method, v]) => ({
        method,
        label: METHOD_LABEL[method] ?? method,
        ...v,
      })),
      payments: payments.map(p => ({
        id:        p.id,
        amount:    Number(p.amount),
        method:    p.method,
        concept:   p.concept,
        notes:     p.notes,
        createdAt: p.createdAt,
        patient:   p.patient,
        treatment: p.treatment,
      })),
    });
  } catch (e) {
    console.error('balance error:', e.message);
    res.status(500).json({ error: 'Error al obtener balance', detail: e.message });
  }
});

module.exports = router;
