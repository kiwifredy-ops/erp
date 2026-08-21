import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { rrhhRouter } from './routes/rrhh.js';
import { almacenRouter } from './routes/almacen.js';
import { gastosRouter } from './routes/gastos.js';
import { asistenciaRouter } from './routes/asistencia.js';
import { flotaRouter } from './routes/flota.js';
import { abastecimientoRouter } from './routes/abastecimiento.js';
import { contabilidadRouter } from './routes/contabilidad.js';
import { ticketsRouter } from './routes/tickets.js';
import { clientesRouter } from './routes/clientes.js';
import { usuariosRouter } from './routes/usuarios.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
// límite alto: documentos, fotos y video corto de tickets se suben como base64
app.use(express.json({ limit: '30mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/rrhh', rrhhRouter);
app.use('/api/almacen', almacenRouter);
app.use('/api/gastos', gastosRouter);
app.use('/api/asistencia', asistenciaRouter);
app.use('/api/flota', flotaRouter);
app.use('/api/abastecimiento', abastecimientoRouter);
app.use('/api/contabilidad', contabilidadRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/usuarios', usuariosRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API escuchando en puerto ${port}`));
