import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { User, Department, AuditLog } from '../shared-types.js';
import {
  Settings,
  Users,
  Building2,
  FileClock,
  ShieldCheck,
  RefreshCw,
  Search,
  Check,
  Plus,
  X,
  FileText
} from 'lucide-react';
import ApplicantAreaMap from './ApplicantAreaMap.js';

interface AdminPanelProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onRefreshUser: () => void;
}

export default function AdminPanel({ currentUser, onNavigate, onRefreshUser }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'depts' | 'logs' | 'applications'>('users');
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<User | null>(null);

  // Department creation form
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [submittingDept, setSubmittingDept] = useState(false);

  const loadAdminData = () => {
    setLoading(true);
    Promise.all([
      api.getUsers(),
      api.getDepartments(),
      api.getAuditLogs()
    ]).then(([usersRes, deptsRes, logsRes]) => {
      setUsers(usersRes.users);
      setDepartments(deptsRes.departments);
      setLogs(logsRes.auditLogs || []);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;
    loadAdminData();
  }, [currentUser]);

  // Update user role
  const handleUpdateUserRole = async (userId: string, newRole: string, newTrustScore?: number) => {
    try {
      await api.updateUserRole(userId, newRole, newTrustScore);
      alert('User settings updated successfully.');
      loadAdminData();
      onRefreshUser(); // in case we updated the currently logged in user
    } catch (e: any) {
      alert(e.message || 'Failed to update user');
    }
  };

  // Approve pending authority or verifier application
  const handleApproveApplicant = async (userId: string) => {
    try {
      await api.adminUpdateUser(userId, { isApproved: true });
      alert('Application verified and official credentials approved! Account is now active.');
      loadAdminData();
      onRefreshUser();
    } catch (e: any) {
      alert(e.message || 'Failed to approve application');
    }
  };

  // Create department
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptCode.trim()) return;

    setSubmittingDept(true);
    try {
      await api.createDepartment(newDeptName, newDeptCode);
      setNewDeptName('');
      setNewDeptCode('');
      loadAdminData();
      alert('Department created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create department');
    } finally {
      setSubmittingDept(false);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <Settings size={48} className="text-red-500 mx-auto animate-spin" />
        <h2 className="text-lg font-bold text-slate-900">Admin Clearance Required</h2>
        <p className="text-xs text-slate-500">Only authorized system administrators can access console parameters.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 font-sans space-y-6">
      
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="text-emerald-500" /> Administrative Command center
          </h1>
          <p className="text-xs text-slate-500 font-medium">Configure municipal departments, adjust trust parameters, and inspect chronological logs.</p>
        </div>
        
        <button
          onClick={loadAdminData}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-gray-200 rounded-xl text-slate-600 transition"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-px">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'users' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={14} /> User Identities ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('depts')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'depts' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 size={14} /> Departments ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'logs' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileClock size={14} /> Audit Ledger ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'applications' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={14} /> Pending Applications
          {users.filter(u => u.isApproved === false).length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-bold shrink-0">
              {users.filter(u => u.isApproved === false).length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="animate-spin text-emerald-500" size={32} />
          <p className="text-xs text-slate-400 font-light font-mono">Retrieving administrative database...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: USERS */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-[10px] uppercase font-bold text-slate-400 font-mono">
                    <th className="p-4">Evaluator Preset / User</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Current Role</th>
                    <th className="p-4 text-center">Trust Index</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{u.region}</div>
                      </td>
                      <td className="p-4 font-mono text-slate-500">{u.email}</td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          className="px-2 py-1 bg-white border border-gray-200 rounded font-semibold text-[11px] focus:outline-none"
                        >
                          <option value="citizen">Citizen</option>
                          <option value="verifier">Verifier</option>
                          <option value="authority">Authority Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={u.trustScore}
                            onChange={(e) => handleUpdateUserRole(u.id, u.role, Number(e.target.value))}
                            className="w-12 text-center border border-gray-200 rounded px-1 text-[11px] font-mono"
                          />
                          <span className="text-[10px] text-slate-400">/ 100</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          {u.points} Points
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: DEPARTMENTS */}
          {activeTab === 'depts' && (
            <div className="grid md:grid-cols-12 gap-8">
              
              {/* Depts index list */}
              <div className="md:col-span-8 bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-[10px] uppercase font-bold text-slate-400 font-mono">
                      <th className="p-4">Department Name</th>
                      <th className="p-4">Code</th>
                      <th className="p-4">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {departments.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-bold text-slate-900">{d.name}</td>
                        <td className="p-4 font-mono font-bold text-blue-600">{d.code}</td>
                        <td className="p-4 text-slate-400 font-mono">{new Date(d.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add department form */}
              <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm self-start space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Create New Department</h3>
                  <p className="text-[10px] text-slate-500 font-light mt-0.5">Introduce new administrative divisions</p>
                </div>

                <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Department Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Electric Power & Streetlights"
                      value={newDeptName}
                      onChange={e => setNewDeptName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Division Code (Short)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. JDVVN"
                      value={newDeptCode}
                      onChange={e => setNewDeptCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingDept}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow transition"
                  >
                    Create Division
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 3: AUDIT LEDGER LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 font-mono">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Action Event</th>
                    <th className="p-4">Operator user</th>
                    <th className="p-4">Target Dossier ID</th>
                    <th className="p-4">System Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs font-mono">
                  {logs.slice().reverse().map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/50 transition">
                      <td className="p-4 text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="text-emerald-400 font-bold">{log.action}</span>
                      </td>
                      <td className="p-4 text-[11px] text-slate-300">
                        {log.userId}
                      </td>
                      <td className="p-4 text-[11px] text-slate-300 font-bold text-blue-400">
                        {log.targetId || 'N/A'}
                      </td>
                      <td className="p-4 text-[11px] text-slate-400 truncate max-w-sm" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: PENDING APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="text-emerald-500" size={16} /> Review Pending Registrations
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Verify credentials, submitted authority licenses, and jurisdiction boundaries before activating official accounts.
                  </p>
                </div>
              </div>

              {users.filter(u => u.isApproved === false).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-150 shadow-sm space-y-3">
                  <div className="text-4xl">🎉</div>
                  <h4 className="text-xs font-extrabold text-slate-800">All Caught Up!</h4>
                  <p className="text-[10px] text-slate-400 font-light">There are no pending authority or verifier applications needing verification right now.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {users.filter(u => u.isApproved === false).map((applicant) => {
                    const isAuthority = applicant.role === 'authority';
                    return (
                      <div key={applicant.id} className="bg-white border border-gray-150 rounded-2xl shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-200 transition">
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border ${
                              isAuthority ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                              {isAuthority ? 'Authority Applicant' : 'Verifier Applicant'}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 font-bold">Applied: {applicant.appliedAt ? new Date(applicant.appliedAt).toLocaleDateString() : 'N/A'}</span>
                          </div>

                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900">{applicant.name}</h4>
                            <p className="text-[10px] font-mono text-slate-500">{applicant.email}</p>
                          </div>

                          {isAuthority ? (
                            <p className="text-[11px] text-slate-700">
                              <strong>Jurisdiction coverage:</strong> <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-800">{applicant.designatedAreaName || 'Area Map Drawn'}</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-700">
                              <strong>Target Authority:</strong> <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-800">
                                {users.find(u => u.id === applicant.verifierTargetAuthorityId)?.name || 'Raj Sharma'}
                              </span>
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedApplicant(applicant)}
                            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
                          >
                            Review Credentials & Map
                          </button>
                          <button
                            onClick={() => handleApproveApplicant(applicant.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow shadow-emerald-500/10"
                          >
                            Approve & Activate
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Applicant Detail Review Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[90vh] md:h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Review {selectedApplicant.role === 'authority' ? 'Authority' : 'Verifier'} Application</h3>
                <p className="text-[10px] text-slate-500">Applicant: {selectedApplicant.name} ({selectedApplicant.email})</p>
              </div>
              <button onClick={() => setSelectedApplicant(null)} className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-200/50 rounded"><X size={16} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2">
                <p className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Submitted Credentials & Licensing</p>
                <p className="font-bold text-slate-800 text-[11px]">Document Name: <span className="font-semibold text-slate-600">{selectedApplicant.submittedDocumentName || 'Aadhaar Card / ID Scan'}</span></p>
                <div className="bg-white p-3.5 rounded-xl border border-gray-150 text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                  {selectedApplicant.submittedDocumentText || 'No description provided.'}
                </div>
                {selectedApplicant.submittedDocumentUrl && (
                  <div className="pt-2">
                    <a
                      href={selectedApplicant.submittedDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 font-bold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      📄 View Submitted Scanned Document / Credentials Scan ↗
                    </a>
                  </div>
                )}
              </div>

              {selectedApplicant.role === 'authority' && (
                <div className="space-y-2">
                  <p className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Designated Coverage Map ({selectedApplicant.designatedAreaName || 'Designated Boundary'})</p>
                  
                  {/* Visual Map of authority jurisdiction */}
                  <div className="w-full h-[240px] rounded-2xl overflow-hidden border border-gray-150 shadow-inner">
                    <ApplicantAreaMap coordinates={selectedApplicant.designatedAreaCoordinates} />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-gray-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleApproveApplicant(selectedApplicant.id);
                  setSelectedApplicant(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow shadow-emerald-500/10"
              >
                Approve & Activate Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
