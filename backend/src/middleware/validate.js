const { z } = require('zod');

// Middleware factory: valida req.body contra un schema Zod
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ error: 'Datos inválidos', errors });
    }
    req.body = result.data; // datos ya parseados y limpios
    next();
  };
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const registerSchema = z.object({
  name:      z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email:     z.string().email('Email inválido'),
  password:  z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role:      z.enum(['ADMIN', 'DOCTOR', 'RECEPCIONISTA']).optional(),
  specialty: z.string().optional(),
  phone:     z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword:     z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});

const patientSchema = z.object({
  name:      z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName:  z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  phone:     z.string().min(7, 'Teléfono inválido'),
  birthDate: z.string().min(1, 'La fecha de nacimiento es requerida'),
  gender:    z.enum(['MASCULINO', 'FEMENINO', 'OTRO']),
  email:     z.string().email('Email inválido').optional().or(z.literal('')),
  address:   z.string().optional(),
  allergies: z.string().optional(),
  notes:     z.string().optional(),
});

const patientUpdateSchema = patientSchema.partial();

const treatmentSchema = z.object({
  patientId:   z.string().uuid('ID de paciente inválido'),
  name:        z.string().min(2, 'El nombre del tratamiento es requerido'),
  cost:        z.number({ invalid_type_error: 'El costo debe ser un número' }).positive('El costo debe ser mayor a 0'),
  startDate:   z.string().min(1, 'La fecha de inicio es requerida'),
  description: z.string().optional(),
  notes:       z.string().optional(),
});

const treatmentUpdateSchema = z.object({
  name:        z.string().min(2).optional(),
  cost:        z.number().positive().optional(),
  status:      z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  description: z.string().optional(),
  notes:       z.string().optional(),
  endDate:     z.string().optional(),
});

const paymentSchema = z.object({
  patientId:   z.string().uuid('ID de paciente inválido'),
  treatmentId: z.string().uuid().optional().nullable(),
  amount:      z.number({ invalid_type_error: 'El monto debe ser un número' }).positive('El monto debe ser mayor a 0'),
  method:      z.enum(['CASH', 'CARD', 'TRANSFER']),
  concept:     z.string().min(1, 'El concepto es requerido'),
  notes:       z.string().optional(),
  createdAt:   z.string().optional(),
});

module.exports = {
  validate,
  schemas: {
    login:           loginSchema,
    register:        registerSchema,
    changePassword:  changePasswordSchema,
    patient:         patientSchema,
    patientUpdate:   patientUpdateSchema,
    treatment:       treatmentSchema,
    treatmentUpdate: treatmentUpdateSchema,
    payment:         paymentSchema,
  },
};
