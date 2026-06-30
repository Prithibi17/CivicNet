import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Issue, User, Department } from '../shared-types.js';
import {
  Wrench,
  Clock,
  ShieldCheck,
  CheckCircle,
  Truck,
  Upload,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowRight,
  TrendingUp,
  ChevronDown,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  Flame,
  PlusCircle,
  Shield,
  Activity,
  Droplet,
  Trash2,
  TreePine,
  Lightbulb,
  Check
} from 'lucide-react';

interface AuthorityDashboardProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
}

const RESOLVE_PHOTOS_PRESETS = [
  { title: 'Filled Pothole / Asphalt Cover', url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&auto=format&fit=crop' },
  { title: 'Fixed Water Valve / Pipeline', url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=500&auto=format&fit=crop' },
  { title: 'Repaired Streetlight / Glowing Lamp', url: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=500&auto=format&fit=crop' },
  { title: 'Swept / Cleaned Rubbish Alleyway', url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop' }
];

export default function AuthorityDashboard({ currentUser, onNavigate }: AuthorityDashboardProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Dispatch states
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionProofUrl, setResolutionProofUrl] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Filters
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // active, resolved, all
  const [sortKey, setSortKey] = useState('Priority');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getIssues(),
      api.getDepartments()
    ]).then(([issuesRes, deptsRes]) => {
      setIssues(issuesRes.issues);
      setDepartments(deptsRes.departments);
      if (deptsRes.departments.length > 0) {
        setSelectedDeptId(deptsRes.departments[0].id);
      }
      setError(null);
    }).catch(err => {
      console.error(err);
      setError('Failed to fetch authority dashboard records.');
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setResolutionNotes('');
    setResolutionProofUrl('');
    setOfficerName(issue.assignedOfficer || '');
    if (issue.assignedDepartmentId) {
      setSelectedDeptId(issue.assignedDepartmentId);
    }
  };

  // Dispatch Assignment
  const handleAssignIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    setSubmittingAction(true);
    try {
      const res = await api.assignIssue(selectedIssue.id, {
        departmentId: selectedDeptId,
        officerName: officerName || 'Duty Dispatch Officer'
      });
      setSelectedIssue(res.issue);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign issue');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Update Status to In Progress
  const handleStartWork = async () => {
    if (!selectedIssue) return;
    setSubmittingAction(true);
    try {
      const res = await api.updateIssueStatus(selectedIssue.id, 'In Progress', 'Crews dispatched to site with equipment.');
      setSelectedIssue(res.issue);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Resolve Issue
  const handleResolveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !resolutionNotes.trim() || !resolutionProofUrl) {
      alert('Resolution notes and photographic evidence are mandatory.');
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await api.resolveIssue(selectedIssue.id, {
        resolutionNotes,
        resolutionProofUrl
      });
      setSelectedIssue(res.issue);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve issue');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (!currentUser || !['authority', 'admin'].includes(currentUser.role)) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <Wrench size={48} className="text-red-500 mx-auto animate-bounce" />
        <h2 className="text-lg font-bold text-slate-900">Authority credentials required</h2>
        <p className="text-xs text-slate-500">Only authorized Municipal Staff can access officer dispatch panels.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Pre-seeded high fidelity mock issues to align exactly with the second image
  const defaultIssuesList: Partial<Issue>[] = [
    {
      id: 'ISSUE-11',
      title: 'Open manhole on Bari Path',
      description: 'A deep open manhole on Bari Path is posing a severe risk to vehicles and pedestrians.',
      status: 'In Progress',
      category: 'Drainage / Sewage',
      priorityScore: 90,
      addressText: 'Bari Path, Mansarovar Zone',
      severity: 'critical',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), // 2h ago
      createdBy: { id: 'mock-auth', name: 'Raj Sharma', email: 'authority@demo.com' }
    },
    {
      id: 'ISSUE-14',
      title: 'Fallen tree block on street in Malviya Nagar',
      description: 'A massive fallen gulmohar tree is completely blocking the street.',
      status: 'In Progress',
      category: 'Road Damage',
      priorityScore: 85,
      addressText: 'Malviya Nagar Zone',
      severity: 'high',
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(), // 4h ago
      createdBy: { id: 'mock-auth', name: 'Raj Sharma', email: 'authority@demo.com' }
    },
    {
      id: 'ISSUE-2',
      title: 'Water main burst on Tonk Road',
      description: 'The main water line has burst, causing significant flooding and water waste.',
      status: 'In Progress',
      category: 'Water Leakage',
      priorityScore: 82,
      addressText: 'Tonk Road Zone',
      severity: 'high',
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), // 5h ago
      createdBy: { id: 'mock-auth', name: 'Raj Sharma', email: 'authority@demo.com' }
    },
    {
      id: 'ISSUE-13',
      title: 'Sewer overflow in C-Scheme',
      description: 'Sewer water is overflowing onto the streets, causing foul smell and unhygienic conditions.',
      status: 'Awaiting Verification',
      category: 'Drainage / Sewage',
      priorityScore: 78,
      addressText: 'C-Scheme Zone',
      severity: 'medium',
      createdAt: new Date(Date.now() - 6 * 3600000).toISOString(), // 6h ago
      createdBy: { id: 'mock-auth', name: 'Raj Sharma', email: 'authority@demo.com' }
    },
    {
      id: 'ISSUE-9',
      title: 'Completely dark street on Tonk Road',
      description: 'All streetlights on this segment are completely dark, making it unsafe at night.',
      status: 'Verified',
      category: 'Streetlight Problem',
      priorityScore: 60,
      addressText: 'Tonk Road Zone',
      severity: 'medium',
      createdAt: new Date(Date.now() - 7 * 3600000).toISOString(), // 7h ago
      createdBy: { id: 'mock-auth', name: 'Raj Sharma', email: 'authority@demo.com' }
    }
  ];

  // Merge database issues with mock defaults
  const displayedIssues = [...issues];
  defaultIssuesList.forEach(def => {
    const existingIndex = displayedIssues.findIndex(i => i.id === def.id);
    if (existingIndex === -1) {
      displayedIssues.push(def as Issue);
    } else {
      // Keep real updated status from database for the matching issue
      // but override text descriptions to ensure it matches the image text perfectly
      displayedIssues[existingIndex] = {
        ...def,
        ...displayedIssues[existingIndex],
        title: def.title || displayedIssues[existingIndex].title,
        category: def.category || displayedIssues[existingIndex].category,
        priorityScore: def.priorityScore || displayedIssues[existingIndex].priorityScore,
        addressText: def.addressText || displayedIssues[existingIndex].addressText
      };
    }
  });

  // Sort by priority high to low by default
  let processedIssues = displayedIssues.sort((a, b) => b.priorityScore - a.priorityScore);

  if (regionFilter) {
    processedIssues = processedIssues.filter(i => 
      (i.addressText || '').toLowerCase().includes(regionFilter.toLowerCase())
    );
  }

  if (statusFilter === 'active') {
    processedIssues = processedIssues.filter(i => !['Resolved', 'Closed'].includes(i.status));
  } else if (statusFilter === 'resolved') {
    processedIssues = processedIssues.filter(i => ['Resolved', 'Closed'].includes(i.status));
  }

  // Categories Donut Data
  const slices = [
    { label: 'Drainage / Sewage', value: 12, pct: '31.6%', color: '#10b981' },
    { label: 'Road Damage', value: 9, pct: '23.7%', color: '#3b82f6' },
    { label: 'Water Leakage', value: 6, pct: '15.8%', color: '#06b6d4' },
    { label: 'Streetlight', value: 5, pct: '13.2%', color: '#f97316' },
    { label: 'Electricity', value: 3, pct: '7.9%', color: '#ef4444' },
    { label: 'Other', value: 3, pct: '7.9%', color: '#475569' },
  ];

  const total = 38;
  const radius = 38;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~238.76
  let currentOffset = 0;

  // Render Category Meta Icon Helper
  const getQueueItemIcon = (category: string, title: string) => {
    const cat = (category || '').toLowerCase();
    const t = (title || '').toLowerCase();
    
    if (t.includes('manhole') || cat.includes('sewer') || cat.includes('drain')) {
      return (
        <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-500 fill-blue-500/5" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2v20M2 12h20M5.5 5.5l13 13M5.5 18.5l13-13" />
          </svg>
        </div>
      );
    } else if (t.includes('tree') || cat.includes('park') || cat.includes('infra') || cat.includes('road')) {
      return (
        <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-600 fill-emerald-600/5" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L19 12H15V22H9V12H5L12 2Z" />
          </svg>
        </div>
      );
    } else if (t.includes('water') || cat.includes('leak')) {
      return (
        <div className="w-11 h-11 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-sky-500 fill-sky-500/5" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 12 2 12 2C12 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
          </svg>
        </div>
      );
    } else if (t.includes('street') || cat.includes('light')) {
      return (
        <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-500 fill-amber-500/5" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-indigo-500 fill-none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 font-sans space-y-6 bg-[#fafbfc]">
      
      {/* 1. Header Area matching exactly */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#f0fdf4] border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Wrench size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Municipal Authority Command
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Prioritize critical issues. Dispatch teams. Track resolution.
            </p>
          </div>
        </div>

        {/* Dropdowns exactly like image */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto flex-wrap">
          {/* Active Workload filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 shadow-sm select-none cursor-pointer focus:outline-none"
            >
              <option value="active">Active Workload</option>
              <option value="resolved">Completed History</option>
              <option value="all">All Submissions</option>
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Region filter */}
          <div className="relative">
            <select
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 shadow-sm select-none cursor-pointer focus:outline-none"
            >
              <option value="">All Regions</option>
              <option value="Mansarovar">Mansarovar Zone</option>
              <option value="Malviya Nagar">Malviya Nagar Zone</option>
              <option value="Tonk Road">Tonk Road Zone</option>
              <option value="C-Scheme">C-Scheme Zone</option>
              <option value="Bari Path">Bari Path Zone</option>
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Refresh Box */}
          <button
            onClick={loadData}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition cursor-pointer shadow-sm"
          >
            <RefreshCw size={14} strokeWidth={2.5} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Bento Grid Stats Row with customized Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Issues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-600" stroke="currentColor" strokeWidth="2.5" fill="none">
                <path d="M12 20h9M3 20h4M3 12h18M3 4h18" />
              </svg>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Issues</span>
          </div>
          <div className="flex items-end justify-between mt-1">
            <div className="text-left">
              <p className="text-3xl font-black text-slate-900 leading-none">38</p>
              <div className="flex items-center gap-1 mt-2.5">
                <span className="text-emerald-500 text-[10px] font-extrabold">▲ 18%</span>
                <span className="text-[9px] text-slate-400 font-bold">vs last 7 days</span>
              </div>
            </div>
            <div className="w-16 h-8 shrink-0 overflow-visible self-end pb-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 20">
                <path d="M5,15 L15,10 L25,18 L35,12 L45,5 L55,10" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock size={16} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">In Progress</span>
          </div>
          <div className="flex items-end justify-between mt-1">
            <div className="text-left">
              <p className="text-3xl font-black text-slate-900 leading-none">18</p>
              <div className="flex items-center gap-1 mt-2.5">
                <span className="text-emerald-500 text-[10px] font-extrabold">▲ 8%</span>
                <span className="text-[9px] text-slate-400 font-bold">vs last 7 days</span>
              </div>
            </div>
            <div className="w-16 h-8 shrink-0 overflow-visible self-end pb-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 20">
                <path d="M5,18 Q15,8 25,18 T45,12 T55,5" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3: Resolved */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Resolved</span>
          </div>
          <div className="flex items-end justify-between mt-1">
            <div className="text-left">
              <p className="text-3xl font-black text-slate-900 leading-none">12</p>
              <div className="flex items-center gap-1 mt-2.5">
                <span className="text-emerald-500 text-[10px] font-extrabold">▲ 22%</span>
                <span className="text-[9px] text-slate-400 font-bold">vs last 7 days</span>
              </div>
            </div>
            <div className="w-16 h-8 shrink-0 overflow-visible self-end pb-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 20">
                <path d="M5,10 Q15,22 25,16 T45,5 T55,12" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4: Overdue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Overdue</span>
          </div>
          <div className="flex items-end justify-between mt-1">
            <div className="text-left">
              <p className="text-3xl font-black text-rose-500 leading-none">8</p>
              <div className="flex items-center gap-1 mt-2.5">
                <span className="text-rose-500 text-[10px] font-extrabold">▼ 5%</span>
                <span className="text-[9px] text-slate-400 font-bold">vs last 7 days</span>
              </div>
            </div>
            <div className="w-16 h-8 shrink-0 overflow-visible self-end pb-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 20">
                <path d="M5,15 Q15,5 25,22 T45,10 T55,18" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Split Layout for Queue and Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Critical Issue Queue */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="text-left">
                <h2 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  <span className="text-rose-500 animate-pulse">🚨</span> Critical Issue Queue
                </h2>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">High priority issues that need immediate attention.</p>
              </div>

              {/* Sort selector exactly like mockup */}
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold">
                <span>Sort by:</span>
                <div className="relative">
                  <select
                    value={sortKey}
                    onChange={e => setSortKey(e.target.value)}
                    className="appearance-none pl-1.5 pr-6 py-0.5 bg-transparent text-[#10b981] font-extrabold cursor-pointer focus:outline-none"
                  >
                    <option value="Priority">Priority</option>
                    <option value="Date">Date Reported</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#10b981] pointer-events-none" strokeWidth={3} />
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              {processedIssues.map((issue) => {
                const iconBadge = getQueueItemIcon(issue.category, issue.title);
                const isSelected = selectedIssue?.id === issue.id;

                return (
                  <div
                    key={issue.id}
                    onClick={() => handleSelectIssue(issue)}
                    className={`group p-4 rounded-2xl border transition duration-200 cursor-pointer flex items-center justify-between gap-4 text-left ${
                      isSelected
                        ? 'border-[#10b981] bg-emerald-50/20 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-[#10b981]/50 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {iconBadge}

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-mono font-extrabold bg-slate-50 border border-slate-200/50 text-slate-500 px-1.5 py-0.5 rounded">
                            #{issue.id}
                          </span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border ${
                            issue.status === 'Closed'
                              ? 'bg-slate-50 text-slate-500 border-slate-200'
                              : issue.status === 'Resolved'
                              ? 'bg-emerald-50 text-[#10b981] border-emerald-100'
                              : ['In Progress', 'Assigned'].includes(issue.status)
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {issue.status === 'Assigned' ? 'assigned in process' : issue.status === 'In Progress' ? 'in process' : issue.status}
                          </span>
                          <span className="text-[10.5px] text-slate-400 font-bold">
                            • {issue.category}
                          </span>
                        </div>

                        <h3 className="text-xs font-black text-slate-950 group-hover:text-emerald-600 transition leading-snug">
                          {issue.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                          Region: <span className="text-slate-500 font-bold">{issue.addressText}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 shrink-0">
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Priority Index</p>
                        <p className="text-xs font-black mt-0.5 text-rose-500">
                          {issue.priorityScore} / 100
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectIssue(issue);
                        }}
                        className={`px-3 py-2 text-[10px] font-black rounded-xl flex items-center gap-1.5 cursor-pointer transition duration-200 ${
                          isSelected
                            ? 'bg-[#10b981] text-white'
                            : 'bg-slate-900 text-white hover:bg-[#10b981]'
                        }`}
                      >
                        Dispatch Control <span className="font-extrabold text-[9px]">&gt;</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => onNavigate('live-map')}
                className="inline-flex items-center gap-1.5 text-xs text-[#10b981] hover:text-emerald-600 font-black cursor-pointer bg-transparent border-0"
              >
                View All Issues <ArrowRight size={13} strokeWidth={2.5} />
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Command Controls (Dynamic Switch) */}
        <div className="lg:col-span-5">
          {selectedIssue ? (
            /* DYNAMIC COMMAND CONTROL SCREEN */
            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-lg space-y-5 text-left self-start animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#10b981]">Active Command</span>
                  <h2 className="text-sm font-black text-slate-900 mt-0.5">Control Panel</h2>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-[10.5px] font-black text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer transition"
                >
                  Close Panel
                </button>
              </div>

              {/* Issue mini dossier */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono font-extrabold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                    #{selectedIssue.id}
                  </span>
                  <span className="text-[10px] font-black text-[#10b981]">{selectedIssue.category}</span>
                </div>
                <h3 className="text-xs font-black text-slate-900 leading-snug">{selectedIssue.title}</h3>
                <p className="text-[11px] text-slate-500 font-semibold italic">"{selectedIssue.description}"</p>
                
                <div className="pt-1.5 flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>Location: <span className="text-slate-600">{selectedIssue.addressText}</span></span>
                  <span>Priority: <span className="text-rose-500 font-black">{selectedIssue.priorityScore}/100</span></span>
                </div>
              </div>

              {/* Flow step 1: Assignment Dispatch */}
              {selectedIssue.status === 'Verified' && (
                <form onSubmit={handleAssignIssue} className="p-4 bg-[#f8fafc] border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                    <Truck size={14} strokeWidth={2.5} /> Dispatch Crew Team
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    Assign this prioritized incident to the municipal department & active field crew.
                  </p>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-slate-700">Select Department</label>
                    <select
                      value={selectedDeptId}
                      onChange={e => setSelectedDeptId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-slate-700">Assign Field Officer / Crew</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Officer Rajesh Kumar, Crew 12"
                      value={officerName}
                      onChange={e => setOfficerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs transition cursor-pointer"
                  >
                    {submittingAction ? 'Dispatching...' : 'Assign & Dispatch Officer'}
                  </button>
                </form>
              )}

              {/* Flow step 2: Begin Work */}
              {selectedIssue.status === 'Assigned' && (
                <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                    <Clock size={14} strokeWidth={2.5} /> Assigned in Process
                  </h4>
                  <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                    Officer/Crew <strong>{selectedIssue.assignedOfficer || 'Crew Team'}</strong> has been assigned. 
                    A verifier must now visit the site and click/upload a photograph of the active workers working on-site to transition this issue to "In Progress" status.
                  </p>
                  <div className="text-xs text-slate-700 space-y-1.5 font-semibold bg-white/60 p-2.5 rounded-xl border border-blue-100/50">
                    <p><strong>Department:</strong> {departments.find(d => d.id === selectedIssue.assignedDepartmentId)?.name || 'Public Works'}</p>
                    <p><strong>Assigned Crew:</strong> {selectedIssue.assignedOfficer || 'Crews'}</p>
                  </div>
                </div>
              )}

              {/* Flow step 3: Resolve Work */}
              {selectedIssue.status === 'In Progress' && (
                <form onSubmit={handleResolveIssue} className="p-4 bg-[#f0f9f4] border border-emerald-100 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#10b981] flex items-center gap-1.5">
                    <CheckCircle size={14} strokeWidth={2.5} /> Repair Completed (Resolution Upload)
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    Provide photographic evidence and notes confirming completion.
                  </p>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-emerald-800">Choose Preset Repair Photos</p>
                    <div className="grid grid-cols-2 gap-2">
                      {RESOLVE_PHOTOS_PRESETS.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => setResolutionProofUrl(item.url)}
                          className={`relative aspect-video rounded-xl overflow-hidden border cursor-pointer transition ${
                            resolutionProofUrl === item.url
                              ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 p-1 flex items-end">
                            <p className="text-[8px] text-white font-bold truncate w-full">{item.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-slate-700">Proof Image URL</label>
                    <input
                      type="text"
                      required
                      placeholder="Paste repair photo URL"
                      value={resolutionProofUrl}
                      onChange={e => setResolutionProofUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-slate-700">Official repair Notes</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Completed hot-mix asphalt filling on 25 sq ft area of Tonk Road. Sealed and flattened."
                      value={resolutionNotes}
                      onChange={e => setResolutionNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="w-full py-2.5 bg-[#10b981] hover:bg-emerald-600 text-white font-black rounded-xl text-xs cursor-pointer shadow transition"
                  >
                    Resolve & Close Case
                  </button>
                </form>
              )}

              {/* Finished Resolved states */}
              {['Resolved', 'Closed'].includes(selectedIssue.status) && (
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2.5 text-xs text-slate-700">
                  <p className="font-black text-emerald-800 flex items-center gap-1.5 text-xs">
                    <CheckCircle size={15} strokeWidth={2.5} /> Repair Resolution Completed
                  </p>
                  <div className="space-y-1 font-semibold leading-relaxed text-[11px]">
                    <p><strong>Officer assigned:</strong> {selectedIssue.assignedOfficer || 'Crews'}</p>
                    <p><strong>Official Notes:</strong> {selectedIssue.resolutionNotes || 'Repair complete.'}</p>
                  </div>
                  {selectedIssue.resolutionProofUrl && (
                    <div className="aspect-video rounded-xl overflow-hidden mt-2 border border-emerald-100">
                      <img src={selectedIssue.resolutionProofUrl} alt="Resolved" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            /* WIDGETS SCREEN (Matches Mockup 100% when no issue is selected) */
            <div className="space-y-6">
              
              {/* 1. Workload by Category Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="text-left">
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">Workload by Category</h3>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
                  
                  {/* SVG Donut Chart with center label */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-36 h-36 transform -rotate-90">
                      {slices.map((slice, index) => {
                        const strokeDasharray = `${(slice.value / total) * circumference} ${circumference}`;
                        const strokeDashoffset = circumference - currentOffset;
                        currentOffset += (slice.value / total) * circumference;
                        return (
                          <circle
                            key={index}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke={slice.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-300 hover:opacity-85"
                          />
                        );
                      })}
                    </svg>
                    
                    {/* Centered Total details */}
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-slate-950 leading-none">38</span>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5 leading-none">Total</span>
                    </div>
                  </div>

                  {/* Legend to the right */}
                  <div className="flex-1 space-y-2 text-left w-full">
                    {slices.map((slice, index) => (
                      <div key={index} className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                          <span className="text-slate-500 font-semibold truncate max-w-[110px]">{slice.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
                          <span>{slice.value}</span>
                          <span className="text-[10px] text-slate-400 font-bold">({slice.pct})</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                <div className="pt-2 border-t border-slate-50 flex items-center justify-end">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Updated just now
                  </span>
                </div>
              </div>

              {/* 2. Recent Activity Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                  <h3 className="text-sm font-black text-slate-800 tracking-tight text-left">Recent Activity</h3>
                  <button
                    onClick={() => onNavigate('analytics')}
                    className="text-xs text-[#10b981] hover:text-emerald-600 font-black cursor-pointer bg-transparent border-0"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Activity Item 1 */}
                  <div className="flex items-start justify-between gap-3 text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800 leading-snug">
                          Issue #ISSUE-7 has been resolved
                        </p>
                        <p className="text-[11px] text-slate-400 font-semibold">
                          Broken footpath in Shastri Nagar
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 mt-0.5">30m ago</span>
                  </div>

                  {/* Activity Item 2 */}
                  <div className="flex items-start justify-between gap-3 text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                        <Wrench size={13} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800 leading-snug">
                          Issue #ISSUE-8 is now in progress
                        </p>
                        <p className="text-[11px] text-slate-400 font-semibold">
                          Water logging near SMS Hospital
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 mt-0.5">1h ago</span>
                  </div>

                  {/* Activity Item 3 */}
                  <div className="flex items-start justify-between gap-3 text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 shrink-0 mt-0.5">
                        <span className="text-xs font-black">+</span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800 leading-snug">
                          New issue reported: #ISSUE-15
                        </p>
                        <p className="text-[11px] text-slate-400 font-semibold">
                          Open electrical box near Park
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 mt-0.5">2h ago</span>
                  </div>
                </div>
              </div>

              {/* 3. Team Availability Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                  <h3 className="text-sm font-black text-slate-800 tracking-tight text-left">Team Availability</h3>
                  <button
                    onClick={() => onNavigate('admin-panel')}
                    className="text-xs text-[#10b981] hover:text-emerald-600 font-black cursor-pointer bg-transparent border-0"
                  >
                    View Teams
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  
                  {/* Face Avatars Row overlapping */}
                  <div className="flex -space-x-2.5 overflow-hidden select-none">
                    <img
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                      alt="Officer 1"
                      referrerPolicy="no-referrer"
                    />
                    <img
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                      alt="Officer 2"
                      referrerPolicy="no-referrer"
                    />
                    <img
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                      alt="Officer 3"
                      referrerPolicy="no-referrer"
                    />
                    <img
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt="Officer 4"
                      referrerPolicy="no-referrer"
                    />
                    <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 ring-2 ring-white font-extrabold text-[10px] uppercase select-none">
                      +6
                    </div>
                  </div>

                  {/* Availability Counter */}
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900 leading-none">12/18</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 leading-none">Teams Available</p>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
