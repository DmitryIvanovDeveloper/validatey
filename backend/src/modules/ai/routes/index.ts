import { Router } from 'express';
import hypothesisSuggestRoutes from './hypothesis-suggest.routes';
import marketContextSuggestRoutes from '../interface-adapters/routes/market-context-suggest.routes';
import formatTextRoutes from '../interface-adapters/routes/format-text.routes';

const router = Router();
router.use(hypothesisSuggestRoutes);
router.use(marketContextSuggestRoutes);
router.use(formatTextRoutes);

export default router;
