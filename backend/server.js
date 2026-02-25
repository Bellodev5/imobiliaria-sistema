require('dotenv').config();
const express  = require('express');
const cors     = require('cors');

const authRoutes     = require('./auth');
const reservaRoutes  = require('./reservas');
const imoveisRoutes  = require('./imoveis');
const pessoasRoutes  = require('./pessoas');
const limpezaRoutes  = require('./limpeza');
const { routerTipos, routerMunicipios, routerBancos } = require('./cadastros');

const app  = express();
const PORT = process.env.PORT || 3001;

/* ─── CORS ─────────────────────────────────────────────────── */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origem não permitida — ${origin}`));
  },
  credentials: true,
}));

/* ─── BODY PARSERS ──────────────────────────────────────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ─── HEALTH CHECK ──────────────────────────────────────────── */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'ImobiliWin API', hora: new Date().toISOString() });
});

/* ─── ROTAS ─────────────────────────────────────────────────── */
app.use('/api/auth',       authRoutes);
app.use('/api/reservas',   reservaRoutes);
app.use('/api/imoveis',    imoveisRoutes);
app.use('/api/pessoas',    pessoasRoutes);
app.use('/api/limpeza',    limpezaRoutes);
app.use('/api/tipos',      routerTipos);
app.use('/api/municipios', routerMunicipios);
app.use('/api/bancos',     routerBancos);

/* ─── 404 ───────────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ message: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

/* ─── ERRO GLOBAL ───────────────────────────────────────────── */
app.use((err, req, res, _next) => {
  console.error('[ERRO]', err);
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

/* ─── START ─────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║       Morada do Sol API  v1.0.0      ║');
  console.log(`║   http://localhost:${PORT}              ║`);
  console.log('╚══════════════════════════════════════╝');
  console.log('');
});

module.exports = app;

