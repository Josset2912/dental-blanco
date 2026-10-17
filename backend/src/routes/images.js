const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.use(authenticate);

// GET /api/images/:patientId
router.get('/:patientId', async (req, res) => {
  try {
    const images = await prisma.patientImage.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(images);
  } catch {
    res.status(500).json({ error: 'Error al obtener imágenes' });
  }
});

// POST /api/images/:patientId
router.post('/:patientId', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se envió archivo' });

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `dental_blanco/${req.params.patientId}`, resource_type: 'image' },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    const image = await prisma.patientImage.create({
      data: {
        patientId: req.params.patientId,
        url: result.secure_url,
        publicId: result.public_id,
        name: req.file.originalname,
        type: req.body.type || 'radiografia',
      },
    });
    res.status(201).json(image);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir imagen' });
  }
});

// DELETE /api/images/item/:imageId
router.delete('/item/:imageId', async (req, res) => {
  try {
    const image = await prisma.patientImage.findUnique({ where: { id: req.params.imageId } });
    if (!image) return res.status(404).json({ error: 'Imagen no encontrada' });

    await cloudinary.uploader.destroy(image.publicId);
    await prisma.patientImage.delete({ where: { id: req.params.imageId } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar imagen' });
  }
});

module.exports = router;
