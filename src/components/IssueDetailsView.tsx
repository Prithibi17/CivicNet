import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Issue, Comment, Verification, IssueStatusHistory, User } from '../shared-types.js';
import MapComponent from './MapComponent.js';
import {
  Calendar,
  User as UserIcon,
  MapPin,
  CheckCircle,
  Clock,
  ShieldCheck,
  Brain,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Send,
  XCircle,
  Award,
  Camera
} from 'lucide-react';

interface IssueDetailsViewProps {
  issueId: string;
  currentUser: User | null;
  onNavigate: (view: string) => void;
}

export default function IssueDetailsView({ issueId, currentUser, onNavigate }: IssueDetailsViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Loaded States
  const [issue, setIssue] = useState<Issue | null>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<IssueStatusHistory[]>([]);

  // Action Form States
  const [commentText, setCommentText] = useState('');
  const [reopenNote, setReopenNote] = useState('');
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Worksite verification state
  const [worksitePhotoUrl, setWorksitePhotoUrl] = useState('');
  const [worksiteNotes, setWorksiteNotes] = useState('');
  const [submittingWorksite, setSubmittingWorksite] = useState(false);

  const handleUploadWorksitePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worksitePhotoUrl) {
      alert('Photographic validation is mandatory.');
      return;
    }
    setSubmittingWorksite(true);
    try {
      await api.verifyProgress(issueId, {
        progressPhotoUrl: worksitePhotoUrl,
        notes: worksiteNotes
      });
      alert('Active worksite verified! Status transitioned to "In Progress" (in process).');
      setWorksitePhotoUrl('');
      setWorksiteNotes('');
      loadDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to submit worksite photo');
    } finally {
      setSubmittingWorksite(false);
    }
  };

  // Load Issue Details
  const loadDetails = () => {
    setLoading(true);
    api.getIssue(issueId)
      .then(res => {
        setIssue(res.issue);
        setMedia(res.media);
        setVerifications(res.verifications);
        setComments(res.comments);
        setHistory(res.history);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError('Issue details could not be loaded.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDetails();
  }, [issueId]);

  // Submit new comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;

    setSubmittingComment(true);
    try {
      const res = await api.addComment(issueId, commentText);
      setComments([...comments, res.comment]);
      setCommentText('');
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Confirm Fixed (Citizen)
  const handleConfirmFixed = async () => {
    if (!window.confirm('Are you sure this issue is resolved to your satisfaction?')) return;
    setSubmittingAction(true);
    try {
      const res = await api.confirmResolution(issueId);
      setIssue(res.issue);
      // Reload history
      const nextRes = await api.getIssue(issueId);
      setHistory(nextRes.history);
      alert('Thank you for confirming! Your contribution points and trust score have been rewarded.');
    } catch (err: any) {
      alert(err.message || 'Failed to confirm resolution.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Reopen Issue (Citizen)
  const handleReopenIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenNote.trim()) return;

    setSubmittingAction(true);
    try {
      const res = await api.reopenIssue(issueId, reopenNote);
      setIssue(res.issue);
      setShowReopenForm(false);
      setReopenNote('');
      // Reload details for clean updates
      loadDetails();
      alert('Issue reopened successfully and queued back into verification.');
    } catch (err: any) {
      alert(err.message || 'Failed to reopen issue');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="animate-spin text-emerald-500" size={36} />
        <p className="text-sm text-slate-500 font-light">Loading full issue dossier...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="text-red-500 mx-auto" size={48} />
        <h2 className="text-lg font-bold text-slate-900">Failed to load dossier</h2>
        <p className="text-xs text-slate-500">{error || 'Please try again later'}</p>
        <button
          onClick={() => onNavigate('citizen-dashboard')}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Calculate Verification Progress
  let positiveWeight = 0;
  let negativeWeight = 0;
  verifications.forEach(v => {
    const w = v.confidence * v.verifierWeightAtTime;
    if (v.result === 'confirm') positiveWeight += w;
    else negativeWeight += w;
  });

  // Ordered Timeline Steps
  const TIMELINE_STEPS: { name: string; desc: string; key: typeof issue.status }[] = [
    { name: 'Reported', desc: 'Citizen submitted report', key: 'Reported' },
    { name: 'AI Reviewed', desc: 'Heuristics complete', key: 'AI Reviewed' },
    { name: 'Awaiting Verification', desc: 'Field review needed', key: 'Awaiting Verification' },
    { name: 'Verified', desc: 'Verification complete', key: 'Verified' },
    { name: 'assigned in process', desc: 'Dispatched to crew', key: 'Assigned' },
    { name: 'in process', desc: 'Crews active on-site', key: 'In Progress' },
    { name: 'Closed', desc: 'Case resolved & closed', key: 'Closed' }
  ];

  const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.key === (issue.status === 'Resolved' ? 'Closed' : issue.status));

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 font-sans grid lg:grid-cols-12 gap-8">
      
      {/* LEFT COLUMN: Dossier Body */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Banner header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-700">
              #{issue.id}
            </span>
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              issue.status === 'Closed'
                ? 'bg-slate-100 text-slate-800 border border-slate-200'
                : issue.status === 'Resolved'
                ? 'bg-emerald-100 text-emerald-800'
                : issue.status === 'In Progress'
                ? 'bg-blue-150 text-blue-800 animate-pulse'
                : issue.status === 'Assigned'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {issue.status === 'Assigned' ? 'assigned in process' : issue.status === 'In Progress' ? 'in process' : issue.status}
            </span>
            {issue.isUrgent && (
              <span className="text-xs font-bold bg-red-100 border border-red-200 px-2 py-1 rounded text-red-700 flex items-center gap-1 animate-bounce">
                <AlertTriangle size={12} className="text-red-500" /> Urgent
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {issue.title}
          </h1>

          <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs text-slate-500 font-light">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" />
              <span>Reported {new Date(issue.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserIcon size={14} className="text-gray-400" />
              <span>By {issue.createdBy.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-gray-400" />
              <span className="truncate max-w-[250px]">{issue.addressText}</span>
            </div>
          </div>
        </div>

        {/* Issue photos */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Media Attachments</h2>
          {media.length === 0 ? (
            <div className="p-8 bg-slate-50 border border-dashed border-gray-200 rounded-2xl text-center text-xs text-slate-400">
              No photo evidence was uploaded for this report.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {media.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-video rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:scale-[1.02] transition block"
                >
                  <img src={item.url} alt="Evidence" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Detailed description */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Detailed Incident Report</h2>
          <p className="text-sm text-slate-700 leading-relaxed font-light whitespace-pre-line">
            {issue.description}
          </p>
        </div>

        {/* Resolution Proof Card (If status is Resolved or Closed) */}
        {(issue.status === 'Resolved' || issue.status === 'Closed') && (
          <div className="bg-teal-50/50 border border-teal-100 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-teal-900 border-b border-teal-100/50 pb-3">
              <CheckCircle size={20} className="text-teal-600 shrink-0" />
              <div>
                <h2 className="text-sm font-bold">Official Resolution Dossier</h2>
                <p className="text-[10px] text-teal-600 mt-0.5">Uploaded by assigned officer upon fix completion</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {issue.resolutionProofUrl && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold text-teal-700">Proof-of-Completion Photo</p>
                  <div className="aspect-video rounded-xl overflow-hidden border border-teal-200/50 shadow">
                    <img src={issue.resolutionProofUrl} alt="Resolution" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              <div className="space-y-2.5">
                <p className="text-[10px] uppercase font-bold text-teal-700">Official Officer Notes</p>
                <p className="text-xs text-teal-950 font-medium bg-white p-3 rounded-xl border border-teal-100/50 leading-relaxed shadow-sm">
                  {issue.resolutionNotes || 'No official details provided.'}
                </p>
                <div className="text-[10px] text-teal-600 font-mono space-y-0.5">
                  <p>Resolved At: {issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleString() : 'N/A'}</p>
                  {issue.closedAt && <p>Closed At: {new Date(issue.closedAt).toLocaleString()}</p>}
                </div>
              </div>
            </div>

            {/* Citizen Resolution Action (Confirm Fixed / Reopen) */}
            {currentUser && currentUser.id === issue.createdBy.id && issue.status === 'Resolved' && (
              <div className="pt-4 border-t border-teal-100/50 flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-teal-900">Are you satisfied with this fix?</p>
                  <p className="text-[10px] text-teal-600">Please confirm to close the report or reopen with a note.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmFixed}
                    disabled={submittingAction}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <CheckCircle size={14} /> Yes, Confirm Fixed
                  </button>
                  <button
                    onClick={() => setShowReopenForm(!showReopenForm)}
                    disabled={submittingAction}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <XCircle size={14} /> No, Reopen Issue
                  </button>
                </div>
              </div>
            )}

            {showReopenForm && (
              <form onSubmit={handleReopenIssue} className="pt-4 border-t border-teal-100/50 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Why are you rejecting this resolution?</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide specific notes why the repair is incomplete or sub-par (e.g. pothole only half filled)."
                    value={reopenNote}
                    onChange={e => setReopenNote(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReopenForm(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs"
                  >
                    Confirm Reopen
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Public Timeline map location */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Georeferenced Location</h2>
          <div className="h-[280px] shadow-sm rounded-2xl border border-gray-100 overflow-hidden relative">
            <MapComponent center={[issue.lat, issue.lng]} issues={[issue]} />
          </div>
        </div>

        {/* Status Timeline History */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Incident Lifecycle History</h2>
          <div className="relative border-l-2 border-slate-100 pl-6 ml-2 space-y-6">
            {history.map((hist) => (
              <div key={hist.id} className="relative">
                <span className="absolute -left-[31px] top-1 bg-white border-2 border-emerald-500 w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">{hist.toStatus}</p>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(hist.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-light">{hist.note}</p>
                  <p className="text-[10px] text-slate-400 font-medium">By {hist.changedBy.name} ({hist.changedBy.role})</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comments Feed Section */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Comments feed ({comments.length})</h2>

          <div className="space-y-4">
            {comments.map((comm) => (
              <div key={comm.id} className="bg-white p-4 rounded-xl border border-gray-150 flex gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center font-bold text-slate-700 uppercase shrink-0">
                  {comm.authorName[0]}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{comm.authorName}</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-2 uppercase font-semibold">
                        {comm.authorRole}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {new Date(comm.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-light">{comm.content}</p>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-xs text-slate-400 font-light text-center py-6">No discussions yet. Ask a question or post an update.</p>
            )}
          </div>

          {currentUser ? (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Write a message..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={submittingComment}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow"
              >
                <Send size={14} /> Send
              </button>
            </form>
          ) : (
            <p className="text-center text-xs text-slate-400 font-light pt-2">Sign in to join the conversation.</p>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: AI Breakdown & Verification Card */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Status Timeline Progress Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Report Status Pipeline</p>
          <div className="space-y-4">
            {TIMELINE_STEPS.map((step, idx) => (
              <div key={step.name} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx <= currentStepIndex
                      ? 'bg-emerald-500 text-slate-950 shadow shadow-emerald-500/20'
                      : 'bg-slate-100 text-gray-400'
                  }`}>
                    {idx <= currentStepIndex ? '✓' : idx + 1}
                  </span>
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <span className={`w-0.5 h-6 my-1 ${
                      idx < currentStepIndex ? 'bg-emerald-500' : 'bg-slate-100'
                    }`} />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className={`text-xs font-bold ${idx <= currentStepIndex ? 'text-slate-900' : 'text-gray-400'}`}>
                    {step.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-light">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analytics breakdown */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_0%,rgba(16,185,129,0.1),rgba(0,0,0,0))]" />
          
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Brain className="text-emerald-400" size={18} />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">Automated AI Dossier</h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Heuristic Categorization</p>
              <p className="font-extrabold text-slate-100 mt-0.5">{issue.category}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Priority</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-black text-slate-100">{issue.priorityScore}</span>
                  <span className="text-[10px] text-slate-500">/ 100</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Assessed Severity</p>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 uppercase ${
                  issue.severity === 'critical' || issue.severity === 'high'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {issue.severity}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-1.5 text-[11px] text-slate-300 font-light">
              <p className="flex justify-between"><span>Coordinate Overlaps (50m):</span> <span className="font-semibold text-slate-100">{issue.duplicateCount} duplicates</span></p>
              <p className="flex justify-between"><span>Age-Weight (days):</span> <span className="font-semibold text-slate-100">{Math.round((Date.now() - new Date(issue.createdAt).getTime()) / (1000*60*60*24))} days</span></p>
              <p className="flex justify-between"><span>Verifiers Weight:</span> <span className="font-semibold text-slate-100">{positiveWeight.toFixed(1)} / 3.0 threshold</span></p>
            </div>
          </div>
        </div>

        {/* Verification ledger */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Verification Consensus Ledger</p>

          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100/50">
                <span className="text-xl font-black text-emerald-700 block">+{positiveWeight.toFixed(1)}</span>
                <span className="text-[9px] text-emerald-600 font-semibold uppercase mt-0.5 block">Confirmations</span>
              </div>
              <div className="bg-red-50 p-2.5 rounded-xl border border-red-100/50">
                <span className="text-xl font-black text-red-700 block">-{negativeWeight.toFixed(1)}</span>
                <span className="text-[9px] text-red-600 font-semibold uppercase mt-0.5 block">Rejections</span>
              </div>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {verifications.map((v) => (
                <div key={v.id} className="text-xs border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{v.verifierName}</span>
                    <span className={`font-mono text-[10px] font-bold px-1 py-0.5 rounded uppercase ${
                      v.result === 'confirm'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {v.result === 'confirm' ? '✓ Verified' : '✗ Reject'}
                    </span>
                  </div>
                  {v.note && <p className="text-slate-500 font-light mt-1 bg-slate-50 p-1.5 rounded text-[11px] italic">"{v.note}"</p>}
                  <p className="text-[9px] text-gray-400 font-mono mt-0.5">Confidence: {Math.round(v.confidence * 100)}% • Weight: {v.verifierWeightAtTime.toFixed(1)}</p>
                </div>
              ))}

              {verifications.length === 0 && (
                <p className="text-xs text-slate-400 font-light text-center py-4">No verifier has verified this report yet.</p>
              )}
            </div>

            {/* Quick Link to Verification Queue if Verifier */}
            {currentUser && (currentUser.role === 'verifier' || currentUser.role === 'admin') && issue.status === 'Awaiting Verification' && (
              <button
                onClick={() => onNavigate('verification-queue')}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1"
              >
                Go to Verification Queue <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Verifier On-site validation form if Assigned */}
        {currentUser && (currentUser.role === 'verifier' || currentUser.role === 'authority' || currentUser.role === 'admin') && issue.status === 'Assigned' && (
          <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 text-blue-800">
              <Camera size={16} />
              <p className="text-xs font-black uppercase tracking-wider">Validate Active Worksite</p>
            </div>
            <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
              Take/upload a picture of workers actively repairing the site to change the status to <strong>"In Progress"</strong> (in process).
            </p>

            <form onSubmit={handleUploadWorksitePhoto} className="space-y-3">
              {/* Presets */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-blue-800">Presets for Easy Testing:</p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWorksitePhotoUrl('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80')}
                    className="p-1 text-[9px] font-bold border border-blue-200 bg-white hover:bg-blue-50 text-blue-800 rounded cursor-pointer"
                  >
                    Asphalt Crew
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorksitePhotoUrl('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80')}
                    className="p-1 text-[9px] font-bold border border-blue-200 bg-white hover:bg-blue-50 text-blue-800 rounded cursor-pointer"
                  >
                    Leak Repairs
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorksitePhotoUrl('https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80')}
                    className="p-1 text-[9px] font-bold border border-blue-200 bg-white hover:bg-blue-50 text-blue-800 rounded cursor-pointer"
                  >
                    Technicians
                  </button>
                </div>
              </div>

              <input
                type="text"
                required
                placeholder="Or paste custom photograph URL"
                value={worksitePhotoUrl}
                onChange={e => setWorksitePhotoUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs focus:outline-none"
              />

              <textarea
                rows={2}
                placeholder="Worksite progress details..."
                value={worksiteNotes}
                onChange={e => setWorksiteNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs focus:outline-none"
              />

              <button
                type="submit"
                disabled={submittingWorksite}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow"
              >
                {submittingWorksite ? 'Submitting...' : 'Confirm Work In Progress'}
              </button>
            </form>
          </div>
        )}

      </div>

    </div>
  );
}
