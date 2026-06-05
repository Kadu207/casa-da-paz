import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import pessoasRoutes from './routes/pessoas.js';
import financeiroRoutes from './routes/financeiro.js';
import eventosRoutes from './routes/eventos.js';
import livrariaRoutes from './routes/livraria.js';
import publicRoutes from './routes/public.js';
import webhooksRoutes from './routes/webhooks.js';
import importRoutes from './routes/import.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'casadapaz-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/pessoas', pessoasRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/livraria', livrariaRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/import', importRoutes);

app.listen(PORT, () => {
  console.log(`Casa da Paz API rodando na porta ${PORT}`);
});

export default app;
