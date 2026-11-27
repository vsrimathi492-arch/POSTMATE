import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository';
import { UserRole } from '@postmate/shared';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    employeeId: string;
    name: string;
    role: UserRole;
    officeId: string;
    officeName?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'postmate_super_secret_jwt_key_2026_operations_secure!';

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await UserRepository.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid or inactive user session.' });
    }

    req.user = {
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      officeId: user.officeId,
      officeName: user.officeName
    };

    next();
  } catch (err: any) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
}
