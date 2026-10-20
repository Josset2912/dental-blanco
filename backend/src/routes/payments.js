const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { patientId, page, limit } = req.query;
    const where = { ...(patientId && { patientId }) };
    const include = {
      patient: { select: { id: true, name: true, lastName: true } },
      treatment: { select: { id: true, name: true } },
    };

    if (page !== undefined) {
      const take = parseInt(limit) || 20;
      const skip = (parseInt(page) - 1) * take;
      const [payments, total] = await Promise.all([
        prisma.payment.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take }),
        prisma.payment.count({ where }),
      ]);
      return res.json({ data: payments, total, page: parseInt(page), limit: take });
    }

    const payments = await prisma.payment.findMany({ where, include, orderBy: { createdAt: 'desc' } });
    res.json(payments);
  } catch {
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [totalResult, monthResult, countMonth, countTotal] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.payment.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
      prisma.payment.count(),
    ]);

    res.json({
      totalRevenue: totalResult._sum.amount ?? 0,
      monthRevenue: monthResult._sum.amount ?? 0,
      countMonth,
      countTotal,
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

router.post('/', validate(schemas.payment), async (req, res) => {
  try {
    const { createdAt, ...rest } = req.body;
    const amount = parseFloat(rest.amount);

    if (rest.treatmentId) {
      const treatment = await prisma.treatment.findUnique({ where: { id: rest.treatmentId } });
      if (treatment) {
        const paid = await prisma.payment.aggregate({ _sum: { amount: true }, where: { treatmentId: rest.treatmentId } });
        const totalPaid = parseFloat(paid._sum.amount ?? 0);
        const balance = parseFloat(treatment.cost) - totalPaid;
        if (amount > balance + 0.01) {
          return res.status(400).json({ error: `El monto supera el saldo pendiente (S/ ${balance.toFixed(2)})` });
        }
      }
    }

    const payment = await prisma.payment.create({
      data: {
        ...rest,
        amount,
        treatmentId: rest.treatmentId || null,
        ...(createdAt && { createdAt: new Date(createdAt) }),
      },
      include: {
        patient: { select: { id: true, name: true, lastName: true } },
        treatment: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(payment);
  } catch (e) {
    res.status(500).json({ error: 'Error al registrar pago' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.payment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Pago eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar pago' });
  }
});

module.exports = router;
