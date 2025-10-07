export type UserRole = 'admin' | 'viewer';

export type UserTeam =
  | 'tech'
  | 'core'
  | 'resolutions'
  | 'c&s'
  | 'host'
  | 'data'
  | 'hr'
  | 'finance'
  | 'founders'
  | 'product'
  | 'marketing'
  | 'fleet ops'
  | 'verification'
  | 'guest'
  | 'flexplus'
  | 'na';

export type UserRegion = 'singapore' | 'australia' | 'global';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  teams: UserTeam[]; // Changed from team to teams (array)
  status: 'active' | 'inactive' | 'suspended';
  region: UserRegion;
  google_workspace_id?: string;
  google_org_unit?: string;
  intercom_id?: string;
  aircall_id?: string;
  slack_id?: string;
  profile_photo_url?: string;
  address?: string;
  country?: string;
  date_of_joining?: string;
  org_role?: string;
  manager_id?: number;
  phone_number?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  last_google_sync_at?: string;
  google_account_created_at?: string;
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
  role: UserRole;
  teams: UserTeam[]; // Changed from team to teams (array)
  region?: UserRegion;
  google_workspace_id?: string;
  intercom_id?: string;
  aircall_id?: string;
  slack_id?: string;
  address?: string;
  country?: string;
  date_of_joining?: string;
  org_role?: string;
  manager_id?: number;
  phone_number?: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  teams?: UserTeam[]; // Changed from team to teams (array)
  // status is NOT editable - only synced from Google Workspace
  region?: UserRegion;
  intercom_id?: string;
  aircall_id?: string;
  slack_id?: string;
  address?: string;
  country?: string;
  date_of_joining?: string;
  org_role?: string;
  manager_id?: number;
  phone_number?: string;
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
  creationTime?: string;
}

export interface ModuleAccess {
  module: string;
  access_level: 'read' | 'write' | 'admin';
}