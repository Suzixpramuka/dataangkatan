import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, Role } from '../types.ts';
import { Storage } from '../storage.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'if26_super_secret_jwt_untirta_key_change_in_production';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Check cookie or Bearer token header
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ message: 'Akses ditolak. Silakan login terlebih dahulu.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    // Verify user still exists and not deleted
    const currentUser = Storage.findUserById(decoded.id);
    if (!currentUser || currentUser.deleted) {
      res.status(401).json({ message: 'Sesi akun tidak valid atau telah dinonaktifkan.' });
      return;
    }
    // Update role if changed
    req.user = {
      ...decoded,
      role: currentUser.role,
      nama: currentUser.nama,
      nim: currentUser.nim,
    };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Sesi telah kedaluwarsa atau tidak valid. Silakan login kembali.' });
  }
}

export function requireRole(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Autentikasi diperlukan.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: 'Akses terlarang. Anda tidak memiliki izin untuk melakukan tindakan ini.',
      });
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole(['ADMIN', 'SUPER_ADMIN']);
export const requireSuperAdmin = requireRole(['SUPER_ADMIN']);
