import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserRepository } from '../repositories/userRepository';
import { AuditRepository } from '../repositories/auditRepository';
import { dbState, localStore } from '../config/database';
import { OfficeType } from '@postmate/shared';

export class AdminController {
  static async getOffices(req: AuthenticatedRequest, res: Response) {
    try {
      const offices = await UserRepository.getAllOffices();
      return res.json({ success: true, offices });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createOffice(req: AuthenticatedRequest, res: Response) {
    try {
      const { code, name, type, pincode, division, region, circle, contactNumber, address } = req.body;
      if (!name || !pincode || !type) {
        return res.status(400).json({ success: false, message: 'Office name, pincode and office type are required.' });
      }

      const offices = await UserRepository.getAllOffices();
      const normalizedCode = (code || `PO-${pincode}`).trim().toUpperCase();
      if (offices.some(o => o.code.toUpperCase() === normalizedCode)) {
        return res.status(409).json({ success: false, message: `Office code ${normalizedCode} already exists.` });
      }

      const office = await UserRepository.createOffice({
        code: normalizedCode,
        name: name.trim(),
        type: type as OfficeType,
        pincode: pincode.trim(),
        division: division || 'Chennai Central',
        region: region || 'Chennai Region',
        circle: circle || 'Tamil Nadu Circle',
        contactNumber: contactNumber || '',
        address: address || ''
      });

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'OFFICE_CREATED',
        module: 'ADMIN',
        entityId: office.id,
        details: `Created ${office.type} post office ${office.name} (${office.code}, PIN ${office.pincode})`,
        officeId: req.user?.officeId
      });

      return res.status(201).json({ success: true, office });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const users = await UserRepository.getAllStaff();
      return res.json({ success: true, users });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, employeeId, password, role, officeId, phone, email } = req.body;
      if (!name || !employeeId || !password || !role) {
        return res.status(400).json({ success: false, message: 'Name, employee ID, password and role are required.' });
      }

      const existing = await UserRepository.findByEmployeeId(employeeId);
      if (existing) {
        return res.status(409).json({ success: false, message: `Employee ID ${employeeId} already exists.` });
      }

      const targetOfficeId = officeId || req.user?.officeId || 'PO-600001';
      const office = await UserRepository.getOffice(targetOfficeId);
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await UserRepository.create({
        name: name.trim(),
        employeeId: employeeId.trim().toUpperCase(),
        email: email || `${employeeId.trim().toLowerCase()}@postmate.internal`,
        password: hashedPassword,
        role,
        officeId: targetOfficeId,
        officeName: office?.name || 'Anna Nagar Sub Post Office',
        officeType: office?.type || OfficeType.TOWN,
        phone
      });

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'USER_CREATED',
        module: 'ADMIN',
        entityId: user.id,
        details: `Created new user ${name} (${employeeId}) with role ${role} at ${office?.name || targetOfficeId}`,
        officeId: req.user?.officeId
      });

      return res.status(201).json({ success: true, user });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role, isActive, officeId } = req.body;
      const updates: Record<string, any> = {};
      if (role !== undefined) updates.role = role;
      if (isActive !== undefined) updates.isActive = Boolean(isActive);
      if (officeId !== undefined) {
        const office = await UserRepository.getOffice(officeId);
        if (!office) {
          return res.status(404).json({ success: false, message: 'Target post office not found.' });
        }
        updates.officeId = office.id;
        updates.officeName = office.name;
        updates.officeType = office.type;
      }

      const updated = await UserRepository.update(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'USER_UPDATED',
        module: 'ADMIN',
        entityId: id,
        details: `Updated permissions/status for ${updated.name} (${updated.employeeId}): ${JSON.stringify(updates)}`,
        officeId: req.user?.officeId
      });

      return res.json({ success: true, user: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const { module } = req.query;
      const logs = await AuditRepository.getAll(req.user?.officeId, module as string);
      return res.json({ success: true, logs });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getSystemStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const dbStats = {
        users: localStore.getCollection('users').length,
        mailRecords: localStore.getCollection('mailRecords').length,
        deliveryAssignments: localStore.getCollection('deliveryAssignments').length,
        cashTransactions: localStore.getCollection('cashTransactions').length,
        auditLogs: localStore.getCollection('auditLogs').length
      };

      return res.json({
        success: true,
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        storageType: dbState.isFallback
          ? 'Local Persistence Store (JSON Demo Fallback)'
          : 'MongoDB Atlas (Persistent Shared Store)',
        dbStats,
        lastBackup: new Date().toISOString(),
        serverTime: new Date().toISOString()
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
