import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import pessoasRoutes from './routes/pessoas.js';
import financeiroRoutes from './routes/financeiro.js';
import eventosRoutes from './routes/eventos.js';
import livrariaRoutes from './routes/livraria.js';
import estoqueCasaRoutes from './routes/estoque-casa.js';
import delegacoesRoutes from './routes/delegacoes.js';
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
import cobrancasRoutes from './routes/cobrancas.js';
import marketingRoutes from './routes/marketing.js';
import materiaisEstudoRoutes, { publicMateriaisEstudoRouter } from './routes/materiais-estudo.js';
import galeriaRoutes, { publicGaleriaRouter, erpGaleriaRouter } from './routes/galeria.js';
import fornecedoresRoutes from './routes/fornecedores.js';
import contasPagarRoutes from './routes/contas-pagar.js';
import mensalidadePlanosRoutes from './routes/mensalidade-planos.js';
import tesourariaDreRoutes from './routes/tesouraria-dre.js';
import ofxRoutes from './routes/ofx.js';
import contribuintesRoutes from './routes/contribuintes.js';
import { gerarMensalidadesDoMes } from './jobs/gerar-mensalidades.js';
import { isProductionRuntime } from './lib/runtime-env.js';
import { auditMiddleware } from './middleware/audit.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

const corsOrigin = process.env.CORS_ORIGIN?.trim();
if (isProductionRuntime() && (!corsOrigin || corsOrigin === '*')) {
  throw new Error('[security] Defina CORS_ORIGIN com a URL do frontend em produção (não use *).');
}
app.use(
  cors({
    origin: corsOrigin && corsOrigin !== '*' ? corsOrigin : isProductionRuntime() ? false : true,
  })
);

// API JSON: CSP estrito (sem scripts). Frontend CSP fica no nginx.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
      },
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

app.use(express.json({ limit: '1mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProductionRuntime() ? 600 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde e tente novamente.' },
});
app.use('/api/', apiLimiter);

app.use(auditMiddleware);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'casadapaz-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/pessoas', pessoasRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/financeiro', tesourariaDreRoutes);
app.use('/api/financeiro/ofx', ofxRoutes);
app.use('/api/cobrancas', cobrancasRoutes);
app.use('/api/marketing/materiais-estudo', materiaisEstudoRoutes);
app.use('/api/marketing/galeria', galeriaRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/galeria', erpGaleriaRouter);
app.use('/api/fornecedores', fornecedoresRoutes);
app.use('/api/contas-pagar', contasPagarRoutes);
app.use('/api/mensalidade-planos', mensalidadePlanosRoutes);
app.use('/api/contribuintes', contribuintesRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/livraria', livrariaRoutes);
app.use('/api/estoque-casa', estoqueCasaRoutes);
app.use('/api/delegacoes', delegacoesRoutes);
app.use('/api/public/materiais-estudo', publicMateriaisEstudoRouter);
app.use('/api/public/galeria', publicGaleriaRouter);
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
  // Job recorrência (sem Asaas) — a cada 6h
  const run = () => {
    gerarMensalidadesDoMes()
      .then((n) => {
        if (n > 0) console.log(`[recorrencia] ${n} mensalidade(s) gerada(s)`);
      })
      .catch((e) => console.error('[recorrencia]', e));
  };
  run();
  setInterval(run, 6 * 60 * 60 * 1000);
});

export default app;
