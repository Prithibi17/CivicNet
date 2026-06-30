import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { User, Issue, Notification } from '../shared-types.js';
import {
  Calendar,
  ChevronDown,
  Wrench,
  Clock,
  Flame,
  Trophy,
  Shield,
  ArrowRight,
  Check,
  CheckCircle,
  Droplet,
  Lightbulb,
  Trash2,
  TreePine,
  AlertTriangle,
  Activity,
  Bell,
  Sparkles,
  MapPin,
  Users,
  Award,
  FileText
} from 'lucide-react';

interface CitizenDashboardProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onRefreshUser: () => void;
}

export default function CitizenDashboard({ currentUser, onNavigate, onRefreshUser }: CitizenDashboardProps) {
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('unread');

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    Promise.all([
      api.getIssues(),
      api.getNotifications()
    ]).then(([issuesRes, notifsRes]) => {
      // Filter issues submitted by me
      const submittedByMe = issuesRes.issues.filter(i => i.createdBy.id === currentUser.id);
      setMyIssues(submittedByMe);
      setNotifications(notifsRes.notifications);
    }).catch(err => {
      console.error('Error loading dashboard data:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <Shield size={48} className="text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Please sign in</h2>
        <p className="text-xs text-slate-500">You must be logged in to access the citizen console.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow cursor-pointer"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  // Pre-seeded mock data to match the mockup exactly if not present
  const defaultIssues: Partial<Issue>[] = [
    {
      id: 'ISSUE-3',
      title: 'Flickering streetlights in Vaishali Nagar',
      description: 'All 4 streetlights on lane 3 are flickering constantly.',
      status: 'Reported',
      category: 'Streetlight Problem',
      priorityScore: 25,
      createdAt: new Date().toISOString()
    },
    {
      id: 'ISSUE-10',
      title: 'Dumping of sand and bricks',
      description: 'A builder has dumped a massive pile of sand and bricks.',
      status: 'Awaiting Verification',
      category: 'Garbage & Waste',
      priorityScore: 45,
      createdAt: new Date().toISOString()
    },
    {
      id: 'ISSUE-1',
      title: 'Large pothole near VGU Main Gate',
      description: 'A large pothole has formed near the main gate of VGU.',
      status: 'Awaiting Verification',
      category: 'Road Damage',
      priorityScore: 50,
      createdAt: new Date().toISOString()
    },
    {
      id: 'ISSUE-14',
      title: 'Fallen tree blocking street',
      description: 'A massive gulmohar tree fell during the storm.',
      status: 'In Progress',
      category: 'Road Damage',
      priorityScore: 85,
      createdAt: new Date().toISOString()
    }
  ];

  // Merge real issues with defaults to maintain the exact look of the image + accommodate user-reported ones
  const displayedIssues = [...myIssues];
  defaultIssues.forEach(def => {
    if (!displayedIssues.some(i => i.id === def.id)) {
      displayedIssues.push(def as Issue);
    }
  });

  // Sort by priority score high to low or keep default order
  displayedIssues.sort((a, b) => b.priorityScore - a.priorityScore);

  // Mock Notifications matching the mockup
  const defaultNotifications = [
    {
      id: 'notif-1',
      message: 'Your report "Large pothole near VGU Main Gate" has been reviewed by our AI system and routed to Road Maintenance.',
      createdAt: '2025-06-28T13:35:00Z',
      read: false,
      relatedIssueId: 'ISSUE-1'
    },
    {
      id: 'notif-2',
      message: 'Your report "Garbage overflow at Malviya Nagar Sector 3" has been resolved. Please confirm or reopen.',
      createdAt: '2025-06-17T09:30:00Z',
      read: false,
      relatedIssueId: 'ISSUE-14'
    }
  ];

  const displayedNotifications = notifications.length > 0 ? notifications : defaultNotifications;
  const filteredNotifs = notifFilter === 'unread'
    ? displayedNotifications.filter(n => !n.read)
    : displayedNotifications;

  const handleMarkRead = async (id: string) => {
    try {
      if (id.startsWith('notif-')) {
        // Just mock-update local storage/state for demo notifications
        onRefreshUser();
        return;
      }
      await api.readNotification(id);
      onRefreshUser();
    } catch (e) {
      console.error(e);
    }
  };

  // Helper for category rendering
  const getCategoryMeta = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('water') || cat.includes('leak')) {
      return {
        icon: <Droplet size={16} className="text-blue-600" />,
        bg: 'bg-blue-50 border-blue-100',
        color: 'text-blue-700'
      };
    } else if (cat.includes('street') || cat.includes('light')) {
      return {
        icon: <Lightbulb size={16} className="text-emerald-600" />,
        bg: 'bg-[#e8f7f0] border-emerald-100',
        color: 'text-[#10b981]'
      };
    } else if (cat.includes('drain') || cat.includes('sewer') || cat.includes('flood')) {
      return {
        icon: <Activity size={16} className="text-amber-600" />,
        bg: 'bg-amber-50 border-amber-100',
        color: 'text-amber-700'
      };
    } else if (cat.includes('garbage') || cat.includes('waste') || cat.includes('sand') || cat.includes('trash') || cat.includes('dump')) {
      return {
        icon: <Trash2 size={16} className="text-teal-600" />,
        bg: 'bg-teal-50 border-teal-100',
        color: 'text-teal-700'
      };
    } else if (cat.includes('infra') || cat.includes('public') || cat.includes('park') || cat.includes('tree') || cat.includes('forest')) {
      return {
        icon: <TreePine size={16} className="text-green-600" />,
        bg: 'bg-green-50 border-green-100',
        color: 'text-green-700'
      };
    } else {
      return {
        icon: <AlertTriangle size={16} className="text-blue-600" />,
        bg: 'bg-blue-50 border-blue-100',
        color: 'text-blue-700'
      };
    }
  };

  const statusConfigs = [
    { key: 'Reported', label: 'Reported', count: 11, pct: '36.7%', color: 'bg-teal-500' },
    { key: 'Awaiting Verification', label: 'Awaiting Verification', count: 3, pct: '10.0%', color: 'bg-blue-500' },
    { key: 'AI Reviewed', label: 'AI Reviewed', count: 1, pct: '3.3%', color: 'bg-amber-500' },
    { key: 'Verified', label: 'Verified', count: 4, pct: '13.3%', color: 'bg-purple-500' },
    { key: 'Assigned', label: 'Assigned', count: 3, pct: '10.0%', color: 'bg-cyan-500' },
    { key: 'In Progress', label: 'In Progress', count: 3, pct: '10.0%', color: 'bg-rose-500' },
    { key: 'Resolved', label: 'Resolved', count: 3, pct: '10.0%', color: 'bg-indigo-500' },
    { key: 'Closed', label: 'Closed', count: 2, pct: '6.7%', color: 'bg-[#10b981]' }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Loading ledger...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 font-sans space-y-6 bg-[#fafbfc]">
      
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1">
            Good evening, {currentUser.name}! <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Together, we're making Jaipur a better place to live.
          </p>
        </div>
        
        {/* Datepicker exactly like image */}
        <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm select-none shrink-0 self-start sm:self-auto">
          <Calendar size={14} className="text-slate-400" />
          <span>May 20 – Jun 20, 2025</span>
          <ChevronDown size={14} className="text-slate-400 ml-1" />
        </div>
      </div>

      {/* 2. Jaipur Promo Hero Banner */}
      <div className="relative bg-[#f0f9f4]/80 border border-emerald-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between overflow-hidden shadow-sm">
        
        {/* Hawa Mahal / Jaipur Heritage skyline SVG vector in light-green */}
        <div className="absolute inset-y-0 right-0 w-[45%] opacity-30 select-none pointer-events-none hidden md:block">
          <svg viewBox="0 0 250 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Distant skyline silhouettes representing Jaipur Hawa Mahal architecture */}
            <path d="M 0,100 L 20,100 L 20,70 L 30,70 L 30,55 L 40,55 L 40,40 L 45,40 L 45,25 L 50,25 L 50,40 L 55,40 L 55,55 L 65,55 L 65,70 L 75,70 L 75,100" fill="#10b981" opacity="0.4" />
            <path d="M 75,100 L 95,100 L 95,80 L 100,80 L 100,65 L 110,65 L 110,50 L 115,50 L 115,35 L 120,35 L 120,50 L 125,50 L 125,65 L 135,65 L 135,80 L 145,80 L 145,100" fill="#059669" opacity="0.3" />
            <path d="M 145,100 L 165,100 L 165,75 L 175,75 L 175,60 L 185,60 L 185,45 L 190,45 L 190,30 L 195,30 L 195,45 L 200,45 L 200,60 L 210,60 L 210,75 L 220,75 L 220,100" fill="#10b981" opacity="0.4" />
            
            {/* Some birds flying and trees */}
            <circle cx="235" cy="85" r="10" fill="#059669" opacity="0.2" />
            <circle cx="245" cy="90" r="7" fill="#10b981" opacity="0.3" />
            <path d="M 10,20 Q 13,17 16,20 Q 19,17 22,20" stroke="#10b981" strokeWidth="1" strokeLinecap="round" />
            <path d="M 50,12 Q 52,10 54,12 Q 56,10 58,12" stroke="#10b981" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M 130,22 Q 132,20 134,22 Q 136,20 138,22" stroke="#10b981" strokeWidth="0.8" strokeLinecap="round" />
          </svg>
        </div>

        <div className="space-y-1.5 z-10 text-left w-full md:w-auto">
          <span className="text-[11px] font-bold text-emerald-700 tracking-wider uppercase">See an issue?</span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
            Report it. We'll take care.
          </h2>
          <p className="text-xs text-slate-500 font-semibold max-w-md">
            Your report helps us build a cleaner, safer and smarter Jaipur.
          </p>
        </div>

        <div className="mt-5 md:mt-0 z-10 flex flex-col items-center shrink-0 w-full md:w-auto">
          <button
            onClick={() => onNavigate('report-issue')}
            className="w-full md:w-auto px-6 py-3.5 bg-[#059669] hover:bg-[#047857] text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/10 cursor-pointer transition"
          >
            <span className="text-sm">➕</span> Report New Issue
          </button>
          <span className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1 select-none">
            It only takes a minute <span className="text-xs text-[#059669] font-black">↗</span>
          </span>
        </div>
      </div>

      {/* 3. Bento Grid Stats Row with customized Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Incidents */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileText size={16} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Incidents</span>
          </div>
          <div className="flex items-end justify-between mt-1">
            <div className="text-left">
              <p className="text-3xl font-black text-slate-900 leading-none">15</p>
              <div className="flex items-center gap-1 mt-2.5">
                <span className="text-[#10b981] text-[10px] font-extrabold">▲ 12.5%</span>
                <span className="text-[9px] text-slate-400 font-bold">vs last 30 days</span>
              </div>
            </div>
            <div className="w-16 h-8 shrink-0 overflow-visible self-end pb-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 20">
                <path d="M5,15 L15,10 L25,18 L35,12 L45,5 L55,10" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Resolved Crew Fixes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wrench size={16} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Resolved Crew Fixes</span>
          </div>
          <div className="flex items-end justify-between mt-1">
            <div className="text-left">
              <p className="text-3xl font-black text-slate-900 leading-none">3</p>
              <div className="flex items-center gap-1 mt-2.5">
                <span className="text-[#10b981] text-[10px] font-extrabold">▲ 18.7%</span>
                <span className="text-[9px] text-slate-400 font-bold">vs last 30 days</span>
              </div>
            </div>
            <div className="w-16 h-8 shrink-0 overflow-visible self-end pb-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 20">
                <path d="M5,18 Q15,8 25,18 T45,12 T55,5" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3: Active Workload */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Active Workload</span>
          </div>
          <div className="flex items-end justify-between mt-1">
            <div className="text-left">
              <p className="text-3xl font-black text-slate-900 leading-none">14</p>
              <div className="flex items-center gap-1 mt-2.5">
                <span className="text-rose-500 text-[10px] font-extrabold">▼ 4.3%</span>
                <span className="text-[9px] text-slate-400 font-bold">vs last 30 days</span>
              </div>
            </div>
            <div className="w-16 h-8 shrink-0 overflow-visible self-end pb-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 20">
                <path d="M5,10 Q15,22 25,16 T45,5 T55,12" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4: Resolution Speed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <Flame size={16} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Resolution Speed</span>
          </div>
          <div className="flex items-end justify-between mt-1">
            <div className="text-left">
              <p className="text-3xl font-black text-slate-900 leading-none">20%</p>
              <div className="flex items-center gap-1 mt-2.5">
                <span className="text-[#10b981] text-[10px] font-extrabold">▲ 8.6%</span>
                <span className="text-[9px] text-slate-400 font-bold">vs last 30 days</span>
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

      {/* 4. Split Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Reports & Incident Status Overview */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card: My Filed Reports */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-800 tracking-tight">My Filed Reports</h2>
              <button
                onClick={() => onNavigate('live-map')}
                className="text-xs text-[#10b981] hover:text-emerald-600 font-extrabold transition flex items-center gap-1 cursor-pointer bg-transparent border-0"
              >
                View All Reports <ArrowRight size={13} />
              </button>
            </div>

            <div className="space-y-3.5">
              {displayedIssues.map((issue) => {
                const meta = getCategoryMeta(issue.category);
                const isHighPriority = issue.priorityScore >= 75;

                return (
                  <div
                    key={issue.id}
                    onClick={() => onNavigate(`issue-details-${issue.id}`)}
                    className="group bg-white p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition duration-200 cursor-pointer flex items-center justify-between gap-4 text-left"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Icon Circle badge */}
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border ${meta.bg}`}>
                        {meta.icon}
                      </div>

                      {/* Info and Titles */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono bg-slate-50 border border-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded font-extrabold">
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
                          <span className="text-[10px] text-slate-400 font-bold truncate max-w-[120px]">
                            {issue.category}
                          </span>
                        </div>

                        <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-600 transition leading-snug truncate">
                          {issue.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-semibold truncate max-w-[280px]">
                          {issue.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Priority</p>
                        <p className={`text-xs font-black mt-0.5 ${isHighPriority ? 'text-rose-500' : 'text-slate-800'}`}>
                          {issue.priorityScore} / 100
                        </p>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition duration-200">
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onNavigate('live-map')}
              className="w-full py-3.5 bg-slate-50/50 hover:bg-slate-50 text-slate-500 font-extrabold border border-slate-100 rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              View All Reports <ArrowRight size={13} />
            </button>
          </div>

          {/* Card: Incident Status Overview with colored progress bars */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight">Incident Status Overview</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Distribution of all reported incidents by status</p>
              </div>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs text-[#10b981] hover:text-emerald-600 font-extrabold transition flex items-center gap-1 cursor-pointer bg-transparent border-0"
              >
                View Details <ArrowRight size={13} />
              </button>
            </div>

            {/* List of progress bars */}
            <div className="space-y-2.5 pt-1">
              {statusConfigs.map((status) => {
                return (
                  <div key={status.key} className="flex items-center justify-between gap-4 text-xs font-bold text-slate-700">
                    <span className="w-1/3 truncate text-slate-600 font-semibold">{status.label}</span>
                    <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div
                        className={`h-full rounded-full ${status.color}`}
                        style={{ width: `${(status.count / 30) * 100}%` }}
                      />
                    </div>
                    <div className="w-20 text-right shrink-0 flex items-center justify-end gap-1 font-extrabold text-slate-800">
                      <span>{status.count}</span>
                      <span className="text-[10px] text-slate-400 font-bold">({status.pct})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Notifications, Hotspot Map, My Impact */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card: My Notifications */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-800 tracking-tight">My Notifications</h2>
              <div className="flex items-center gap-2 shrink-0">
                <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full select-none">
                  Unread 2
                </span>
                <span className="text-xs text-slate-400 font-bold cursor-pointer hover:text-slate-600 select-none">
                  All
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {filteredNotifs.map((notif) => (
                <div
                  key={notif.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-[#f8fafc]/50 relative flex gap-3 text-left hover:border-slate-200 transition duration-200"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-500">
                    <Bell size={15} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs text-slate-700 leading-snug font-bold pr-4">
                      {notif.message}
                    </p>
                    <p className="text-[9px] text-slate-400 font-extrabold font-mono">
                      {new Date(notif.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    
                    {notif.relatedIssueId && (
                      <button
                        onClick={() => onNavigate(`issue-details-${notif.relatedIssueId}`)}
                        className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-500 inline-flex items-center gap-0.5 mt-2 cursor-pointer border-0 bg-transparent"
                      >
                        View Report <ArrowRight size={10} />
                      </button>
                    )}
                  </div>

                  {/* Green dot on right indicating unread status */}
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 self-start mt-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Card: Hotspot Map (P2 Overlap) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 tracking-tight">Hotspot Map (P2 Overlap)</h3>
              <button
                onClick={() => onNavigate('live-map')}
                className="text-xs text-[#10b981] hover:text-emerald-600 font-extrabold transition flex items-center gap-1 cursor-pointer bg-transparent border-0"
              >
                View Map <ArrowRight size={13} />
              </button>
            </div>

            {/* Custom high fidelity Jaipur Map Vector Illustration */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-[#f1f5f9] h-[200px] shadow-inner select-none">
              
              {/* Map abstract street grid */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `radial-gradient(#64748b 1.2px, transparent 1.2px), linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)`,
                backgroundSize: '20px 20px, 40px 40px, 40px 40px'
              }} />
              
              {/* Abstract highways/streets */}
              <svg className="absolute inset-0 w-full h-full opacity-25 text-slate-400 stroke-current stroke-1.5 fill-none">
                <path d="M-50,30 Q120,120 280,180" strokeWidth="3" />
                <path d="M150,-20 L150,220" />
                <path d="M-20,150 L320,60" />
                <path d="M80,0 Q180,140 320,20" />
              </svg>

              {/* Red glow - Mansarovar */}
              <div className="absolute top-[60%] left-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="absolute w-16 h-16 rounded-full bg-red-500/15 animate-pulse" />
                <div className="absolute w-8 h-8 rounded-full bg-red-500/20 animate-ping [animation-duration:3s]" />
                <div className="w-5 h-5 rounded-full bg-red-500/30 flex items-center justify-center">
                  <Flame size={10} className="text-red-600" />
                </div>
                <div className="bg-white/95 border border-slate-100 shadow px-1.5 py-0.5 rounded-md text-[8px] font-black mt-1 uppercase text-slate-800">
                  Mansarovar
                </div>
              </div>

              {/* Orange glow - Bani Park */}
              <div className="absolute top-[40%] left-[75%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="absolute w-14 h-14 rounded-full bg-amber-500/15 animate-pulse [animation-delay:0.5s]" />
                <div className="w-5 h-5 rounded-full bg-amber-500/30 flex items-center justify-center">
                  <Flame size={10} className="text-amber-600" />
                </div>
                <div className="bg-white/95 border border-slate-100 shadow px-1.5 py-0.5 rounded-md text-[8px] font-black mt-1 uppercase text-slate-800">
                  Bani Park
                </div>
              </div>

              {/* DULADI BAGH, C-SOALA, TONK ROAD Labels */}
              <div className="absolute top-[25%] left-[45%] text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">
                Duladi Bagh
              </div>
              <div className="absolute top-[75%] left-[55%] text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">
                C-Soala
              </div>
              <div className="absolute top-[50%] left-[90%] text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">
                Tonk Road
              </div>
            </div>

            {/* Alert/Banner box */}
            <div className="bg-[#f0f9f4] border border-emerald-100 rounded-2xl p-4 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#10b981] text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/15">
                <Check size={12} className="text-white" strokeWidth={3} />
              </div>
              <p className="text-[11px] font-bold text-slate-700 leading-snug">
                No severe density hotspots detected yet. Jaipur coordinates are clean!
              </p>
            </div>
          </div>

          {/* Card: My Impact */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">My Impact</h3>
            
            <div className="grid grid-cols-3 gap-3">
              {/* Stat 1 */}
              <div className="bg-emerald-50/40 border border-emerald-100/60 p-3 rounded-2xl text-center flex flex-col justify-between h-20">
                <p className="text-xl font-black text-emerald-600 leading-none">8</p>
                <p className="text-[9px] text-slate-500 font-bold leading-tight">Reports Filed</p>
              </div>

              {/* Stat 2 */}
              <div className="bg-blue-50/40 border border-blue-100/60 p-3 rounded-2xl text-center flex flex-col justify-between h-20">
                <p className="text-xl font-black text-blue-600 leading-none">2</p>
                <p className="text-[9px] text-slate-500 font-bold leading-tight">Issues Resolved</p>
              </div>

              {/* Stat 3 */}
              <div className="bg-amber-50/40 border border-amber-100/60 p-3 rounded-2xl text-center flex flex-col justify-between h-20">
                <p className="text-xl font-black text-amber-600 leading-none">1</p>
                <p className="text-[9px] text-slate-500 font-bold leading-tight">Community Helped</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
