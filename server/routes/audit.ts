import { Router, Response } from 'express';
import { Storage } from '../storage.ts';
import { AuthenticatedRequest, requireAdmin } from '../middleware/auth.ts';

const router = Router();
router.use(requireAdmin);

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 25));
  const actionFilter = (req.query.action as string) || 'ALL';
  const search = ((req.query.search as string) || '').trim().toLowerCase();

  let logs = Storage.getAuditLogs();

  // If ordinary admin, only allow seeing their own actions
  if (!isSuperAdmin) {
    logs = logs.filter((l) => l.actor_id === req.user!.id);
  }

  if (actionFilter !== 'ALL') {
    logs = logs.filter((l) => l.action === actionFilter);
  }

  if (search) {
    logs = logs.filter(
      (l) =>
        l.description.toLowerCase().includes(search) ||
        l.action.toLowerCase().includes(search) ||
        (l.actor_name && l.actor_name.toLowerCase().includes(search))
    );
  }

  const total = logs.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const items = logs.slice(startIndex, startIndex + limit);

  res.json({
    items,
    total,
    page,
    totalPages,
    isSuperAdmin,
  });
});

export default router;
