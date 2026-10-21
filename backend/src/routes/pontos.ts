import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { parseSpotifyUrl, parseTelegramUrl, type SpotifyRef } from '../lib/spotify-url.js';

const router = Router();

const CONFIG_ID = 1;

const spotifyField = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((value) => parseSpotifyUrl(value) !== null, 'URL do Spotify inválida');

const pontoSchema = z.object({
  titulo: z.string().trim().min(2).max(150),
  linha: z.string().trim().min(2).max(80),
  letra: z
    .string()
    .trim()
    .max(8000)
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  spotifyUrl: spotifyField,
  ordem: z.number().int().min(0).optional(),
  publicado: z.boolean().optional(),
});

const configSchema = z.object({
  playlistTitulo: z.string().trim().min(2).max(150),
  playlistUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  telegramUrl: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
});

function publicSpotify(url: string): SpotifyRef | null {
  return parseSpotifyUrl(url);
}

async function loadConfig() {
  return prisma.casaPortalConfig.upsert({
    where: { id: CONFIG_ID },
    update: {},
    create: { id: CONFIG_ID },
  });
}

export const publicPontosRouter = Router();

publicPontosRouter.get('/', async (_req, res) => {
  const [config, pontos] = await Promise.all([
    loadConfig(),
    prisma.pontoCantado.findMany({
      where: { publicado: true },
      orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
    }),
  ]);
  const playlist = config.playlistUrl ? parseSpotifyUrl(config.playlistUrl) : null;
  res.json({
    playlist: playlist
      ? { titulo: config.playlistTitulo, kind: playlist.kind, url: playlist.url, embedUrl: playlist.embedUrl }
      : null,
    pontos: pontos.flatMap((ponto) => {
      const ref = publicSpotify(ponto.spotifyUrl);
      if (!ref) return [];
      return [
        {
          id: ponto.id,
          titulo: ponto.titulo,
          linha: ponto.linha,
          letra: ponto.letra,
          ordem: ponto.ordem,
          kind: ref.kind,
          url: ref.url,
          embedUrl: ref.embedUrl,
        },
      ];
    }),
    telegramUrl: config.telegramUrl,
  });
});

export const publicCanaisRouter = Router();

publicCanaisRouter.get('/', async (_req, res) => {
  const config = await loadConfig();
  res.json({ telegramUrl: config.telegramUrl });
});

router.get('/config', authenticate, authorize('marketing', 'read'), async (_req, res) => {
  res.json(await loadConfig());
});

router.put('/config', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados da playlist ou do Telegram inválidos' });
    return;
  }
  const playlist = parsed.data.playlistUrl ? parseSpotifyUrl(parsed.data.playlistUrl) : null;
  if (parsed.data.playlistUrl && (!playlist || playlist.kind !== 'playlist')) {
    res.status(400).json({ error: 'A playlist precisa ser um link open.spotify.com/playlist/…' });
    return;
  }
  const telegram = parsed.data.telegramUrl ? parseTelegramUrl(parsed.data.telegramUrl) : null;
  if (parsed.data.telegramUrl && !telegram) {
    res.status(400).json({ error: 'O Telegram precisa ser um link https://t.me/…' });
    return;
  }
  const saved = await prisma.casaPortalConfig.upsert({
    where: { id: CONFIG_ID },
    update: {
      playlistTitulo: parsed.data.playlistTitulo,
      playlistUrl: playlist?.url ?? null,
      telegramUrl: telegram,
    },
    create: {
      id: CONFIG_ID,
      playlistTitulo: parsed.data.playlistTitulo,
      playlistUrl: playlist?.url ?? null,
      telegramUrl: telegram,
    },
  });
  res.json(saved);
});

router.get('/', authenticate, authorize('marketing', 'read'), async (_req, res) => {
  const list = await prisma.pontoCantado.findMany({
    orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
  });
  res.json(list);
});

router.post('/', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const parsed = pontoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Preencha título, linha e um link de faixa do Spotify' });
    return;
  }
  const ref = parseSpotifyUrl(parsed.data.spotifyUrl);
  if (!ref || ref.kind !== 'track') {
    res.status(400).json({ error: 'Cada ponto precisa de um link open.spotify.com/track/…' });
    return;
  }
  const created = await prisma.pontoCantado.create({
    data: {
      ...parsed.data,
      letra: parsed.data.letra ?? null,
      spotifyUrl: ref.url,
      ordem: parsed.data.ordem ?? 0,
      publicado: parsed.data.publicado ?? false,
    },
  });
  res.status(201).json(created);
});

router.patch('/:id', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'id inválido' });
    return;
  }
  const body = pontoSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: 'Dados do ponto inválidos' });
    return;
  }
  const data = { ...body.data };
  if (data.spotifyUrl) {
    const ref = parseSpotifyUrl(data.spotifyUrl);
    if (!ref || ref.kind !== 'track') {
      res.status(400).json({ error: 'Cada ponto precisa de um link open.spotify.com/track/…' });
      return;
    }
    data.spotifyUrl = ref.url;
  }
  try {
    const updated = await prisma.pontoCantado.update({ where: { id }, data });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Ponto não encontrado' });
  }
});

router.delete('/:id', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'id inválido' });
    return;
  }
  try {
    await prisma.pontoCantado.update({ where: { id }, data: { publicado: false } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Ponto não encontrado' });
  }
});

export default router;
