import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createDropSchema,
  dropIdParamSchema,
  listDropsQuerySchema,
  updateDropSchema,
  updateDropStatusSchema,
} from './drops.schemas.js';
import * as drops from './drops.service.js';

const router = Router();

router.get('/', validate({ query: listDropsQuerySchema }), async (req, res) => {
  res.json(await drops.listDrops(req.valid.query));
});

router.get('/:idOrSlug', validate({ params: dropIdParamSchema }), async (req, res) => {
  res.json(await drops.getDrop(req.valid.params.idOrSlug));
});

router.post('/', requireAuth, requireRole('admin'), validate({ body: createDropSchema }), async (req, res) => {
  res.status(201).json(await drops.createDrop(req.valid.body));
});

router.patch(
  '/:idOrSlug',
  requireAuth,
  requireRole('admin'),
  validate({ params: dropIdParamSchema, body: updateDropSchema }),
  async (req, res) => {
    res.json(await drops.updateDrop(req.valid.params.idOrSlug, req.valid.body));
  },
);

router.patch(
  '/:idOrSlug/status',
  requireAuth,
  requireRole('admin'),
  validate({ params: dropIdParamSchema, body: updateDropStatusSchema }),
  async (req, res) => {
    res.json(await drops.updateDropStatus(req.valid.params.idOrSlug, req.valid.body.status));
  },
);

router.post('/:idOrSlug/waitlist', requireAuth, validate({ params: dropIdParamSchema }), async (req, res) => {
  res.status(201).json(await drops.joinWaitlist(req.valid.params.idOrSlug, req.user.id));
});

router.delete('/:idOrSlug/waitlist', requireAuth, validate({ params: dropIdParamSchema }), async (req, res) => {
  await drops.leaveWaitlist(req.valid.params.idOrSlug, req.user.id);
  res.status(204).end();
});

export default router;
