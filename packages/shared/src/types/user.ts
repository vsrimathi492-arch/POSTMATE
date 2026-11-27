import { UserRole } from '../constants/roles';
import { OfficeType } from '../constants/statuses';

export interface IUser {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: UserRole;
  officeId: string;
  officeName: string;
  officeType: string;
  phone?: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  employeeId: string;
  role: UserRole;
  assignedTasksCount: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  isAvailable: boolean;
}

export interface IPostOffice {
  id: string;
  code: string;
  name: string;
  type: OfficeType;
  pincode: string;
  division: string;
  region: string;
  circle: string;
  contactNumber?: string;
  address: string;
  isActive: boolean;
}

export interface LoginDto {
  employeeId: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: IUser;
  office: IPostOffice;
}
