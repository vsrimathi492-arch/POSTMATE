import { dbState, localStore } from '../config/database';
import { IUser, IPostOffice, UserRole } from '@postmate/shared';
import { v4 as uuidv4 } from 'uuid';

export class UserRepository {
  static async findByEmployeeId(employeeId: string): Promise<any | null> {
    const users = localStore.getCollection('users');
    return users.find(u => u.employeeId.toLowerCase() === employeeId.toLowerCase()) || null;
  }

  static async findById(id: string): Promise<any | null> {
    const users = localStore.getCollection('users');
    return users.find(u => u.id === id) || null;
  }

  static async getAllStaff(officeId?: string): Promise<any[]> {
    const users = localStore.getCollection('users');
    let filtered = users;
    if (officeId) {
      filtered = filtered.filter(u => u.officeId === officeId);
    }
    // Return sanitized without password
    return filtered.map(({ password, ...u }) => u);
  }

  static async create(user: any): Promise<any> {
    const users = localStore.getCollection('users');
    const newUser = {
      id: user.id || uuidv4(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...user
    };
    users.push(newUser);
    localStore.setCollection('users', users);
    const { password, ...safe } = newUser;
    return safe;
  }

  static async update(id: string, updates: Partial<IUser>): Promise<any | null> {
    const users = localStore.getCollection('users');
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
    localStore.setCollection('users', users);
    const { password, ...safe } = users[idx];
    return safe;
  }

  static async getOffice(officeId: string): Promise<IPostOffice | null> {
    const offices = localStore.getCollection('offices');
    return offices.find(o => o.id === officeId || o.code === officeId) || null;
  }

  static async getAllOffices(): Promise<IPostOffice[]> {
    return localStore.getCollection('offices');
  }

  static async createOffice(office: Partial<IPostOffice>): Promise<IPostOffice> {
    const offices: IPostOffice[] = localStore.getCollection('offices');
    const code = (office.code || `PO-${office.pincode || Math.floor(600000 + Math.random() * 99999)}`).trim().toUpperCase();
    const newOffice: IPostOffice = {
      id: office.id || code,
      code,
      name: office.name || 'New Post Office',
      type: office.type!,
      pincode: office.pincode || '600040',
      division: office.division || 'Chennai Central',
      region: office.region || 'Chennai Region',
      circle: office.circle || 'Tamil Nadu Circle',
      contactNumber: office.contactNumber || '',
      address: office.address || '',
      isActive: true
    };
    offices.push(newOffice);
    localStore.setCollection('offices', offices);
    return newOffice;
  }
}
