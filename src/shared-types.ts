export type UserRole = 'citizen' | 'verifier' | 'authority' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Plain-text or simple hash for demo purposes
  role: UserRole;
  region: string;
  trustScore: number; // default 50
  points: number;
  badges: string[]; // badge IDs
  departmentId?: string; // nullable, for authority staff
  createdAt: string;
  notificationPrefs: {
    email: boolean;
    push: boolean;
  };
  isApproved?: boolean; // default to true for citizen/admin, false for pending authority/verifier
  submittedDocumentName?: string;
  submittedDocumentText?: string;
  submittedDocumentUrl?: string;
  designatedAreaName?: string;
  designatedAreaCoordinates?: [number, number][]; // coordinates of designated area boundary
  verifierTargetAuthorityId?: string; // the authority user ID they applied under
  applicationNote?: string;
  appliedAt?: string;
}

export type IssueStatus =
  | 'Reported'
  | 'AI Reviewed'
  | 'Awaiting Verification'
  | 'Verified'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Closed'
  | 'Reopened';

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priorityScore: number; // 0-100
  status: IssueStatus;
  lat: number;
  lng: number;
  addressText: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedDepartmentId?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  isUrgent: boolean;
  duplicateOfIssueId?: string; // nullable
  duplicateCount: number;
  verificationCount: number;
  assignedOfficer?: string; // mapped from assignedStaffName for authority
  createdAt: string;
  updatedAt: string;
  progressPhotoUrl?: string;
  progressNotes?: string;
  resolvedAt?: string;
  closedAt?: string;
  resolutionProofUrl?: string; // uploaded media when resolved
  resolutionNotes?: string;
}

export interface Media {
  id: string;
  issueId: string;
  type: 'image' | 'video';
  url: string;
  uploadedBy: string; // userId
  createdAt: string;
}

export interface Verification {
  id: string;
  issueId: string;
  verifierId: string;
  verifierName: string;
  result: 'confirm' | 'reject';
  confidence: number; // 0-1
  evidenceMediaId?: string;
  verifierWeightAtTime: number;
  note?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  type: string;
  message: string;
  relatedIssueId?: string;
  read: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  contactEmail: string;
  serviceArea: string; // text description
  slaHours: number;
  staffIds: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  criteriaKey: string;
  icon: string; // Lucide icon name
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: string;
  afterJson?: string;
  createdAt: string;
}

export interface IssueStatusHistory {
  id: string;
  issueId: string;
  fromStatus: IssueStatus | 'None';
  toStatus: IssueStatus;
  changedBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  note: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  departments: Department[];
  issues: Issue[];
  media: Media[];
  verifications: Verification[];
  comments: Comment[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  issueStatusHistories: IssueStatusHistory[];
}

