const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const rateLimit = require('express-rate-limit');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();
const prisma = new PrismaClient();

// Máximo 10 intentos de login por IP cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Espera 15 minutos antes de intentar de nuevo.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Máximo 5 registros por IP por hora (evita creación masiva de cuentas)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados registros desde esta IP. Intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    if (!user.active)
      return res.status(401).json({ error: 'Usuario inactivo' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/register', registerLimiter, validate(schemas.register), async (req, res) => {
  try {
    const { name, email, password, role, specialty, phone } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email ya registrado' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, specialty, phone }
    });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

router.put('/change-password', require('../middleware/auth').authenticate, validate(schemas.changePassword), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !await bcrypt.compare(currentPassword, user.password))
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: 'Contraseña actualizada' });
  } catch {
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

module.exports = router;
