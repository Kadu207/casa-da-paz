import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import pessoasRoutes from './routes/pessoas.js';
import financeiroRoutes from './routes/financeiro.js';
import eventosRoutes from './routes/eventos.js';
import livrariaRoutes from './routes/livraria.js';
import publicRoutes from './routes/public.js';
import publicEcommerceRoutes from './routes/public-ecommerce.js';
import ecommerceRoutes from './routes/ecommerce.js';
import webhooksRoutes from './routes/webhooks.js';
import importRoutes from './routes/import.js';
import agendamentosRoutes from './routes/agendamentos.js';
import metricasRoutes from './routes/metricas.js';
import auditoriaRoutes from './routes/auditoria.js';
import alertasRoutes from './routes/alertas.js';
import mediaRoutes from './routes/media.js';

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
app.use('/api/public', publicEcommerceRoutes);
app.use('/api/ecommerce', ecommerceRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/import', importRoutes);
app.use('/api/metricas', metricasRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/media', mediaRoutes);

app.listen(PORT, () => {
  console.log(`Casa da Paz API rodando na porta ${PORT}`);
});

export default app;
