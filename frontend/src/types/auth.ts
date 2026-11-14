export type RoleType =
  | 'SUPER_ADMIN'
  | 'HEAD_OFFICE_ADMIN'
  | 'REGIONAL_MANAGER'
  | 'BRANCH_MANAGER'
  | 'BANK_EMPLOYEE'
  | 'CASHIER'
  | 'LOAN_OFFICER'
  | 'AUDITOR'
  | 'CUSTOMER';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  employeeId?: string;
  designation?: string;
  active: boolean;
  lastLogin?: string;
  branchId?: number;
  branchCode?: string;
  branchName?: string;
  isHeadOffice?: boolean;
  roles: RoleType[];
  permissions: string[];
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  username: string;
  email: string;
  fullName: string;
  roles: RoleType[];
  permissions: string[];
  branchId?: number;
  branchCode?: string;
  branchName?: string;
  isHeadOffice?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string> | null;
  timestamp: string;
}
