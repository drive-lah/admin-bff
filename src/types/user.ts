export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'viewer';
  team: string;
  status: 'active' | 'inactive' | 'suspended';
  google_workspace_id?: string;
  google_org_unit?: string;
  google_groups?: string[]; // JSON array stored as string in DB
  intercom_id?: string;
  aircall_id?: string;
  slack_id?: string;
  profile_photo_url?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  last_google_sync_at?: string;
}

export interface UserPermission {
  id: number;
  user_id: number;
  module: string; // 'finance', 'ai-agents', 'tech', etc.
  access_level: 'read' | 'write' | 'admin';
  granted_by: number; // user_id who granted this permission
  granted_at: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'viewer';
  team: string;
  google_workspace_id?: string;
  intercom_id?: string;
  aircall_id?: string;
  slack_id?: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: 'admin' | 'manager' | 'viewer';
  team?: string;
  status?: 'active' | 'inactive' | 'suspended';
  intercom_id?: string;
  aircall_id?: string;
  slack_id?: string;
}

export interface UserWithPermissions extends User {
  permissions: UserPermission[];
}

// Google Workspace types
export interface GoogleWorkspaceUser {
  id: string;
  primaryEmail: string;
  name: {
    fullName: string;
    givenName: string;
    familyName: string;
  };
  suspended: boolean;
  orgUnitPath: string;
  thumbnailPhotoUrl?: string;
  lastLoginTime?: string;
}

export interface ModuleAccess {
  module: string;
  access_level: 'read' | 'write' | 'admin';
}