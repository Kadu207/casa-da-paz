import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/excel', authenticate, authorize('import', 'write'), async (req, res) => {
  res.status(501).json({
    error: 'Importação Excel delegada ao ai-service',
    hint: 'POST /ai/parse-excel com arquivo .xlsx',
  });
});

export default router;
