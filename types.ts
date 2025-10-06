export enum Role {
  ADMIN = 'admin',
  REQUESTOR = 'requestor',
  VERIFIER = 'verifier',
  APPROVER = 'approver',
}

export enum Status {
  PENDING_VERIFICATION = 'Pending Verification',
  PENDING_APPROVAL = 'Pending Approval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  PAID = 'Paid',
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'disabled';
}

export interface Project {
  id: string;
  name: string;
}

export interface Site {
  id: string;
  name: string;
}


export interface Subcategory {
  id: string;
  name: string;
  attachmentRequired: boolean;
}

export interface Category {
  id:string;
  name: string;
  attachmentRequired: boolean;
  autoApproveAmount: number;
  subcategories?: Subcategory[];
}

export interface HistoryItem {
  actorId: string;
  actorName: string;
  action: string;
  timestamp: string; // ISO string
  comment?: string;
}

export interface Expense {
  id: string;
  referenceNumber: string;
  requestorId: string;
  requestorName: string;
  categoryId: string;
  subcategoryId?: string;
  amount: number;
  description: string;
  projectId: string;
  siteId: string;
  submittedAt: string; // ISO string
  status: Status;
  isHighPriority?: boolean;
  attachment_path: string | null;
  subcategory_attachment_path: string | null;
  payment_attachment_path: string | null;
  paidAt?: string; // ISO string
  paidBy?: string; // user id
  history: HistoryItem[];
  deletedAt?: string; // ISO string
  deletedBy?: string; // user id
  statusBeforeDelete?: Status;
}

export interface AuditLogItem {
  id: string;
  timestamp: string; // ISO string
  actorId: string;
  actorName: string;
  action: string;
  details: string;
}

// This type is no longer needed with Supabase, but keeping it for reference if needed elsewhere.
export interface AvailableBackups {
  daily: string[];
  mirror: string[];
}