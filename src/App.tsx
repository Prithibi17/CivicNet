import React, { useEffect, useState } from 'react';
import { api } from './api.js';
import { User, Issue } from './shared-types.js';
import { motion, AnimatePresence } from 'motion/react';

// Modular Views
import LandingView from './components/LandingView.js';
import AuthView from './components/AuthView.js';
import ReportIssueView from './components/ReportIssueView.js';
import IssueDetailsView from './components/IssueDetailsView.js';
import CitizenDashboard from './components/CitizenDashboard.js';
import VerificationQueue from './components/VerificationQueue.js';
import AuthorityDashboard from './components/AuthorityDashboard.js';
import AdminPanel from './components/AdminPanel.js';
import AnalyticsView from './components/AnalyticsView.js';
import LeaderboardView from './components/LeaderboardView.js';
import MapComponent from './components/MapComponent.js';
import LiveMapView from './components/LiveMapView.js';

import {
  Home,
  Map as MapIcon,
  BarChart3,
  Trophy,
  User as UserIcon,
  Wrench,
  ShieldCheck,
  Settings,
  Bell,
  LogOut,
  PlusCircle,
  Menu,
  X,
  Building2,
  Sun,
  Moon,
  Shield,
  Search,
  ChevronDown
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mapIssues, setMapIssues] = useState<Issue[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Authenticate user from localStorage on mount
  const checkSession = () => {
    const cached = localStorage.getItem('ch_user');
    if (cached) {
      try {
        const u = JSON.parse(cached) as User;
        // Refresh profile stats directly from DB
        api.getProfile(u.id)
          .then(res => {
            setCurrentUser(res.user);
            localStorage.setItem('ch_user', JSON.stringify(res.user));
          })
          .catch(() => {
            // fallback to cached session if backend down
            setCurrentUser(u);
          });
      } catch (e) {
        localStorage.removeItem('ch_user');
      }
    }
  };

  useEffect(() => {
    checkSession();
    // Periodically update unread notification indicators if logged in
    const interval = setInterval(() => {
      const cached = localStorage.getItem('ch_user');
      if (cached) {
        api.getNotifications()
          .then(res => {
            const unread = res.notifications.filter((n: any) => !n.read).length;
            setUnreadNotifsCount(unread);
          })
          .catch(() => {});
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Pre-load map issues for full map view
  useEffect(() => {
    api.getIssues()
      .then(res => {
        setMapIssues(res.issues);
      })
      .catch(() => {});
  }, [currentView]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setCurrentView('admin-panel');
    } else if (user.role === 'authority') {
      setCurrentView('authority-dashboard');
    } else if (user.role === 'verifier') {
      setCurrentView('verification-queue');
    } else {
      setCurrentView('citizen-dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ch_user');
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleDemoLogin = async (email: string) => {
    try {
      const res = await api.login({ email, password: 'Demo1234!' });
      localStorage.setItem('ch_user', JSON.stringify(res.user));
      setCurrentUser(res.user);
      
      // Auto-route based on logged-in role
      if (res.user.role === 'admin') {
        setCurrentView('admin-panel');
      } else if (res.user.role === 'authority') {
        setCurrentView('authority-dashboard');
      } else if (res.user.role === 'verifier') {
        setCurrentView('verification-queue');
      } else {
        setCurrentView('citizen-dashboard');
      }
    } catch (e) {
      alert('Demo login failed.');
    }
  };

  const navigate = (view: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Match dynamic Issue detail routes
  const isIssueDetailsRoute = currentView.startsWith('issue-details-');
  const matchedIssueId = isIssueDetailsRoute ? currentView.replace('issue-details-', '') : '';
  const isAuthPage = ['login', 'signup'].includes(currentView);

  const getUserAvatar = (user: User | null) => {
    if (!user) {
      return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120";
    }
    if (user.email === 'citizen@demo.com') {
      return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120";
    }
    if (user.email === 'verifier@demo.com') {
      return "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120";
    }
    if (user.email === 'authority@demo.com') {
      return "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120";
    }
    if (user.email === 'admin@demo.com') {
      return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120&h=120";
    }
    return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120&h=120";
  };

  const getRoleLabelAndStyles = (role: string) => {
    switch (role) {
      case 'verifier':
        return {
          label: 'Verifier',
          badgeClass: 'bg-blue-50 text-blue-600 border-blue-100',
          consoleLabel: 'Verifier Console'
        };
      case 'authority':
        return {
          label: 'Authority Staff',
          badgeClass: 'bg-amber-50 text-amber-600 border-amber-100',
          consoleLabel: 'Authority Console'
        };
      case 'admin':
        return {
          label: 'Municipal Director',
          badgeClass: 'bg-purple-50 text-purple-600 border-purple-100',
          consoleLabel: 'Municipal Control'
        };
      default:
        return {
          label: 'Citizen',
          badgeClass: 'bg-[#e8f7f0] text-[#10b981] border-emerald-100',
          consoleLabel: 'Citizen Console'
        };
    }
  };

  const getRoleStats = (user: User) => {
    if (user.role === 'authority') {
      return [
        {
          label: 'Points',
          value: user.points || 0,
          icon: <Trophy size={14} className="text-amber-600" />,
          bgClass: 'bg-amber-50 text-amber-500'
        },
        {
          label: 'Service',
          value: 'Dispatch',
          icon: <Wrench size={14} className="text-emerald-600" />,
          bgClass: 'bg-emerald-50 text-emerald-500'
        }
      ];
    } else if (user.role === 'admin') {
      return [
        {
          label: 'Points',
          value: user.points || 0,
          icon: <Trophy size={14} className="text-amber-600" />,
          bgClass: 'bg-amber-50 text-amber-500'
        },
        {
          label: 'Scope',
          value: 'All Areas',
          icon: <Shield size={14} className="text-purple-600" />,
          bgClass: 'bg-purple-50 text-purple-500'
        }
      ];
    } else {
      return [
        {
          label: 'Points',
          value: user.points || 0,
          icon: <Trophy size={14} className="text-amber-600" />,
          bgClass: 'bg-amber-50 text-amber-500'
        },
        {
          label: 'Trust',
          value: `${user.trustScore || 50}%`,
          icon: <Shield size={14} className="text-emerald-600" />,
          bgClass: 'bg-emerald-50 text-emerald-500'
        }
      ];
    }
  };

  const getSidebarNavItems = (role: string) => {
    const items = [];

    if (role === 'citizen') {
      items.push({
        view: 'citizen-dashboard',
        label: 'Dashboard',
        icon: <Home size={15} />
      });
      items.push({
        view: 'report-issue',
        label: 'Report an Issue',
        icon: <PlusCircle size={15} />
      });
    } else if (role === 'verifier') {
      items.push({
        view: 'verification-queue',
        label: 'Review Queue',
        icon: <ShieldCheck size={15} />
      });
    } else if (role === 'authority') {
      items.push({
        view: 'authority-dashboard',
        label: 'Officer Console',
        icon: <Wrench size={15} />
      });
    } else if (role === 'admin') {
      items.push({
        view: 'admin-panel',
        label: 'Admin Panel',
        icon: <Settings size={15} />
      });
      items.push({
        view: 'authority-dashboard',
        label: 'Officer Console',
        icon: <Wrench size={15} />
      });
      items.push({
        view: 'verification-queue',
        label: 'Review Queue',
        icon: <ShieldCheck size={15} />
      });
    }

    items.push({
      view: 'live-map',
      label: 'Live Radar Map',
      icon: <MapIcon size={15} />
    });
    items.push({
      view: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 size={15} />
    });
    items.push({
      view: 'leaderboard',
      label: 'Leaderboard',
      icon: <Trophy size={15} />
    });

    return items;
  };

  if (currentUser && !isAuthPage) {
    const roleConfig = getRoleLabelAndStyles(currentUser.role);
    const stats = getRoleStats(currentUser);
    const navItems = getSidebarNavItems(currentUser.role);

    return (
      <div className={`bg-slate-50 min-h-screen flex font-sans antialiased text-slate-800 ${isDarkMode ? 'dark' : ''}`}>
        
        {/* Left Side Navigation Bar */}
        <aside className="w-72 bg-white border-r border-slate-150 h-screen sticky top-0 flex flex-col justify-between shrink-0 p-6 z-[1010] select-none">
          <div className="space-y-6">
            
            {/* Logo Badge & Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#10b981] text-white flex items-center justify-center shadow-md shadow-emerald-500/15">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" />
                  <path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7" />
                  <path d="M19 21V11" />
                  <path d="M5 21V11" />
                  <path d="M10 21V11" />
                  <path d="M14 21V11" />
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-[15px] tracking-tight text-slate-900 leading-none">
                  CivicNet
                </span>
                <span className="text-[10px] text-slate-400 font-bold leading-none mt-1.5">
                  Better cities, together.
                </span>
              </div>
            </div>

            {/* Profile Avatar Details */}
            <div className="flex flex-col items-center pt-2">
              <div className="relative">
                {/* Glow/Gradient behind avatar */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400 to-blue-500 opacity-20 blur-sm scale-110" />
                <div className="w-20 h-20 rounded-full overflow-hidden border-[2.5px] border-emerald-500 bg-slate-100 shadow-md flex items-center justify-center relative z-10">
                  <img
                    src={getUserAvatar(currentUser)}
                    alt="User profile"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <h3 className="font-black text-slate-800 text-[15px] mt-3.5 tracking-tight text-center truncate w-full">
                {currentUser.name}
              </h3>
              <span className="text-[10.5px] font-bold text-slate-400 tracking-tight leading-none mt-1">
                {currentUser.email}
              </span>
              <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full mt-3 uppercase tracking-wider border ${roleConfig.badgeClass}`}>
                {roleConfig.label}
              </span>
            </div>

            {/* Points & Trust/Specialty Shelf */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {stats.map((stat, i) => (
                <div key={i} className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl flex items-center gap-2">
                  <div className={`w-7 h-7 ${stat.bgClass} rounded-lg flex items-center justify-center shrink-0`}>
                    {stat.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">{stat.label}</p>
                    <p className="text-xs font-black text-slate-800 mt-1 leading-none truncate max-w-[65px]" title={String(stat.value)}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation links */}
            <div className="pt-4 text-left">
              <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest mb-3">{roleConfig.consoleLabel}</p>
              <div className="space-y-1.5">
                {navItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(item.view)}
                    className={`w-full text-left py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2.5 border-0 bg-transparent cursor-pointer transition ${
                      currentView === item.view 
                        ? 'bg-[#e8f7f0] text-[#10b981]' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Footer of Sidebar */}
          <div className="space-y-2">
            <button
              onClick={handleLogout}
              className="w-full text-left py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2.5 text-red-500 hover:bg-red-50/50 hover:text-red-600 transition border-0 bg-transparent cursor-pointer"
            >
              <LogOut size={15} />
              Logout
            </button>
            

          </div>
        </aside>

        {/* Main stage inside two column format */}
        <div className="flex-1 h-screen overflow-y-auto bg-[#fafbfc]">
          <main className="flex-1">
            {/* LANDING VIEW */}
            {currentView === 'landing' && (
              <LandingView
                onNavigate={navigate}
                onDemoLogin={handleDemoLogin}
              />
            )}

            {/* AUTH VIEWS */}
            {currentView === 'login' && (
              <AuthView
                initialMode="login"
                onAuthSuccess={handleAuthSuccess}
                onNavigate={navigate}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
              />
            )}

            {/* AUTH SIGNUP */}
            {currentView === 'signup' && (
              <AuthView
                initialMode="signup"
                onAuthSuccess={handleAuthSuccess}
                onNavigate={navigate}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
              />
            )}

            {/* FULL SCREEN INTERACTIVE LIVE MAP */}
            {currentView === 'live-map' && (
              <LiveMapView
                issues={mapIssues}
                onSelectIssue={(issue) => {
                  navigate(`issue-details-${issue.id}`);
                }}
              />
            )}

            {/* ANALYTICS */}
            {currentView === 'analytics' && (
              <AnalyticsView
                onNavigate={navigate}
              />
            )}

            {/* LEADERBOARD */}
            {currentView === 'leaderboard' && (
              <LeaderboardView
                currentUser={currentUser}
                onNavigate={navigate}
              />
            )}

            {/* WIZARD FLOW */}
            {currentView === 'report-issue' && (
              <ReportIssueView
                onNavigate={navigate}
              />
            )}

            {/* CITIZEN DASHBOARD */}
            {currentView === 'citizen-dashboard' && (
              <CitizenDashboard
                currentUser={currentUser}
                onNavigate={navigate}
                onRefreshUser={checkSession}
              />
            )}

            {/* VERIFICATION QUEUE */}
            {currentView === 'verification-queue' && (
              <VerificationQueue
                currentUser={currentUser}
                onNavigate={navigate}
                onRefreshUser={checkSession}
              />
            )}

            {/* AUTHORITY CONSOLE */}
            {currentView === 'authority-dashboard' && (
              <AuthorityDashboard
                currentUser={currentUser}
                onNavigate={navigate}
              />
            )}

            {/* ADMIN PANEL */}
            {currentView === 'admin-panel' && (
              <AdminPanel
                currentUser={currentUser}
                onNavigate={navigate}
                onRefreshUser={checkSession}
              />
            )}

            {/* DYNAMIC ISSUE DETAILS VIEW */}
            {isIssueDetailsRoute && (
              <IssueDetailsView
                issueId={matchedIssueId}
                currentUser={currentUser}
                onNavigate={navigate}
              />
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-50 min-h-screen flex flex-col font-sans antialiased text-slate-800 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Sticky Top Header Navigation */}
      {!isAuthPage && (
        <div className="sticky top-0 z-[1010] w-full pointer-events-none">
          <header className="w-full bg-white border-b border-slate-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)] backdrop-blur-md bg-white/95 h-18 flex items-center justify-between px-6 md:px-8 pointer-events-auto">
            
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-4">
              {/* Menu Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg cursor-pointer transition flex items-center justify-center shrink-0 border-0 bg-transparent focus:outline-none"
              >
                <Menu size={20} />
              </button>

              {/* Logo Badge & Name */}
              <div onClick={() => navigate('landing')} className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0">
                <div className="w-9 h-9 rounded-lg bg-[#10b981] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition duration-200">
                  <Shield size={18} className="text-white fill-white/10" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[14px] tracking-tight text-slate-800 leading-tight">
                    CivicNet
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                    Together, we build better cities
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Desktop Nav Items */}
            <nav className="hidden xl:flex items-center gap-6 text-[13px] font-semibold text-slate-600 h-full">
              <button
                onClick={() => navigate('landing')}
                className={`h-full px-2 transition flex items-center gap-1.5 cursor-pointer border-0 bg-transparent relative focus:outline-none ${
                  currentView === 'landing' 
                    ? 'text-emerald-600 font-bold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Home size={15} /> <span>Home</span>
                {currentView === 'landing' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#10b981] rounded-t-full" />
                )}
              </button>

              <button
                onClick={() => navigate('live-map')}
                className={`h-full px-2 transition flex items-center gap-1.5 cursor-pointer border-0 bg-transparent relative focus:outline-none ${
                  currentView === 'live-map' 
                    ? 'text-emerald-600 font-bold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <MapIcon size={15} /> <span>Live Map</span>
                {currentView === 'live-map' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#10b981] rounded-t-full" />
                )}
              </button>

              <button
                onClick={() => navigate('analytics')}
                className={`h-full px-2 transition flex items-center gap-1.5 cursor-pointer border-0 bg-transparent relative focus:outline-none ${
                  currentView === 'analytics' 
                    ? 'text-emerald-600 font-bold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <BarChart3 size={15} className={currentView === 'analytics' ? 'text-[#10b981]' : ''} /> <span>Analytics</span>
                {currentView === 'analytics' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#10b981] rounded-t-full" />
                )}
              </button>

              <button
                onClick={() => navigate('leaderboard')}
                className={`h-full px-2 transition flex items-center gap-1.5 cursor-pointer border-0 bg-transparent relative focus:outline-none ${
                  currentView === 'leaderboard' 
                    ? 'text-emerald-600 font-bold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Trophy size={15} /> <span>Leaderboard</span>
                {currentView === 'leaderboard' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#10b981] rounded-t-full" />
                )}
              </button>
            </nav>

            {/* Right: Search, Notifications, Theme, Profile */}
            <div className="flex items-center gap-3 md:gap-4">
              
              {/* Search pill input */}
              <div className="hidden lg:flex items-center bg-slate-50/80 border border-slate-200/80 rounded-lg px-3 py-1.5 w-60 xl:w-64 focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:border-emerald-500/30 transition duration-150">
                <input
                  type="text"
                  placeholder="Search reports, insights, areas..."
                  className="w-full bg-transparent text-[11px] text-slate-700 placeholder-slate-400 outline-none border-0 p-0 focus:ring-0 focus:outline-none"
                />
                <Search size={13} className="text-slate-400 ml-1.5 cursor-pointer shrink-0" />
              </div>

              {/* Notification Bell Badge */}
              <button
                onClick={() => {
                  if (currentUser) {
                    navigate('citizen-dashboard');
                  } else {
                    navigate('login');
                  }
                }}
                className="relative w-8 h-8 rounded-full border border-slate-200/60 bg-white flex items-center justify-center text-slate-500 hover:text-slate-950 hover:bg-slate-50 transition cursor-pointer border-0 focus:outline-none shrink-0"
              >
                <Bell size={15} />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#10b981] text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                  3
                </span>
              </button>

              {/* Sun/Moon Theme switcher button */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-8 h-8 rounded-full border border-slate-200/60 bg-white flex items-center justify-center text-slate-500 hover:text-slate-950 hover:bg-slate-50 transition cursor-pointer border-0 focus:outline-none shrink-0"
              >
                {isDarkMode ? <Moon size={15} /> : <Sun size={15} />}
              </button>

              {/* Profile Card dropdown style */}
              <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex items-center gap-2 hover:opacity-90 transition cursor-pointer border-0 bg-transparent focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shadow-sm flex items-center justify-center shrink-0">
                    <img
                      src={currentUser ? getUserAvatar(currentUser) : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120"}
                      alt="User profile"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      {currentUser ? currentUser.name : "Rohan Verma"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                      {currentUser ? (currentUser.role === 'admin' ? 'Municipal Director' : currentUser.role === 'authority' ? 'Municipal Officer' : 'Active Citizen') : "Municipal Officer"}
                    </span>
                  </div>
                  <ChevronDown size={13} className="text-slate-400 hidden md:block shrink-0" />
                </button>
              </div>

            </div>

          </header>
        </div>
      )}

      {/* Animated Sliding Side Drawer (Left Side) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm z-[2000] pointer-events-auto cursor-pointer"
            />

            {/* Slide-out panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-80 md:w-96 bg-white shadow-2xl z-[2010] pointer-events-auto flex flex-col justify-between overflow-hidden border-r border-slate-100"
            >
              {/* Content inside panel */}
              <div className="flex-1 flex flex-col overflow-y-auto">
                {/* Drawer Header */}
                <div className="p-5 flex items-center justify-between border-b border-slate-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/15">
                      <Building2 size={16} className="text-white" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                      CivicNet
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition border-0 bg-transparent cursor-pointer focus:outline-none"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Drawer User Profile Section */}
                <div className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-4">
                  {currentUser ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getUserAvatar(currentUser)}
                          alt="User avatar"
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/20"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {currentUser.name}
                          </h4>
                          <p className="text-xs text-slate-500 truncate max-w-[180px] font-medium leading-tight">
                            {currentUser.email}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                            {currentUser.role}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Citizen Stats */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="bg-white border border-slate-100 p-2.5 rounded-xl flex items-center gap-2 shadow-sm">
                          <Trophy size={14} className="text-amber-500 shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Points</p>
                            <p className="text-xs font-black text-slate-800 leading-none mt-1">{currentUser.points || 0}</p>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-100 p-2.5 rounded-xl flex items-center gap-2 shadow-sm">
                          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Trust</p>
                            <p className="text-xs font-black text-slate-800 leading-none mt-1">{currentUser.trustScore || 50}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Welcome, Guest</h4>
                        <p className="text-xs text-slate-400 font-medium">Log in to track reports & earn community points!</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nav Links */}
                <div className="p-5 space-y-5">
                  {/* General Section */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Navigation</p>
                    <button
                      onClick={() => {
                        navigate('landing');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-2.5 border-0 bg-transparent cursor-pointer transition ${
                        currentView === 'landing' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Home size={15} /> Home
                    </button>
                    <button
                      onClick={() => {
                        navigate('live-map');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-2.5 border-0 bg-transparent cursor-pointer transition ${
                        currentView === 'live-map' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <MapIcon size={15} /> Live Map
                    </button>
                    <button
                      onClick={() => {
                        navigate('analytics');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-2.5 border-0 bg-transparent cursor-pointer transition ${
                        currentView === 'analytics' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <BarChart3 size={15} /> Analytics
                    </button>
                    <button
                      onClick={() => {
                        navigate('leaderboard');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-2.5 border-0 bg-transparent cursor-pointer transition ${
                        currentView === 'leaderboard' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Trophy size={15} /> Leaderboard
                    </button>
                  </div>

                  {/* Console & Roles Specific Actions */}
                  {currentUser && (
                    <div className="space-y-2 pt-1 border-t border-slate-50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Citizen Console</p>
                      <button
                        onClick={() => {
                          navigate('citizen-dashboard');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-2.5 border-0 bg-transparent cursor-pointer transition ${
                          currentView === 'citizen-dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <UserIcon size={15} /> My Console
                      </button>
                      <button
                        onClick={() => {
                          navigate('report-issue');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left py-2 px-3 rounded-xl font-bold text-xs text-emerald-600 hover:bg-emerald-50/50 flex items-center gap-2.5 border-0 bg-transparent cursor-pointer transition"
                      >
                        <PlusCircle size={15} /> Report an Issue
                      </button>

                      {/* Special Roles */}
                      {['verifier', 'admin'].includes(currentUser.role) && (
                        <button
                          onClick={() => {
                            navigate('verification-queue');
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-left py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-2.5 border-0 bg-transparent cursor-pointer transition ${
                            currentView === 'verification-queue' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <ShieldCheck size={15} /> Verification Queue
                        </button>
                      )}

                      {['authority', 'admin'].includes(currentUser.role) && (
                        <button
                          onClick={() => {
                            navigate('authority-dashboard');
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-left py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-2.5 border-0 bg-transparent cursor-pointer transition ${
                            currentView === 'authority-dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Wrench size={15} /> Authority Command
                        </button>
                      )}

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            navigate('admin-panel');
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-left py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-2.5 border-0 bg-transparent cursor-pointer transition ${
                            currentView === 'admin-panel' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Settings size={15} /> Admin panel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Section of Drawer */}
              <div className="p-5 border-t border-slate-50 bg-slate-50/30">
                {currentUser ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition cursor-pointer border-0 flex items-center justify-center gap-2"
                  >
                    <LogOut size={15} /> Log Out
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        navigate('login');
                        setMobileMenuOpen(false);
                      }}
                      className="py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs cursor-pointer bg-white transition"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        navigate('signup');
                        setMobileMenuOpen(false);
                      }}
                      className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer transition"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Container Stage View */}
      <main className="flex-1">
        
        {/* LANDING VIEW */}
        {currentView === 'landing' && (
          <LandingView
            onNavigate={navigate}
            onDemoLogin={handleDemoLogin}
          />
        )}

        {/* AUTH VIEWS */}
        {currentView === 'login' && (
          <AuthView
            initialMode="login"
            onAuthSuccess={handleAuthSuccess}
            onNavigate={navigate}
          />
        )}

        {currentView === 'signup' && (
          <AuthView
            initialMode="signup"
            onAuthSuccess={handleAuthSuccess}
            onNavigate={navigate}
          />
        )}

        {/* FULL SCREEN INTERACTIVE LIVE MAP */}
        {currentView === 'live-map' && (
          <div className="max-w-7xl mx-auto py-8 px-6 font-sans space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <MapIcon className="text-emerald-500" /> Full Screen Civic Radar Map
              </h1>
              <p className="text-xs text-slate-500 font-medium">Browse, search, and click on active civic problems flagged across regional Jaipur.</p>
            </div>

            <div className="relative h-[600px] rounded-3xl overflow-hidden border border-gray-250 shadow-xl">
              <MapComponent
                issues={mapIssues}
                onSelectIssue={(issue) => {
                  navigate(`issue-details-${issue.id}`);
                }}
              />
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {currentView === 'analytics' && (
          <AnalyticsView
            onNavigate={navigate}
          />
        )}

        {/* LEADERBOARD */}
        {currentView === 'leaderboard' && (
          <LeaderboardView
            currentUser={currentUser}
            onNavigate={navigate}
          />
        )}

        {/* WIZARD FLOW */}
        {currentView === 'report-issue' && (
          <ReportIssueView
            onNavigate={navigate}
          />
        )}

        {/* CITIZEN DASHBOARD */}
        {currentView === 'citizen-dashboard' && (
          <CitizenDashboard
            currentUser={currentUser}
            onNavigate={navigate}
            onRefreshUser={checkSession}
          />
        )}

        {/* VERIFICATION QUEUE */}
        {currentView === 'verification-queue' && (
          <VerificationQueue
            currentUser={currentUser}
            onNavigate={navigate}
            onRefreshUser={checkSession}
          />
        )}

        {/* AUTHORITY CONSOLE */}
        {currentView === 'authority-dashboard' && (
          <AuthorityDashboard
            currentUser={currentUser}
            onNavigate={navigate}
          />
        )}

        {/* ADMIN PANEL */}
        {currentView === 'admin-panel' && (
          <AdminPanel
            currentUser={currentUser}
            onNavigate={navigate}
            onRefreshUser={checkSession}
          />
        )}

        {/* DYNAMIC ISSUE DETAILS VIEW */}
        {isIssueDetailsRoute && (
          <IssueDetailsView
            issueId={matchedIssueId}
            currentUser={currentUser}
            onNavigate={navigate}
          />
        )}

      </main>

      {/* Humble Footer */}
      {!isAuthPage && (
        <footer className="bg-white border-t border-gray-150 py-8 text-center text-slate-400 text-xs font-light">
          <div className="max-w-7xl mx-auto px-6 space-y-1.5">
            <p className="font-bold text-slate-600 flex items-center justify-center gap-1.5">
              <Building2 size={14} className="text-emerald-600" /> CivicNet — Jaipur Municipal Ledger Console
            </p>
            <p>Decentralized community consensus, AI routing, and transparent resolution proofs.</p>
          </div>
        </footer>
      )}

    </div>
  );
}
