const express = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

router.use(authenticate);

router.get('/:patientId', async (req, res) => {
  try {
    const notes = await prisma.clinicalNote.findMany({
      where: { patientId: req.params.patientId },
      include: { doctor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notes);
  } catch { res.status(500).json({ error: 'Error al obtener notas' }); }
});

router.post('/:patientId', async (req, res) => {
  try {
    const note = await prisma.clinicalNote.create({
      data: { patientId: req.params.patientId, doctorId: req.user.id, content: req.body.content },
      include: { doctor: { select: { id: true, name: true } } },
    });
    res.status(201).json(note);
  } catch { res.status(500).json({ error: 'Error al crear nota' }); }
});

router.delete('/:noteId', async (req, res) => {
  try {
    await prisma.clinicalNote.delete({ where: { id: req.params.noteId } });
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Error al eliminar nota' }); }
});

module.exports = router;
