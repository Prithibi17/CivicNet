import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { User } from '../shared-types.js';
import {
  Trophy,
  ShieldAlert,
  Search,
  RefreshCw,
  Medal,
  Crown,
  MapPin,
  CheckCircle,
  Users,
  FileText,
  Activity,
  Clock,
  MoreVertical,
  Lock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Droplet,
  ShieldCheck,
  Award,
  Star
} from 'lucide-react';

interface LeaderboardViewProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
}

// Sparkline component using SVGs for crisp presentation
const Sparkline = ({ points, color }: { points: number[]; color: string }) => {
  const width = 120;
  const height = 36;
  const maxVal = Math.max(...points);
  const minVal = Math.min(...points);
  const valRange = maxVal - minVal || 1;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - 2 - ((p - minVal) / valRange) * (height - 4);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible select-none">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Trust Score Doughnut Chart with stacked center stats
const TrustScoreDoughnut = () => {
  const data = [
    { label: 'Excellent (80-100)', value: 42, color: '#3b82f6' }, // Blue
    { label: 'Very Good (60-79)', value: 33, color: '#06b6d4' },  // Cyan/Teal
    { label: 'Good (40-59)', value: 16, color: '#10b981' },      // Green
    { label: 'Fair (20-39)', value: 5, color: '#eab308' },       // Yellow
    { label: 'Poor (0-19)', value: 2, color: '#ef4444' }         // Red
  ];

  const r = 36;
  const circ = 2 * Math.PI * r;
  let accumulatedPercent = 0;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
      <svg width="140" height="140" viewBox="0 0 100 100" className="transform -rotate-90">
        {data.map((item, idx) => {
          const strokeDasharray = `${(item.value / 100) * circ} ${circ}`;
          const strokeDashoffset = -((accumulatedPercent / 100) * circ);
          accumulatedPercent += item.value;
          return (
            <circle
              key={idx}
              cx="50"
              cy="50"
              r={r}
              fill="transparent"
              stroke={item.color}
              strokeWidth="9"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      {/* Center text block */}
      <div className="absolute text-center flex flex-col items-center">
        <span className="text-xl font-extrabold text-slate-800 leading-none">1,248</span>
        <span className="text-[9px] text-slate-400 font-semibold tracking-tight uppercase mt-1">Total Citizens</span>
      </div>
    </div>
  );
};

// Next Unlock Radial Gauge
const NextUnlockRadial = () => {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const percent = 62;
  const strokeDasharray = `${(percent / 100) * circ} ${circ}`;

  return (
    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
      <svg width="74" height="74" viewBox="0 0 80 80" className="transform -rotate-90">
        <circle cx="40" cy="40" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="transparent"
          stroke="#10b981"
          strokeWidth="6"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-slate-800 leading-none">{percent}%</span>
        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">15/40 pts</span>
      </div>
    </div>
  );
};

// Premium Gold Trophy Illustration for primary hero section
const TrophyIllustration = () => (
  <div className="relative w-28 h-28 flex items-center justify-center bg-white/10 rounded-full border border-white/20 shadow-inner shrink-0">
    <div className="absolute -top-1 -left-1 bg-white text-[#00674f] text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm">
      #1
    </div>
    <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Wreath */}
      <path
        d="M25 65 C 18 50, 18 30, 35 25 M75 65 C 82 50, 82 30, 65 25"
        stroke="#6ee7b7"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <path
        d="M30 60 C 24 45, 27 35, 38 32 M70 60 C 76 45, 73 35, 62 32"
        stroke="#34d399"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Base */}
      <rect x="35" y="70" width="30" height="7" rx="2.5" fill="#0F172A" />
      <rect x="42" y="63" width="16" height="7" fill="#475569" />
      {/* Trophy Body */}
      <path d="M32 30 H68 V45 C68 55, 59 62, 50 62 C41 62, 32 55, 32 45 V30 Z" fill="#fbbf24" />
      <path d="M38 30 H62 V45 C62 51, 57 56, 50 56 C43 56, 38 51, 38 45 V30 Z" fill="#f59e0b" />
      {/* Side Handles */}
      <path d="M32 34 H26 C22 34, 22 44, 26 44 H32" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M68 34 H74 C78 34, 78 44, 74 44 H68" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" />
      {/* Inner Star */}
      <polygon points="50,35 52,40 57,40 53,43 55,48 50,45 45,48 47,43 43,40 48,40" fill="#ffffff" />
    </svg>
  </div>
);

export default function LeaderboardView({ currentUser, onNavigate }: LeaderboardViewProps) {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [currentPage, setCurrentPage] = useState(1);
  const [liveCitizens, setLiveCitizens] = useState<User[]>([]);

  // Default mock list of beautiful contributors as shown in the mockup image to blend with database
  const DEFAULT_CONTRIBUTORS = [
    {
      id: 'mock-1',
      name: 'John Citizen',
      region: 'Jaipur Central',
      points: 25,
      trustScore: 92,
      weeklyGrowth: 12,
      reports: 18,
      verifications: 25,
      role: 'citizen',
      avatarColor: 'bg-emerald-500 text-white',
      isMe: true
    },
    {
      id: 'mock-2',
      name: 'Priya Sharma',
      region: 'Malviya Nagar',
      points: 21,
      trustScore: 88,
      weeklyGrowth: 8,
      reports: 15,
      verifications: 21,
      role: 'citizen',
      avatarColor: 'bg-indigo-500 text-white',
      isMe: false
    },
    {
      id: 'mock-3',
      name: 'Amit Verma',
      region: 'Mansarovar',
      points: 19,
      trustScore: 85,
      weeklyGrowth: 10,
      reports: 13,
      verifications: 18,
      role: 'citizen',
      avatarColor: 'bg-amber-500 text-white',
      isMe: false
    },
    {
      id: 'mock-4',
      name: 'Neha Jain',
      region: 'Vaishali Nagar',
      points: 17,
      trustScore: 82,
      weeklyGrowth: 6,
      reports: 12,
      verifications: 16,
      role: 'citizen',
      avatarColor: 'bg-pink-500 text-white',
      isMe: false
    },
    {
      id: 'mock-5',
      name: 'Rahul Meena',
      region: 'Tonk Road',
      points: 15,
      trustScore: 78,
      weeklyGrowth: 4,
      reports: 11,
      verifications: 14,
      role: 'citizen',
      avatarColor: 'bg-sky-500 text-white',
      isMe: false
    },
    {
      id: 'mock-6',
      name: 'Rohan Verma',
      region: 'C-Scheme',
      points: 9,
      trustScore: 72,
      weeklyGrowth: 3,
      reports: 6,
      verifications: 9,
      role: 'citizen',
      avatarColor: 'bg-purple-500 text-white',
      isMe: false
    }
  ];

  const loadData = () => {
    setLoading(true);
    api.getLeaderboard()
      .then(res => {
        const citizens = (res.leaderboard || [])
          .filter((u: any) => u.role === 'citizen' || u.role === 'verifier');
        setLiveCitizens(citizens);
      })
      .catch(err => {
        console.error('Error fetching leaderboard', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Blend current user and live citizens dynamically into the list
  const getBlendedCitizens = () => {
    // Start with default mock contributors to replicate mockup
    let base = [...DEFAULT_CONTRIBUTORS];

    // Map existing live DB users into our standard display schema
    const formattedLive = liveCitizens.map((lc, index) => {
      const initials = lc.name ? lc.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'C';
      return {
        id: lc.id,
        name: lc.name,
        region: lc.region || 'Jaipur Local',
        points: lc.points || 12,
        trustScore: lc.trustScore || 75,
        weeklyGrowth: Math.floor((lc.points || 12) * 0.4) + 1,
        reports: Math.floor((lc.points || 12) * 0.6) + 1,
        verifications: Math.floor((lc.points || 12) * 0.8) + 2,
        role: lc.role,
        avatarColor: `bg-${['emerald', 'blue', 'indigo', 'purple', 'teal', 'violet'][index % 6]}-500 text-white`,
        isMe: currentUser?.id === lc.id
      };
    });

    // Check if current user is logged in and not already in the mock list
    if (currentUser && currentUser.role === 'citizen') {
      const alreadyExists = base.some(b => b.id === currentUser.id || b.name.toLowerCase() === currentUser.name.toLowerCase());
      if (!alreadyExists) {
        // Swap or append the logged in user as the "You" contributor
        const userAsContributor = {
          id: currentUser.id,
          name: currentUser.name,
          region: currentUser.region || 'Jaipur Central',
          points: currentUser.points || 25,
          trustScore: currentUser.trustScore || 92,
          weeklyGrowth: Math.floor((currentUser.points || 25) * 0.4) || 12,
          reports: Math.floor((currentUser.points || 25) * 0.7) || 18,
          verifications: Math.floor((currentUser.points || 25) * 1.0) || 25,
          role: 'citizen',
          avatarColor: 'bg-emerald-600 text-white',
          isMe: true
        };
        
        // Remove the default 'John Citizen' mock if actual user is another name
        base = base.filter(b => b.id !== 'mock-1');
        base.unshift(userAsContributor);
      } else {
        // Mark the matching one as You
        base = base.map(b => {
          if (b.id === currentUser.id || b.name.toLowerCase() === currentUser.name.toLowerCase()) {
            return {
              ...b,
              name: currentUser.name,
              points: currentUser.points || b.points,
              trustScore: currentUser.trustScore || b.trustScore,
              region: currentUser.region || b.region,
              isMe: true
            };
          }
          return { ...b, isMe: false }; // clear isMe from John Citizen if user logged in is someone else
        });
      }
    }

    // Combine formatted live citizens with mock list, filtering out duplicates
    formattedLive.forEach(lc => {
      const exists = base.some(b => b.name.toLowerCase() === lc.name.toLowerCase());
      if (!exists) {
        base.push(lc);
      }
    });

    // Sort by points descending
    return base.sort((a, b) => b.points - a.points);
  };

  const allCitizens = getBlendedCitizens();

  // Find the primary highlighted profile user (usually the logged-in user or the top contributor)
  const profileUser = allCitizens.find(c => c.isMe) || allCitizens[0];

  // Areas list for dropdown filter
  const areas = ['All Areas', 'Jaipur Central', 'Malviya Nagar', 'Mansarovar', 'Vaishali Nagar', 'Tonk Road', 'C-Scheme'];

  // Apply Search and Area filters
  const filteredCitizens = allCitizens.filter(citizen => {
    const matchesSearch = citizen.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          citizen.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === 'All Areas' || citizen.region === selectedArea;
    return matchesSearch && matchesArea;
  });

  // Pagination slice
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredCitizens.length / itemsPerPage) || 1;
  const paginatedCitizens = filteredCitizens.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading && liveCitizens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <RefreshCw className="animate-spin text-[#00674f]" size={36} />
        <p className="text-sm text-slate-500 font-medium tracking-tight">Syncing community ledger rankings...</p>
      </div>
    );
  }

  // Helper for trust score label
  const getTrustLabel = (score: number) => {
    if (score >= 90) return { text: 'Excellent', style: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (score >= 80) return { text: 'Very Good', style: 'bg-cyan-50 text-cyan-700 border-cyan-100' };
    if (score >= 60) return { text: 'Good', style: 'bg-sky-50 text-sky-700 border-sky-100' };
    if (score >= 40) return { text: 'Fair', style: 'bg-yellow-50 text-yellow-700 border-yellow-100' };
    return { text: 'Poor', style: 'bg-red-50 text-red-700 border-red-100' };
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 font-sans space-y-8 text-slate-800">
      
      {/* 1. TOP GREEN DASHBOARD BANNER */}
      <div className="relative bg-[#00674f] text-white p-8 rounded-[30px] shadow-xl overflow-hidden border border-emerald-700/20">
        {/* Subtle geometric background patterns */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Top bar indicators */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <span className="bg-white/10 backdrop-blur-md text-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 border border-white/10">
            <Activity size={10} className="animate-pulse text-emerald-300" /> Active Ledger Status
          </span>
          <button 
            onClick={loadData}
            className="text-white/60 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 cursor-pointer"
          >
            <RefreshCw size={12} className="stroke-[2.5]" /> Last updated: 2 mins ago
          </button>
        </div>

        {/* Hero Info Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Hero Left Side Profile */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <TrophyIllustration />
            <div className="space-y-3">
              <div className="space-y-0.5">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-3xl font-black tracking-tight">{profileUser.name}</h1>
                  <Crown size={22} className="text-amber-400 fill-amber-400 shrink-0" />
                </div>
                <p className="text-xs text-emerald-200 font-semibold tracking-wider uppercase">{profileUser.region}</p>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-900/40 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-extrabold border border-emerald-500/20 tracking-wide">
                <Star size={12} className="fill-amber-400 text-amber-400" /> Community Champion
              </div>
            </div>
          </div>

          {/* Vertical Divider for Desktop */}
          <div className="hidden lg:block lg:col-span-1 h-20 border-r border-white/15 justify-self-center" />

          {/* Hero Right Side Core Stats */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
            {/* Stat 1 */}
            <div className="bg-emerald-900/20 backdrop-blur-sm p-3.5 rounded-2xl border border-white/5 space-y-1">
              <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">Total Points</span>
              <p className="text-2xl font-black tracking-tight flex items-baseline gap-1">
                {profileUser.points} <span className="text-xs font-normal text-emerald-300">pts</span>
              </p>
              <span className="text-[9px] text-emerald-300 font-bold flex items-center gap-1">
                <TrendingUp size={10} /> ↑ 12% last week
              </span>
            </div>

            {/* Stat 2 */}
            <div className="bg-emerald-900/20 backdrop-blur-sm p-3.5 rounded-2xl border border-white/5 space-y-1">
              <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">Trust Score</span>
              <p className="text-2xl font-black tracking-tight">{profileUser.trustScore}</p>
              <span className="text-[9px] text-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle size={10} className="text-emerald-400 fill-emerald-400/20" /> Excellent
              </span>
            </div>

            {/* Stat 3 */}
            <div className="bg-emerald-900/20 backdrop-blur-sm p-3.5 rounded-2xl border border-white/5 space-y-1">
              <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">Reports</span>
              <p className="text-2xl font-black tracking-tight">{profileUser.reports}</p>
              <span className="text-[9px] text-emerald-300 font-bold">This month</span>
            </div>

            {/* Stat 4 */}
            <div className="bg-emerald-900/20 backdrop-blur-sm p-3.5 rounded-2xl border border-white/5 space-y-1">
              <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">Verifications</span>
              <p className="text-2xl font-black tracking-tight">{profileUser.verifications}</p>
              <span className="text-[9px] text-emerald-300 font-bold">Total consensus</span>
            </div>

            {/* Stat 5 */}
            <div className="bg-emerald-900/20 backdrop-blur-sm p-3.5 rounded-2xl border border-white/5 col-span-2 sm:col-span-1 space-y-1">
              <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">Success Rate</span>
              <p className="text-2xl font-black tracking-tight">96%</p>
              <span className="text-[9px] text-emerald-300 font-bold">High Impact</span>
            </div>
          </div>

        </div>

        {/* Progress Bar Row */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold relative z-10">
          <div className="w-full md:max-w-lg space-y-2">
            <div className="flex justify-between text-[11px] text-emerald-200">
              <span>Progress to next rank</span>
              <span>{profileUser.points} / 40 pts</span>
            </div>
            <div className="w-full bg-emerald-950/50 rounded-full h-2.5 overflow-hidden p-[2px]">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                style={{ width: `${Math.min((profileUser.points / 40) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-950/30 border border-white/10 px-4 py-2.5 rounded-2xl text-[11px] text-emerald-200 font-bold shrink-0 self-stretch sm:self-auto justify-center">
            <Award size={13} className="text-amber-300" />
            <span>15 pts to reach Legend rank</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-1" />
          </div>
        </div>
      </div>

      {/* 2. FOUR SMALL SPARKLINES CARD GRIDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Citizens */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Users size={14} className="text-emerald-500" /> Total Citizens
            </span>
            <p className="text-2xl font-black text-slate-900 tracking-tight">1,248</p>
            <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp size={11} /> +18.5% <span className="text-slate-400 font-medium ml-1">from last month</span>
            </span>
          </div>
          <Sparkline points={[1100, 1150, 1120, 1200, 1180, 1220, 1248]} color="#10b981" />
        </div>

        {/* Card 2: Reports This Week */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <FileText size={14} className="text-blue-500" /> Reports This Week
            </span>
            <p className="text-2xl font-black text-slate-900 tracking-tight">136</p>
            <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp size={11} /> +24.6% <span className="text-slate-400 font-medium ml-1">from last week</span>
            </span>
          </div>
          <Sparkline points={[80, 95, 110, 85, 120, 130, 136]} color="#3b82f6" />
        </div>

        {/* Card 3: Community Score */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Award size={14} className="text-purple-500" /> Community Score
            </span>
            <p className="text-2xl font-black text-slate-900 tracking-tight">8.7 <span className="text-xs text-slate-400 font-medium">/ 10</span></p>
            <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp size={11} /> +6.2% <span className="text-slate-400 font-medium ml-1">from last month</span>
            </span>
          </div>
          <Sparkline points={[8.1, 8.2, 8.4, 8.3, 8.5, 8.6, 8.7]} color="#8b5cf6" />
        </div>

        {/* Card 4: Avg. Resolution Time */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock size={14} className="text-orange-500" /> Avg. Resolution Time
            </span>
            <p className="text-2xl font-black text-slate-900 tracking-tight">2.4 <span className="text-xs text-slate-400 font-medium font-sans">hrs</span></p>
            <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5">
              <TrendingDown size={11} /> -14.5% <span className="text-slate-400 font-medium ml-1">from last week</span>
            </span>
          </div>
          <Sparkline points={[3.2, 3.0, 2.8, 2.7, 2.5, 2.6, 2.4]} color="#f97316" />
        </div>
      </div>

      {/* 3. MAIN COLUMNS LAYOUT */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Datagrid table and double sub-row */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Top Community Contributors Datagrid */}
          <div className="bg-white rounded-[32px] border border-slate-150 shadow-sm overflow-hidden text-left">
            {/* Card Header with Controls */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Trophy className="text-amber-500" size={20} /> Top Community Contributors
                </h3>
                <p className="text-xs text-slate-400 font-medium">Rankings calculated based on verified logs, audits, and SLA adherence.</p>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Area Select */}
                <select
                  value={selectedArea}
                  onChange={(e) => {
                    setSelectedArea(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none transition"
                >
                  {areas.map((a, i) => (
                    <option key={i} value={a}>{a}</option>
                  ))}
                </select>

                {/* Period Select */}
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none transition"
                >
                  <option value="This Month">This Month</option>
                  <option value="All Time">All Time</option>
                </select>

                {/* Search citizen */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search citizen..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition w-40 sm:w-48"
                  />
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Responsive Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 tracking-wider uppercase">
                    <th className="py-4 px-6 text-center w-16">Rank</th>
                    <th className="py-4 px-6">Citizen</th>
                    <th className="py-4 px-6">Area</th>
                    <th className="py-4 px-6 text-right">Points</th>
                    <th className="py-4 px-6 text-center">Trust Score</th>
                    <th className="py-4 px-6 text-center">Weekly Growth</th>
                    <th className="py-4 px-6 text-center">Reports</th>
                    <th className="py-4 px-6 text-center">Verifications</th>
                    <th className="py-4 px-6 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedCitizens.map((citizen, idx) => {
                    const globalIndex = allCitizens.findIndex(c => c.id === citizen.id);
                    const rank = globalIndex !== -1 ? globalIndex + 1 : idx + 1;
                    const rating = getTrustLabel(citizen.trustScore);

                    // Rank Trophy/Medal icon colors
                    let rankBadge = <span className="font-mono font-bold text-slate-400">{rank}</span>;
                    if (rank === 1) {
                      rankBadge = (
                        <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold border border-amber-200 shadow-xs mx-auto text-[11px]">
                          🥇
                        </div>
                      );
                    } else if (rank === 2) {
                      rankBadge = (
                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold border border-slate-200 shadow-xs mx-auto text-[11px]">
                          🥈
                        </div>
                      );
                    } else if (rank === 3) {
                      rankBadge = (
                        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold border border-orange-200 shadow-xs mx-auto text-[11px]">
                          🥉
                        </div>
                      );
                    }

                    return (
                      <tr
                        key={citizen.id}
                        className={`hover:bg-slate-50/60 transition duration-150 ${
                          citizen.isMe ? 'bg-emerald-50/20 font-bold' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4 px-6 text-center font-bold">{rankBadge}</td>

                        {/* Citizen details */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${citizen.avatarColor} flex items-center justify-center font-bold text-xs shadow-xs border border-white/20 select-none`}>
                              {citizen.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                {citizen.name}
                                {citizen.isMe && (
                                  <span className="bg-emerald-500 text-slate-950 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-full uppercase">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium font-sans">Citizen Contributor</p>
                            </div>
                          </div>
                        </td>

                        {/* Area */}
                        <td className="py-4 px-6 text-slate-600 font-medium">{citizen.region}</td>

                        {/* Points */}
                        <td className="py-4 px-6 text-right text-slate-900 font-extrabold text-[13px]">
                          {citizen.points}
                        </td>

                        {/* Trust Score */}
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900">{citizen.trustScore}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${rating.style}`}>
                              {rating.text}
                            </span>
                          </div>
                        </td>

                        {/* Weekly Growth */}
                        <td className="py-4 px-6 text-center text-emerald-600 font-extrabold">
                          ↑ {citizen.weeklyGrowth}
                        </td>

                        {/* Reports */}
                        <td className="py-4 px-6 text-center text-slate-500 font-medium">{citizen.reports}</td>

                        {/* Verifications */}
                        <td className="py-4 px-6 text-center text-slate-500 font-medium">{citizen.verifications}</td>

                        {/* More Action */}
                        <td className="py-4 px-6 text-center">
                          <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition hover:bg-slate-100">
                            <MoreVertical size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedCitizens.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium text-xs">
                        No citizens match your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400 font-medium">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCitizens.length)} of {filteredCitizens.length} results
              </span>

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft size={14} className="stroke-[2.5]" />
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                >
                  Prev
                </button>

                {[...Array(totalPages)].map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition ${
                        currentPage === pNum
                          ? 'bg-[#00674f] text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                >
                  Next
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight size={14} className="stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* Sub-row: Community Insights & Activity Feed */}
          <div className="grid md:grid-cols-2 gap-6 text-left">
            
            {/* Insights Card */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-150 shadow-sm space-y-5">
              <div className="space-y-0.5">
                <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider">Community Insights</h4>
                <p className="text-[11px] text-slate-400 font-medium">Core analytics from city-wide reporter performance.</p>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                {/* Row 1 */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Most Active Area</p>
                      <p className="text-sm font-black text-slate-800">Malviya Nagar</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#00674f] bg-emerald-50 px-2.5 py-1 rounded-xl">
                    156 Reports
                  </span>
                </div>

                {/* Row 2 */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                      <Activity size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fastest Resolvers</p>
                      <p className="text-sm font-black text-slate-800">C-Scheme</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl">
                    1.8 hrs avg
                  </span>
                </div>

                {/* Row 3 */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 border border-purple-100">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top Contributors</p>
                      <p className="text-sm font-black text-slate-800">This Month</p>
                    </div>
                  </div>
                  {/* Overlapped avatars */}
                  <div className="flex items-center">
                    <div className="flex -space-x-2.5 overflow-hidden select-none">
                      <div className="inline-block h-6.5 w-6.5 rounded-full bg-blue-500 text-white font-extrabold text-[8px] flex items-center justify-center border-2 border-white">PS</div>
                      <div className="inline-block h-6.5 w-6.5 rounded-full bg-amber-500 text-white font-extrabold text-[8px] flex items-center justify-center border-2 border-white">AV</div>
                      <div className="inline-block h-6.5 w-6.5 rounded-full bg-pink-500 text-white font-extrabold text-[8px] flex items-center justify-center border-2 border-white">NJ</div>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 ml-2">+124</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Feed Card */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-150 shadow-sm space-y-5">
              <div className="space-y-0.5">
                <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider">Activity Feed</h4>
                <p className="text-[11px] text-slate-400 font-medium">Real-time civic efforts logged on blockchain-ledger proof.</p>
              </div>

              <div className="space-y-4">
                {/* Log 1 */}
                <div className="flex items-start gap-3 text-xs leading-normal">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl mt-0.5 border border-blue-100 shrink-0">
                    <Droplet size={14} className="fill-blue-500/10" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-700 font-medium">
                      <span className="font-extrabold text-slate-900">Priya Sharma</span> submitted a report
                    </p>
                    <p className="text-slate-400 font-medium text-[11px]">Water leakage near park</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0 font-sans">10 mins ago</span>
                </div>

                {/* Log 2 */}
                <div className="flex items-start gap-3 text-xs leading-normal">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl mt-0.5 border border-emerald-100 shrink-0">
                    <ShieldCheck size={14} className="fill-emerald-500/10" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-700 font-medium">
                      <span className="font-extrabold text-slate-900">Amit Verma's</span> report was verified
                    </p>
                    <p className="text-slate-400 font-medium text-[11px]">Street light not working</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0 font-sans">25 mins ago</span>
                </div>

                {/* Log 3 */}
                <div className="flex items-start gap-3 text-xs leading-normal">
                  <div className="p-2 bg-amber-50 text-amber-500 rounded-xl mt-0.5 border border-amber-100 shrink-0">
                    <Trophy size={14} className="fill-amber-500/10" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-700 font-medium">
                      <span className="font-extrabold text-slate-900">Neha Jain</span> earned Community Champion badge
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0 font-sans">1 hour ago</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Badges manual, Radial unlocking, and distribution doughnut */}
        <div className="lg:col-span-4 space-y-8 text-left">
          
          {/* Badges & Points references */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-150 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Medal size={16} className="text-purple-600" /> Badges & Points
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">Submit reports & verify consensuses to achieve ranks.</p>
              </div>
              <button className="text-emerald-600 hover:text-emerald-700 text-[10px] font-black uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-lg">
                View All
              </button>
            </div>

            {/* Badges Stack */}
            <div className="space-y-3.5 text-xs font-semibold">
              {/* Badge 1 */}
              <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl border border-blue-200">
                  <MapPin size={16} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900">First Report</span>
                    <span className="text-[9px] text-emerald-600 font-black bg-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      +5 Points
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Submit your first civic report on CivicNet.
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-black">
                    <CheckCircle size={10} className="fill-emerald-500 text-white" /> Unlocked
                  </div>
                </div>
              </div>

              {/* Badge 2 */}
              <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200">
                  <ShieldAlert size={16} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900">Trusted Verifier</span>
                    <span className="text-[9px] text-emerald-700 font-black bg-emerald-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Trust score lock
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Verify 25 reports that match eventual consensus.
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-black">
                    <CheckCircle size={10} className="fill-emerald-500 text-white" /> Unlocked
                  </div>
                </div>
              </div>

              {/* Badge 3 */}
              <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl border border-amber-200">
                  <Trophy size={16} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900">Community Champion</span>
                    <span className="text-[9px] text-emerald-600 font-black bg-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Double trust power
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Earn 100 lifetime points helping improve Jaipur.
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-black">
                    <CheckCircle size={10} className="fill-emerald-500 text-white" /> Unlocked
                  </div>
                </div>
              </div>

              {/* Badge 4 */}
              <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
                <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl border border-purple-200">
                  <Award size={16} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900">Closer</span>
                    <span className="text-[9px] text-blue-600 font-black bg-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      +10 Points bonus
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Help 5 reported issues reach the Closed status.
                  </p>
                  {/* Progress Line */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>Progress</span>
                      <span>3 / 5</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Unlock Circle Gauge Card */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-150 shadow-sm flex items-center justify-between gap-5">
            <div className="space-y-1.5 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <Lock size={15} />
                <span className="text-[10px] font-black uppercase tracking-wider">Next Unlock</span>
              </div>
              <h5 className="text-base font-black text-slate-900 tracking-tight leading-snug">Legend</h5>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Get 15 more points to unlock Legend rank.
              </p>
            </div>
            <NextUnlockRadial />
          </div>

          {/* Trust Score Distribution doughnut chart and legend */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-150 shadow-sm space-y-6">
            <div className="space-y-0.5">
              <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={16} className="text-[#00674f]" /> Trust Score Distribution
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">Cumulative score weight of registered contributors.</p>
            </div>

            {/* Doughnut Chart Content */}
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-between gap-6">
              <TrustScoreDoughnut />
              
              {/* Legend */}
              <div className="flex-1 space-y-2.5 text-[11px] font-bold text-slate-500 self-stretch sm:self-auto xl:self-auto flex flex-col justify-center">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span>Excellent (80-100)</span>
                  </div>
                  <span className="text-slate-800 font-extrabold font-mono text-right">42%</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
                    <span>Very Good (60-79)</span>
                  </div>
                  <span className="text-slate-800 font-extrabold font-mono text-right">33%</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Good (40-59)</span>
                  </div>
                  <span className="text-slate-800 font-extrabold font-mono text-right">16%</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0" />
                    <span>Fair (20-39)</span>
                  </div>
                  <span className="text-slate-800 font-extrabold font-mono text-right">5%</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                    <span>Poor (0-19)</span>
                  </div>
                  <span className="text-slate-800 font-extrabold font-mono text-right">2%</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4. FOOTER LEDGER BANNER */}
      <div className="border-t border-slate-200/80 pt-6 text-center space-y-1">
        <p className="text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5 uppercase tracking-wider">
          <ShieldCheck size={14} className="text-[#00674f]" /> CivicNet — Jaipur Municipal Ledger Console
        </p>
        <p className="text-[10px] text-slate-400 font-semibold tracking-normal max-w-xl mx-auto leading-relaxed">
          Decentralized community consensus, AI routing, and transparent resolution proofs.
        </p>
      </div>

    </div>
  );
}
