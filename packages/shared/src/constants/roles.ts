export enum UserRole {
  ADMIN = 'ADMIN',
  POSTMASTER = 'POSTMASTER',
  POSTAL_STAFF = 'POSTAL_STAFF'
}

export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: [
    'manage_offices',
    'manage_users',
    'view_audit_logs',
    'configure_system',
    'view_reports',
    'view_dashboard'
  ],
  [UserRole.POSTMASTER]: [
    'view_dashboard',
    'manage_mail',
    'review_sorting',
    'assign_tasks',
    'manage_delivery',
    'verify_cash',
    'approve_reports',
    'view_reports',
    'view_enquiries',
    'manage_staff'
  ],
  [UserRole.POSTAL_STAFF]: [
    'view_assigned_tasks',
    'scan_mail',
    'perform_sorting',
    'update_delivery_status',
    'view_personal_history',
    'submit_operational_updates',
    'view_enquiries'
  ]
};
