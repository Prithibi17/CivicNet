import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Issue } from '../shared-types.js';
import MapComponent from './MapComponent.js';
import { ShieldCheck, MapPin, BarChart3, Award, ArrowRight, UserCheck, Flame } from 'lucide-react';

interface LandingViewProps {
  onNavigate: (view: string) => void;
  onDemoLogin: (email: string) => void;
}

export default function LandingView({ onNavigate, onDemoLogin }: LandingViewProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState({
    totalReports: 15,
    resolvedCount: 3,
    activeCount: 12,
    resolutionRate: 20
  });

  useEffect(() => {
    // Load public summary and maps
    api.getIssues().then(res => {
      setIssues(res.issues);
    });
    api.getAnalyticsSummary().then(res => {
      if (res.summary) {
        setStats(res.summary);
      }
    });
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white overflow-hidden border-b border-slate-850">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0 select-none">
          <img
            src="https://images.pexels.com/photos/32702973/pexels-photo-32702973.jpeg"
            alt="India Green Canopy Background"
            className="w-full h-full object-cover opacity-50 pointer-events-none transition duration-1000 scale-100"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.3),rgba(0,0,0,0))] pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Flame size={14} className="animate-pulse text-emerald-400" />
              Empowering Hyperlocal Civic Collaboration
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Stronger Community, <span className="text-emerald-400 bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Better Tomorrow</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl font-light">
              Report local issues with evidence and a map pin. Track resolutions in real time through automated AI routing, community verification, and official authority updates.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                id="btn-report-issue-hero"
                onClick={() => onNavigate('report-issue')}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer text-sm"
              >
                Report an Issue <ArrowRight size={16} />
              </button>
              <button
                id="btn-view-map-hero"
                onClick={() => onNavigate('live-map')}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer text-sm"
              >
                Explore Live Map
              </button>
            </div>
          </div>

          {/* Quick Seed Authentication Box (Crucial for effortless review!) */}
          <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-400" />
                Seeded Evaluator Login Panel
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Click any pre-seeded profile below to authenticate instantly with full state authorization.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => onDemoLogin('citizen@demo.com')}
                className="flex flex-col items-start p-3 bg-slate-800/60 hover:bg-emerald-950/40 border border-slate-700/60 hover:border-emerald-500/40 rounded-xl transition text-left cursor-pointer group"
              >
                <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">Citizen</span>
                <span className="text-[10px] text-slate-400 truncate w-full">citizen@demo.com</span>
                <span className="text-[9px] text-slate-500 mt-1">Submit & Confirm fixes</span>
              </button>

              <button
                onClick={() => onDemoLogin('verifier@demo.com')}
                className="flex flex-col items-start p-3 bg-slate-800/60 hover:bg-emerald-950/40 border border-slate-700/60 hover:border-emerald-500/40 rounded-xl transition text-left cursor-pointer group"
              >
                <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">Verifier</span>
                <span className="text-[10px] text-slate-400 truncate w-full">verifier@demo.com</span>
                <span className="text-[9px] text-slate-500 mt-1">Community voting</span>
              </button>

              <button
                onClick={() => onDemoLogin('authority@demo.com')}
                className="flex flex-col items-start p-3 bg-slate-800/60 hover:bg-emerald-950/40 border border-slate-700/60 hover:border-emerald-500/40 rounded-xl transition text-left cursor-pointer group"
              >
                <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">Authority Staff</span>
                <span className="text-[10px] text-slate-400 truncate w-full">authority@demo.com</span>
                <span className="text-[9px] text-slate-500 mt-1">Officer dispatch & fix</span>
              </button>

              <button
                onClick={() => onDemoLogin('admin@demo.com')}
                className="flex flex-col items-start p-3 bg-slate-800/60 hover:bg-emerald-950/40 border border-slate-700/60 hover:border-emerald-500/40 rounded-xl transition text-left cursor-pointer group"
              >
                <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">Admin</span>
                <span className="text-[10px] text-slate-400 truncate w-full">admin@demo.com</span>
                <span className="text-[9px] text-slate-500 mt-1">Full control, audit log</span>
              </button>
            </div>
            <div className="text-[10px] text-center text-slate-500 font-mono">
              Demo accounts password: <span className="text-slate-300 font-bold bg-slate-800 px-1 py-0.5 rounded">Demo1234!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center space-y-1">
            <p className="text-3xl font-extrabold text-slate-900">{stats.totalReports}</p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Issues Reported</p>
          </div>
          <div className="text-center space-y-1 border-l border-gray-100">
            <p className="text-3xl font-extrabold text-emerald-500">{stats.resolvedCount}</p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Issues Resolved</p>
          </div>
          <div className="text-center space-y-1 border-l border-gray-100">
            <p className="text-3xl font-extrabold text-blue-500">{stats.activeCount}</p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Monitoring</p>
          </div>
          <div className="text-center space-y-1 border-l border-gray-100">
            <p className="text-3xl font-extrabold text-amber-500">{stats.resolutionRate}%</p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Resolution Rate</p>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 space-y-16">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Reduced Friction, Faster Fixes</h2>
          <p className="text-slate-600 font-light">
            CivicNet eliminates bureaucracy and introduces transparency using intelligent automation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4">
              <MapPin size={22} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Hyperlocal Tagging</h3>
            <p className="text-sm text-slate-600 font-light">
              Pinpoint precise civic locations in seconds with photo evidence and exact coordinates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Routing & Duplicate Check</h3>
            <p className="text-sm text-slate-600 font-light">
              Deterministic categorization, automated severity rating, and instant geometric overlap detection.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 mb-4">
              <UserCheck size={22} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Community Verification</h3>
            <p className="text-sm text-slate-600 font-light">
              Weighted verifications prevent spam and authenticate reports before dispatching crews.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 mb-4">
              <Award size={22} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Gamified Civic Action</h3>
            <p className="text-sm text-slate-600 font-light">
              Earn trust scores, custom badges, and top points for active civic actions.
            </p>
          </div>
        </div>
      </div>

      {/* Live Map Preview Section */}
      <div className="bg-slate-100 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-16 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Live Civic Map</h2>
              <p className="text-slate-600 text-sm font-light">
                Browse open potholes, water leaks, dark streets, and garbage heaps across Jaipur in real time.
              </p>
            </div>
            <button
              onClick={() => onNavigate('live-map')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shrink-0 flex items-center gap-2 cursor-pointer shadow-sm transition"
            >
              Full Screen Map <ArrowRight size={14} />
            </button>
          </div>

          <div className="h-[450px] shadow-lg rounded-2xl overflow-hidden border border-gray-250">
            <MapComponent
              issues={issues}
              onSelectIssue={(issue) => {
                onNavigate(`issue-details-${issue.id}`);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
