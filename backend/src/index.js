require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const specialtyRoutes = require('./routes/specialties');
const dashboardRoutes = require('./routes/dashboard');
const treatmentRoutes = require('./routes/treatments');
const paymentRoutes = require('./routes/payments');
const odontogramRoutes = require('./routes/odontogram');
const reportsRoutes = require('./routes/reports');
const imagesRoutes = require('./routes/images');
const clinicalNotesRoutes = require('./routes/clinical-notes');
const blockedSlotsRoutes = require('./routes/blocked-slots');
const clinicProfileRoutes = require('./routes/clinic-profile');

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173']
  : ['http://localhost:5173'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/odontogram', odontogramRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/clinical-notes', clinicalNotesRoutes);
app.use('/api/blocked-slots', blockedSlotsRoutes);
app.use('/api/clinic-profile', clinicProfileRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
