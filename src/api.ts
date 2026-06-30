import { User, Issue, Comment, Notification, Department, Badge, AuditLog, IssueStatusHistory, IssueStatus } from './shared-types.js';

const API_BASE = '/api';

function getHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const cachedUser = localStorage.getItem('ch_user');
  if (cachedUser) {
    try {
      const user = JSON.parse(cachedUser) as User;
      headers['Authorization'] = `Bearer ${user.id}`;
    } catch (e) {
      console.error('Error parsing cached user', e);
    }
  }
  return headers;
}

export const api = {
  // Auth
  async signup(data: any): Promise<{ user: User }> {
    const res = await fetch(`/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Signup failed');
    }
    return res.json();
  },

  async login(data: any): Promise<{ user: User }> {
    const res = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async firebaseLogin(data: any): Promise<{ user: User }> {
    const res = await fetch(`/api/auth/firebase-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Firebase Login failed');
    }
    return res.json();
  },

  async forgotPassword(email: string): Promise<any> {
    const res = await fetch(`/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`/api/users/me`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Session expired');
    return res.json();
  },

  async updateMe(data: any): Promise<{ user: User }> {
    const res = await fetch(`/api/users/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update profile');
    }
    return res.json();
  },

  async getUser(id: string): Promise<{ user: Partial<User> }> {
    const res = await fetch(`/api/users/${id}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Issues
  async getIssues(filters: Record<string, any> = {}): Promise<{ issues: Issue[] }> {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        query.append(key, String(val));
      }
    });
    const res = await fetch(`/api/issues?${query.toString()}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getIssue(id: string): Promise<{
    issue: Issue;
    media: any[];
    verifications: any[];
    comments: any[];
    history: any[];
  }> {
    const res = await fetch(`/api/issues/${id}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Issue not found');
    return res.json();
  },

  async createIssue(data: any): Promise<{
    issue: Issue;
    aiAnalysis: {
      category: string;
      severity: string;
      priorityScore: number;
      isUrgent: boolean;
      isDuplicate: boolean;
      duplicateCandidates: any[];
    };
  }> {
    const res = await fetch(`/api/issues`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit issue');
    }
    return res.json();
  },

  async attachMedia(issueId: string, url: string, type = 'image'): Promise<any> {
    const res = await fetch(`/api/issues/${issueId}/media`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url, type })
    });
    return res.json();
  },

  async verifyIssue(issueId: string, data: any): Promise<any> {
    const res = await fetch(`/api/issues/${issueId}/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to verify');
    }
    return res.json();
  },

  async assignIssue(issueId: string, data: any): Promise<any> {
    const res = await fetch(`/api/issues/${issueId}/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to assign');
    }
    return res.json();
  },

  async updateIssueStatus(issueId: string, statusOrData: any, note?: string): Promise<any> {
    const payload = typeof statusOrData === 'string'
      ? { status: statusOrData, note }
      : statusOrData;
    const res = await fetch(`/api/issues/${issueId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update status');
    }
    return res.json();
  },

  async confirmResolution(issueId: string): Promise<any> {
    const res = await fetch(`/api/issues/${issueId}/confirm-resolution`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to confirm resolution');
    }
    return res.json();
  },

  async reopenIssue(issueId: string, note: string): Promise<any> {
    const res = await fetch(`/api/issues/${issueId}/reopen`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ note })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reopen issue');
    }
    return res.json();
  },

  // Comments
  async getComments(issueId: string): Promise<{ comments: Comment[] }> {
    const res = await fetch(`/api/issues/${issueId}/comments`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async addComment(issueId: string, content: string, attachmentUrl?: string): Promise<{ comment: Comment }> {
    const res = await fetch(`/api/issues/${issueId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content, attachmentUrl })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add comment');
    }
    return res.json();
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: Notification[] }> {
    const res = await fetch(`/api/notifications`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async readNotification(id: string): Promise<{ notification: Notification }> {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return res.json();
  },

  // Departments
  async getDepartments(): Promise<{ departments: Department[] }> {
    const res = await fetch(`/api/departments`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async updateDepartment(id: string, data: any): Promise<{ department: Department }> {
    const res = await fetch(`/api/departments/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Analytics
  async getAnalyticsSummary(): Promise<any> {
    const res = await fetch(`/api/analytics/summary`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getAnalyticsHotspots(): Promise<any> {
    const res = await fetch(`/api/analytics/hotspots`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Leaderboard
  async getLeaderboard(): Promise<any> {
    const res = await fetch(`/api/leaderboard`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Admin
  async getAdminUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`/api/admin/users`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async adminUpdateUser(id: string, data: any): Promise<any> {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getAuditLogs(): Promise<{ auditLogs: AuditLog[] }> {
    const res = await fetch(`/api/admin/audit-log`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Mapped/Convenience Helpers to resolve compilation mismatches
  async getProfile(userId: string): Promise<{ user: User }> {
    const res = await fetch(`/api/users/${userId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to retrieve user profile');
    return res.json();
  },

  async getUsers(): Promise<{ users: User[] }> {
    return this.getAdminUsers();
  },

  async getPublicAuthorities(): Promise<{ authorities: any[] }> {
    const res = await fetch(`/api/public/authorities`);
    if (!res.ok) throw new Error('Failed to fetch authorities list');
    return res.json();
  },

  async approveVerifier(userId: string, note?: string): Promise<any> {
    const res = await fetch(`/api/authority/approve-verifier/${userId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ note })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to approve verifier');
    }
    return res.json();
  },

  async updateUserRole(userId: string, role: string, trustScore?: number): Promise<any> {
    return this.adminUpdateUser(userId, { role, trustScore });
  },

  async createDepartment(name: string, code: string): Promise<any> {
    const res = await fetch(`/api/departments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, code })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create department');
    }
    return res.json();
  },

  async resolveIssue(issueId: string, data: { resolutionNotes: string; resolutionProofUrl: string }): Promise<any> {
    return this.updateIssueStatus(issueId, {
      status: 'Closed',
      note: 'Issue resolved & closed by Authority.',
      resolutionProofUrl: data.resolutionProofUrl,
      resolutionNotes: data.resolutionNotes
    });
  },

  async verifyProgress(issueId: string, data: { progressPhotoUrl: string; notes?: string }): Promise<any> {
    const res = await fetch(`/api/issues/${issueId}/verify-progress`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update progress photo');
    }
    return res.json();
  }
};
