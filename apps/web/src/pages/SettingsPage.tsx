import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { OfficeType, UserRole } from '@postmate/shared';
import {
  Settings,
  Globe,
  Building2,
  Shield,
  FileText,
  Database,
  RefreshCw,
  Users,
  PlusCircle
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, office } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const canViewLogs = isAdmin || user?.role === UserRole.POSTMASTER;

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  // Admin Create User form
  const [newUserName, setNewUserName] = useState('');
  const [newEmpId, setNewEmpId] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.POSTAL_STAFF);
  const [newUserOfficeId, setNewUserOfficeId] = useState('PO-600001');

  // Admin Create Office form
  const [newOfficeName, setNewOfficeName] = useState('');
  const [newOfficePincode, setNewOfficePincode] = useState('');
  const [newOfficeType, setNewOfficeType] = useState<OfficeType>(OfficeType.VILLAGE);

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statusRes, offRes] = await Promise.all([
        api.getSystemStatus(),
        api.getOffices()
      ]);

      if (statusRes.success) setSystemStatus(statusRes);
      if (offRes.success) setOffices(offRes.offices || []);

      if (canViewLogs) {
        const [logsRes, usersRes] = await Promise.all([
          api.getAuditLogs(),
          api.getUsers()
        ]);
        if (logsRes.success) setAuditLogs(logsRes.logs || []);
        if (usersRes.success) setUsersList(usersRes.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg(null);
    const res = await api.createUser({
      name: newUserName,
      employeeId: newEmpId,
      password: newUserPassword,
      role: newUserRole,
      officeId: newUserOfficeId
    });
    if (res.success) {
      setAdminMsg(`Created employee ${res.user.name} (${res.user.employeeId})`);
      setNewUserName('');
      setNewEmpId('');
      setNewUserPassword('');
      loadAdminData();
    } else {
      setAdminMsg(res.message || 'Failed to create user.');
    }
  };

  const handleToggleUser = async (u: any) => {
    const res = await api.updateUser(u.id, { isActive: !u.isActive });
    if (res.success) loadAdminData();
  };

  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg(null);
    const res = await api.createOffice({
      name: newOfficeName,
      pincode: newOfficePincode,
      type: newOfficeType
    });
    if (res.success) {
      setAdminMsg(`Created ${res.office.type} office: ${res.office.name}`);
      setNewOfficeName('');
      setNewOfficePincode('');
      loadAdminData();
    } else {
      setAdminMsg(res.message || 'Failed to create post office.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.nav.settings}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Post office parameters, bilingual localization, access control roles, and complete system audit logs
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Office Profile & Localization */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Post Office Profile & Classification</h3>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Office Name:</span>
              <span className="font-bold text-slate-900">{office?.name || 'Anna Nagar Sub Post Office'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Office Code / PIN:</span>
              <span className="font-mono font-bold text-blue-700">{office?.code || 'PO-600001'} (600040)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Office Classification:</span>
              <span className="font-semibold text-slate-800">{office?.type || 'Town'} Office</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Postal Division:</span>
              <span className="font-semibold text-slate-800">{office?.division || 'Chennai Central Division'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Postal Circle:</span>
              <span className="font-semibold text-slate-800">Tamil Nadu Circle</span>
            </div>
          </div>

          {/* Language Switch */}
          <div className="pt-3 border-t border-slate-100">
            <span className="font-bold text-slate-800 block mb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Language & Localization</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`p-2.5 rounded-xl border text-center font-bold transition ${
                  language === 'en'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                English (Default)
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`p-2.5 rounded-xl border text-center font-bold transition ${
                  language === 'ta'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                தமிழ் (Tamil)
              </button>
            </div>
          </div>
        </div>

        {/* User Role & System Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">Active Session & User Access</h3>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Logged In Employee:</span>
              <span className="font-bold text-slate-900">{user?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Employee ID:</span>
              <span className="font-mono font-bold text-slate-800">{user?.employeeId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Assigned Role:</span>
              <span className="font-bold text-blue-700">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Architecture Status */}
          {systemStatus && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Central Database Architecture</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {systemStatus.storageType}
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block">Mail Central Records</span>
                  <span className="font-bold text-slate-900">{systemStatus.dbStats.mailRecords} records</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block">Audit Log Trail</span>
                  <span className="font-bold text-slate-900">{systemStatus.dbStats.auditLogs} events</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Offices & User Management (Admin / Postmaster) */}
      {adminMsg && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
          {adminMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Configured Post Offices ({offices.length})</span>
            </h3>
            <span className="text-[10px] text-slate-500">Village • Town • City • Head</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
            {offices.map((o) => (
              <div key={o.id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{o.name}</p>
                  <p className="text-[11px] text-slate-500">{o.code} • PIN {o.pincode} • {o.division}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                  {o.type}
                </span>
              </div>
            ))}
          </div>

          {isAdmin && (
            <form onSubmit={handleCreateOffice} className="pt-3 border-t border-slate-100 space-y-2">
              <p className="font-bold text-slate-800 flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Add Post Office (Admin)</span>
              </p>
              <input
                type="text"
                required
                placeholder="Post Office Name"
                value={newOfficeName}
                onChange={(e) => setNewOfficeName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="PIN (e.g. 600040)"
                  value={newOfficePincode}
                  onChange={(e) => setNewOfficePincode(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                />
                <select
                  value={newOfficeType}
                  onChange={(e) => setNewOfficeType(e.target.value as OfficeType)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value={OfficeType.VILLAGE}>Village Office</option>
                  <option value={OfficeType.TOWN}>Town Office</option>
                  <option value={OfficeType.CITY}>City Office</option>
                  <option value={OfficeType.HEAD}>Head Post Office</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold"
              >
                Create Post Office
              </button>
            </form>
          )}
        </div>

        {canViewLogs && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Authorized Users & Role Permissions ({usersList.length})</span>
              </h3>
            </div>

            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {usersList.map((u) => (
                <div key={u.id} className="py-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">{u.name} <span className="font-mono text-slate-500">({u.employeeId})</span></p>
                    <p className="text-[11px] text-slate-500">{u.role} • {u.officeName}</p>
                  </div>
                  {isAdmin && u.id !== user?.id && (
                    <button
                      type="button"
                      onClick={() => handleToggleUser(u)}
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Disabled'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isAdmin && (
              <form onSubmit={handleCreateUser} className="pt-3 border-t border-slate-100 space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Create Authorized User (Admin)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Employee ID"
                    value={newEmpId}
                    onChange={(e) => setNewEmpId(e.target.value.toUpperCase())}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 font-mono uppercase"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value={UserRole.POSTAL_STAFF}>Postal Staff</option>
                    <option value={UserRole.POSTMASTER}>Postmaster</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                  <select
                    value={newUserOfficeId}
                    onChange={(e) => setNewUserOfficeId(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    {offices.map(o => (
                      <option key={o.id} value={o.id}>{o.code}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Create User Account
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Audit Logs Table */}
      {canViewLogs && (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <span className="font-bold uppercase tracking-wider text-slate-800">
              Immutable Operations Audit Log ({auditLogs.length} events)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Security & Operational Verification Trail</span>
        </div>

        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold sticky top-0">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Module</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition text-[11px]">
                  <td className="py-2 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="py-2 px-4 whitespace-nowrap text-slate-600">
                    {log.userRole}
                  </td>
                  <td className="py-2 px-4 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-slate-100 text-slate-700">
                      {log.module}
                    </span>
                  </td>
                  <td className="py-2 px-4 font-bold text-blue-700 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2 px-4 text-slate-600">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};
