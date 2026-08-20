import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { cloudflareImagesEnabled, uploadToCloudflareImages } from '../lib/cloudflare-images.js';
import { registrarAuditoria } from '../lib/auditoria.js';
import { isAllowedImageBuffer, isAllowedImageMime } from '../lib/upload-filters.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, isAllowedImageMime(file.mimetype));
  },
});

router.get('/status', authenticate, authorize('eventos', 'write'), (_req, res) => {
  res.json({ cloudflareImages: cloudflareImagesEnabled() });
});

router.post(
  '/images',
  authenticate,
  authorize('eventos', 'write'),
  upload.single('file'),
  async (req, res) => {
    if (!cloudflareImagesEnabled()) {
      res.status(503).json({
        error: 'Cloudflare Images não configurado. Defina CF_ACCOUNT_ID e CF_IMAGES_API_TOKEN no backend.',
      });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Arquivo obrigatório (JPEG/PNG/WebP, máx. 5 MB)' });
      return;
    }
    if (!isAllowedImageMime(req.file.mimetype) || !isAllowedImageBuffer(req.file.buffer, req.file.mimetype)) {
      res.status(400).json({ error: 'Arquivo inválido: conteúdo não corresponde a JPEG/PNG/WebP' });
      return;
    }

    try {
      const result = await uploadToCloudflareImages(
        req.file.buffer,
        req.file.originalname,
        { uploadedBy: String(req.user!.userId) }
      );

      await registrarAuditoria(req, {
        rota: 'admin.media.upload',
        motivo: `cf_image:${result.id}`,
        usuarioId: req.user!.userId,
        setor: req.user!.setorAcesso,
      });

      res.status(201).json(result);
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'Falha no upload' });
    }
  }
);

export default router;
