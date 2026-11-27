import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuditRepository } from '../repositories/auditRepository';

const JWT_SECRET = process.env.JWT_SECRET || 'postmate_super_secret_jwt_key_2026_operations_secure!';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { employeeId, password } = req.body;
      if (!employeeId || !password) {
        return res.status(400).json({ success: false, message: 'Employee ID and password are required.' });
      }

      const user = await UserRepository.findByEmployeeId(employeeId);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid employee ID or password.' });
      }

      // Support hashed password or plain text match for dummy dev accounts
      let isMatch = false;
      if (user.password.startsWith('$2')) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        isMatch = user.password === password;
      }

      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid employee ID or password.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'This employee account is deactivated.' });
      }

      const office = await UserRepository.getOffice(user.officeId);

      const token = jwt.sign(
        {
          id: user.id,
          employeeId: user.employeeId,
          role: user.role,
          officeId: user.officeId
        },
        JWT_SECRET,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
      );

      const { password: _, ...safeUser } = user;

      await AuditRepository.log({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'USER_LOGIN',
        module: 'AUTH',
        details: `Employee ${user.employeeId} logged in successfully`,
        officeId: user.officeId
      });

      return res.json({
        success: true,
        token,
        user: safeUser,
        office: office || {
          id: user.officeId,
          code: 'PO-600001',
          name: user.officeName || 'Anna Nagar Sub Post Office',
          type: 'Town',
          pincode: '600040'
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error during login.' });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserRepository.findById(req.user!.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      const office = await UserRepository.getOffice(user.officeId);
      const { password, ...safeUser } = user;
      return res.json({ success: true, user: safeUser, office });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
