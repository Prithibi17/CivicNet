import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import { User, UserRole } from '../shared-types.js';
import { auth, googleProvider, signInWithPopup } from '../firebase.js';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeftRight, 
  User as UserIcon, 
  Shield, 
  AlertTriangle, 
  ShieldCheck, 
  Trophy, 
  TrendingUp, 
  Sparkles, 
  Building2, 
  Search, 
  Map, 
  ShieldAlert, 
  CheckCircle2, 
  Moon, 
  Sun, 
  MapPin, 
  Lightbulb, 
  Droplets, 
  Grid, 
  FileText, 
  Upload, 
  Plus 
} from 'lucide-react';
import SignupMapSelector from './SignupMapSelector.js';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
  onNavigate: (view: string) => void;
  initialMode?: 'login' | 'signup' | 'forgot';
  isDarkMode?: boolean;
  setIsDarkMode?: (dark: boolean) => void;
}

const CityIllustration = () => (
  <div className="w-16 h-16 rounded-full bg-emerald-50/75 border border-emerald-100/50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative">
    {/* Sun or Soft Glow */}
    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-400/20 blur-[1px]" />
    <svg viewBox="0 0 100 100" className="w-12 h-12 text-[#10b981]">
      {/* Clouds */}
      <path d="M20,40 Q25,35 30,40 Q35,35 40,40" fill="none" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" className="opacity-60" />
      <path d="M65,30 Q70,25 75,30 Q80,25 85,30" fill="none" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" className="opacity-60" />
      
      {/* Birds */}
      <path d="M22,25 Q25,22 28,25 Q31,22 34,25" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" className="opacity-80" />
      <path d="M52,18 Q55,15 58,18 Q61,15 64,18" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" className="opacity-80" />
      
      {/* Buildings Silhouettes */}
      {/* Left House */}
      <rect x="15" y="65" width="15" height="20" rx="2" fill="#34d399" className="opacity-40" />
      <polygon points="12,65 22,55 33,65" fill="#059669" className="opacity-50" />
      
      {/* Central Skyscraper */}
      <rect x="38" y="40" width="24" height="45" rx="3" fill="#059669" className="opacity-85" />
      {/* Windows on skyscraper */}
      <rect x="44" y="48" width="4" height="4" rx="1" fill="#ffffff" className="opacity-60" />
      <rect x="52" y="48" width="4" height="4" rx="1" fill="#ffffff" className="opacity-60" />
      <rect x="44" y="56" width="4" height="4" rx="1" fill="#ffffff" className="opacity-60" />
      <rect x="52" y="56" width="4" height="4" rx="1" fill="#ffffff" className="opacity-60" />
      <rect x="44" y="64" width="4" height="4" rx="1" fill="#ffffff" className="opacity-60" />
      <rect x="52" y="64" width="4" height="4" rx="1" fill="#ffffff" className="opacity-60" />
      <rect x="44" y="72" width="4" height="4" rx="1" fill="#ffffff" className="opacity-60" />
      <rect x="52" y="72" width="4" height="4" rx="1" fill="#ffffff" className="opacity-60" />
      
      {/* Right Building */}
      <rect x="68" y="55" width="18" height="30" rx="2" fill="#10b981" className="opacity-65" />
      {/* Windows */}
      <rect x="72" y="62" width="3" height="3" rx="0.5" fill="#ffffff" className="opacity-50" />
      <rect x="79" y="62" width="3" height="3" rx="0.5" fill="#ffffff" className="opacity-50" />
      <rect x="72" y="70" width="3" height="3" rx="0.5" fill="#ffffff" className="opacity-50" />
      <rect x="79" y="70" width="3" height="3" rx="0.5" fill="#ffffff" className="opacity-50" />
      <rect x="72" y="78" width="3" height="3" rx="0.5" fill="#ffffff" className="opacity-50" />
      <rect x="79" y="78" width="3" height="3" rx="0.5" fill="#ffffff" className="opacity-50" />
      
      {/* Trees at bottom */}
      <circle cx="34" cy="80" r="7" fill="#047857" className="opacity-90" />
      <circle cx="66" cy="82" r="6" fill="#047857" className="opacity-90" />
      <circle cx="28" cy="83" r="5" fill="#34d399" className="opacity-80" />
    </svg>
  </div>
);

const issueCategories = [
  {
    title: 'Street Light',
    desc: 'Not Working',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H7a2 2 0 0 0-2 2v2h14V7a2 2 0 0 0-2-2z" className="text-emerald-600" />
        <path d="M9 9h6v3a3 3 0 0 1-6 0z" fill="#FBBF24" className="text-amber-400" />
        <path d="M6 16l-2 3M18 16l2 3M12 16v4" stroke="#FBBF24" />
      </svg>
    ),
    iconBg: 'bg-[#EBFDFA] border-[#CCFBF1]',
    shape: 'rounded-tl-[32px] rounded-br-[32px] rounded-tr-[12px] rounded-bl-[12px]',
    color: 'from-[#EBFDFA]/50 to-white border-white hover:border-teal-300 hover:shadow-lg',
    btnColor: 'bg-[#0D5C4E]'
  },
  {
    title: 'Road',
    desc: 'Repairs',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="5,20 10,4 14,4 19,20" fill="#475569" stroke="#334155" strokeWidth="1" />
        <line x1="12" y1="5" x2="12" y2="10" stroke="#FDE047" strokeWidth="1.5" strokeDasharray="2" />
        <line x1="12" y1="13" x2="12" y2="19" stroke="#FDE047" strokeWidth="2" strokeDasharray="2" />
      </svg>
    ),
    iconBg: 'bg-[#EBFDFA] border-[#CCFBF1]',
    shape: 'rounded-t-[32px] rounded-b-[16px]',
    color: 'from-[#EBFDFA]/40 to-white border-white hover:border-teal-300 hover:shadow-lg',
    btnColor: 'bg-[#0D5C4E]'
  },
  {
    title: 'Water',
    desc: 'Leakage',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h4" stroke="#475569" />
        <path d="M8 12h8a2 2 0 0 0 2-2V8h-2" fill="#94A3B8" stroke="#475569" />
        <path d="M12 6V4" stroke="#475569" strokeWidth="2" />
        <path d="M10 4h4" stroke="#475569" strokeWidth="1.5" />
        <path d="M12 14v2a2 2 0 1 0 4 0c0-1.5-2-3-2-3s-2 1.5-2 3z" fill="#3B82F6" stroke="#2563EB" strokeWidth="1" />
      </svg>
    ),
    iconBg: 'bg-[#EFF6FF] border-[#DBEAFE]',
    shape: 'rounded-tr-[32px] rounded-bl-[32px] rounded-tl-[12px] rounded-br-[12px]',
    color: 'from-[#EFF6FF]/50 to-white border-white hover:border-blue-300 hover:shadow-lg',
    btnColor: 'bg-blue-600'
  },
  {
    title: 'Other',
    desc: 'Issues',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="2" stroke="#8B5CF6" fill="#F5F3FF" />
        <rect x="14" y="3" width="7" height="7" rx="2" stroke="#8B5CF6" fill="#F5F3FF" />
        <rect x="3" y="14" width="7" height="7" rx="2" stroke="#8B5CF6" fill="#F5F3FF" />
        <rect x="14" y="14" width="7" height="7" rx="2" stroke="#8B5CF6" fill="#F5F3FF" />
      </svg>
    ),
    iconBg: 'bg-[#F5F3FF] border-[#EDE9FE]',
    shape: 'rounded-[24px] rounded-tr-[8px] rounded-bl-[8px]',
    color: 'from-[#F5F3FF]/40 to-white border-white hover:border-purple-300 hover:shadow-lg',
    btnColor: 'bg-purple-600'
  }
];

export default function AuthView({ onAuthSuccess, onNavigate, initialMode = 'login', isDarkMode = false, setIsDarkMode }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [region, setRegion] = useState('Jaipur Central');
  const [role, setRole] = useState<UserRole>('citizen');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Segmented toggle helper
  const [activeTab, setActiveTab] = useState<'citizen' | 'government'>('citizen');

  // Extra signup fields for Authority and Verifier applications
  const [submittedDocumentName, setSubmittedDocumentName] = useState('');
  const [submittedDocumentText, setSubmittedDocumentText] = useState('');
  const [submittedDocumentUrl, setSubmittedDocumentUrl] = useState('');
  const [designatedAreaName, setDesignatedAreaName] = useState('');
  const [designatedAreaCoordinates, setDesignatedAreaCoordinates] = useState<[number, number][]>([]);
  const [verifierTargetAuthorityId, setVerifierTargetAuthorityId] = useState('');
  const [authoritiesList, setAuthoritiesList] = useState<any[]>([]);
  const [isApplicationSubmitted, setIsApplicationSubmitted] = useState(false);
  const [applicationSubmittedMessage, setApplicationSubmittedMessage] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);

  // Fetch authorities when role changes to 'verifier'
  useEffect(() => {
    if (role === 'verifier') {
      api.getPublicAuthorities()
        .then(res => {
          setAuthoritiesList(res.authorities || []);
          if (res.authorities && res.authorities.length > 0) {
            setVerifierTargetAuthorityId(res.authorities[0].id);
          }
        })
        .catch(err => {
          console.error('Error fetching public authorities:', err);
        });
    }
  }, [role]);

  // Sync tab with role on change
  useEffect(() => {
    if (role === 'citizen') {
      setActiveTab('citizen');
    } else {
      setActiveTab('government');
    }
  }, [role]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('ch_user', JSON.stringify(res.user));
      onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const signupData = {
        name,
        email,
        password,
        role,
        region: role === 'authority' ? designatedAreaName : region,
        submittedDocumentName,
        submittedDocumentText,
        submittedDocumentUrl,
        designatedAreaName,
        designatedAreaCoordinates,
        verifierTargetAuthorityId
      };

      const res = await api.signup(signupData);

      if (role === 'citizen') {
        localStorage.setItem('ch_user', JSON.stringify(res.user));
        onAuthSuccess(res.user);
      } else {
        setIsApplicationSubmitted(true);
        if (role === 'authority') {
          setApplicationSubmittedMessage(`Your authority account application has been submitted to the Admin successfully! Please provide your documents to the Admin. Once verified, your account will be activated, and you can log in.`);
        } else {
          const targetAuthName = authoritiesList.find(a => a.id === verifierTargetAuthorityId)?.name || 'the selected Authority';
          setApplicationSubmittedMessage(`Your verifier application under "${targetAuthName}" has been submitted successfully! Once the authority verifies and approves your credentials, your account will be activated, and you can log in.`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSuccessMessage(res.message || 'Reset instructions sent successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to request reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fUser = result.user;
      if (!fUser.email) {
        throw new Error("No email returned from Google Sign-In");
      }
      const res = await api.firebaseLogin({
        email: fUser.email,
        name: fUser.displayName || 'Google User',
        uid: fUser.uid
      });
      localStorage.setItem('ch_user', JSON.stringify(res.user));
      onAuthSuccess(res.user);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const triggerDemoLogin = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email: demoEmail, password: 'Demo1234!' });
      localStorage.setItem('ch_user', JSON.stringify(res.user));
      onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen lg:h-screen lg:max-h-screen flex flex-col lg:flex-row font-sans antialiased text-slate-800 lg:overflow-hidden relative bg-gradient-to-tr from-[#E6F4F1] via-[#F0FDF4] to-[#E2F1ED]"
    >
      
      {/* Left Column: Splash Screen (Hidden on mobile/tablet) */}
      <div 
        className="hidden lg:flex lg:w-[48%] bg-cover bg-center flex-col justify-between p-10 relative h-full shrink-0 select-none overflow-hidden z-10"
        style={{ 
          backgroundImage: `url('https://images.pexels.com/photos/32702973/pexels-photo-32702973.jpeg')`,
        }}
      >
        {/* Soft elegant gradient overlay to blend illustration and make content highly readable */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-white/20 to-transparent z-0 pointer-events-none" />
        
        {/* Top Header Logo */}
        <div 
          onClick={() => onNavigate('landing')} 
          className="flex items-center gap-3.5 cursor-pointer relative z-10 group w-fit"
          id="hero-logo-badge"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#0D5C4E] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition duration-300">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <circle cx="12" cy="10" r="3" />
              <path d="M12 13c-2 0-3.5 1-3.5 3h7c0-2-1.5-3-3.5-3z" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-[20px] tracking-tight text-slate-900 leading-none">
              CivicNet
            </span>
            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-1">
              Report. Resolve. Rebuild.
            </span>
          </div>
        </div>

        {/* Hero Typography */}
        <div className="relative z-10 my-auto space-y-5 max-w-xl py-8 text-left">
          <h1 className="text-4xl xl:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Together, <br />
            we build a <br />
            <span className="text-[#0D5C4E] relative inline-block">
              better community.
              <span className="absolute -bottom-1.5 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 rounded-full opacity-85" style={{ transform: 'rotate(-1.2deg)' }} />
            </span>
          </h1>
          <p className="text-slate-600 text-sm font-semibold leading-relaxed max-w-sm">
            Report local issues and help us create a safer, cleaner and stronger neighborhood.
          </p>

          {/* Issue Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 w-full max-w-2xl">
            {issueCategories.map((cat, idx) => (
              <div 
                key={idx}
                className={`p-4 bg-white/75 backdrop-blur-md border border-white/60 ${cat.shape} transition-all duration-300 flex flex-col justify-between h-[120px] group shadow-xs hover:shadow-md cursor-pointer`}
              >
                <div className={`w-10 h-10 rounded-xl ${cat.iconBg} border flex items-center justify-center shadow-xs transition group-hover:scale-105`}>
                  {cat.icon}
                </div>
                <div className="flex items-end justify-between mt-2">
                  <div className="text-left">
                    <p className="text-[11px] font-extrabold text-[#1E293B] leading-none">{cat.title}</p>
                    <p className="text-[9px] text-[#64748B] font-bold leading-none mt-1">{cat.desc}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full ${cat.btnColor} flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition`}>
                    <ArrowRight size={12} className="stroke-[3]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Trust Badge */}
        <div className="relative z-10 mt-auto w-full max-w-2xl">
          <div className="bg-white/75 backdrop-blur-md border border-white/60 rounded-3xl p-3 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E6F4EA] text-[#0D5C4E] flex items-center justify-center border border-[#A7F3D0]/50 shadow-inner">
                <ShieldCheck size={20} className="stroke-[2.5]" />
              </div>
              <div className="text-left">
                <p className="text-xs font-extrabold text-slate-800 leading-tight">Every report you make</p>
                <p className="text-[10px] text-slate-500 font-bold leading-none mt-0.5">helps us serve you better.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                <img className="w-8 h-8 rounded-full border border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop" alt="Citizen Avatar" />
                <img className="w-8 h-8 rounded-full border border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop" alt="Citizen Avatar" />
                <img className="w-8 h-8 rounded-full border border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop" alt="Citizen Avatar" />
              </div>
              <div className="text-left pl-1">
                <p className="text-sm font-black text-[#0D5C4E] leading-none">12.5K+</p>
                <p className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider leading-none mt-1">Active Citizens</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Redesigned Login Card stage */}
      <div className="flex-1 flex flex-col justify-between p-4 md:p-8 bg-transparent lg:h-full lg:overflow-y-auto z-10">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between lg:justify-end gap-6 mb-6 lg:mb-0 shrink-0">
          {/* Logo visible only on mobile/tablet */}
          <div onClick={() => onNavigate('landing')} className="flex lg:hidden items-center gap-2.5 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-[#0D5C4E] text-white flex items-center justify-center shadow-md">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900">
              CivicNet
            </span>
          </div>
        </div>

        {/* Sculpted Auth Card Container */}
        <div 
          className="max-w-lg w-full mx-auto my-auto bg-white p-8 md:p-10 rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.06)] space-y-6 relative overflow-hidden text-left"
          id="sculpted-auth-card"
        >

          {/* Welcome back / Headline & City Illustration */}
          <div className="flex items-center gap-4 relative z-10">
            <CityIllustration />
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {mode === 'login' && 'Welcome back! 👋'}
                {mode === 'signup' && 'Create account! 🚀'}
                {mode === 'forgot' && 'Reset password! 🔒'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                {mode === 'login' && 'Sign in to continue your impact'}
                {mode === 'signup' && 'Register your profile to help Jaipur'}
                {mode === 'forgot' && 'Enter your email to request recovery link'}
              </p>
            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-150 rounded-2xl text-xs text-red-600 flex items-center gap-2 relative z-10 animate-in fade-in slide-in-from-top-1 duration-200 font-medium">
              <ShieldAlert size={15} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-2xl text-xs text-emerald-600 flex items-center gap-2 relative z-10 animate-in fade-in slide-in-from-top-1 duration-200 font-medium">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Citizen / Government Role Switch Segmented Control */}
          {mode !== 'forgot' && !isApplicationSubmitted && (
            <div className="relative bg-[#F1F5F9] p-1.5 rounded-full flex items-center border border-[#E2E8F0] relative z-10 w-full select-none">
              {/* Circular Switch Button in middle with arrow */}
              <div 
                onClick={() => {
                  const nextTab = activeTab === 'citizen' ? 'government' : 'citizen';
                  setActiveTab(nextTab);
                  setRole(nextTab === 'citizen' ? 'citizen' : 'verifier');
                }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center z-20 cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                <ArrowLeftRight size={14} className="text-slate-800 stroke-[2.5]" />
              </div>

              {/* Citizen Switch */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('citizen');
                  setRole('citizen');
                }}
                className={`flex-1 py-3 px-6 rounded-full font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
                  activeTab === 'citizen'
                    ? 'bg-gradient-to-r from-[#0D5C4E] to-[#0A4D41] text-white shadow-md'
                    : 'text-[#64748B] hover:text-slate-800 bg-transparent'
                }`}
                id="role-switch-citizen"
              >
                <UserIcon size={14} className={activeTab === 'citizen' ? 'text-white' : 'text-[#64748B]'} />
                <span>Citizen</span>
              </button>

              {/* Government Switch */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('government');
                  setRole('verifier');
                }}
                className={`flex-1 py-3 px-6 rounded-full font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
                  activeTab === 'government'
                    ? 'bg-gradient-to-r from-[#0D5C4E] to-[#0A4D41] text-white shadow-md'
                    : 'text-[#64748B] hover:text-slate-800 bg-transparent'
                }`}
                id="role-switch-government"
              >
                <Building2 size={14} className={activeTab === 'government' ? 'text-white' : 'text-[#64748B]'} />
                <span>Government</span>
              </button>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 relative z-10" id="login-form">
              <div className="space-y-1.5 text-left">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email address or mobile number"
                    className="w-full pl-12 pr-6 py-3.5 bg-white border border-[#E2E8F0] rounded-full text-xs focus:outline-none focus:border-[#0D5C4E] focus:ring-1 focus:ring-[#0D5C4E]/20 transition-all shadow-xs placeholder-slate-400 font-medium"
                    id="input-login-email"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-12 pr-12 py-3.5 bg-white border border-[#E2E8F0] rounded-full text-xs focus:outline-none focus:border-[#0D5C4E] focus:ring-1 focus:ring-[#0D5C4E]/20 transition-all shadow-xs placeholder-slate-400 font-medium"
                    id="input-login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition bg-transparent border-0 focus:outline-none"
                    id="btn-toggle-pwd"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs font-bold text-[#0D5C4E] hover:text-[#0A4D41] focus:outline-none cursor-pointer bg-transparent border-0 font-sans pr-2"
                    id="btn-forgot-pwd"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Government Signup Sub-tabs inside login for direct guidance if needed */}
              {activeTab === 'government' && (
                <div className="p-3.5 bg-emerald-50/40 border border-emerald-150/40 rounded-2xl text-[11px] text-slate-600 leading-relaxed font-medium">
                  💡 Logging in as <span className="font-bold text-[#0D5C4E]">Government</span> accounts (Verifier/Authority/Admin) will route you straight to your executive consoles.
                </div>
              )}

              {/* Premium Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-[#0C6C5E] to-[#065A4F] hover:from-[#0A5A4E] hover:to-[#054B41] disabled:from-slate-300 disabled:to-slate-400 text-white font-extrabold rounded-full text-sm transition-all duration-300 cursor-pointer flex items-center p-2 relative group shadow-lg shadow-teal-950/15"
                id="btn-login-submit"
              >
                <div className="w-10 h-10 rounded-full bg-white text-[#0D5C4E] flex items-center justify-center shrink-0 shadow-md group-hover:translate-x-1 transition duration-300">
                  <ArrowRight size={18} className="stroke-[2.5]" />
                </div>
                
                <span className="flex-grow text-center pr-10 tracking-wide text-[15px]">
                  {loading ? 'Signing in...' : 'Sign in'}
                </span>
              </button>
            </form>
          )}

          {/* Signup Form */}
          {isApplicationSubmitted ? (
            <div className="space-y-5 text-center py-4 relative z-10 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                <CheckCircle2 size={32} className="text-emerald-500 animate-bounce" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Application Submitted!</h3>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-150 text-left font-medium">
                  {applicationSubmittedMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsApplicationSubmitted(false);
                  setMode('login');
                }}
                className="w-full py-2.5 bg-gradient-to-r from-[#16A34A] to-[#059669] text-white font-extrabold rounded-2xl text-xs transition duration-300 cursor-pointer shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/25"
                id="btn-application-return"
              >
                Return to Sign In
              </button>
            </div>
          ) : mode === 'signup' ? (
            <form onSubmit={handleSignup} className="space-y-4 relative z-10" id="signup-form">
              <div className="space-y-1 text-left">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserIcon size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full pl-12 pr-6 py-3.5 bg-white border border-[#E2E8F0] rounded-full text-xs focus:outline-none focus:border-[#0D5C4E] focus:ring-1 focus:ring-[#0D5C4E]/20 transition-all shadow-xs placeholder-slate-400 font-medium"
                    id="input-signup-name"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full pl-12 pr-6 py-3.5 bg-white border border-[#E2E8F0] rounded-full text-xs focus:outline-none focus:border-[#0D5C4E] focus:ring-1 focus:ring-[#0D5C4E]/20 transition-all shadow-xs placeholder-slate-400 font-medium"
                    id="input-signup-email"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password (Minimum 6 characters)"
                    className="w-full pl-12 pr-6 py-3.5 bg-white border border-[#E2E8F0] rounded-full text-xs focus:outline-none focus:border-[#0D5C4E] focus:ring-1 focus:ring-[#0D5C4E]/20 transition-all shadow-xs placeholder-slate-400 font-medium"
                    id="input-signup-password"
                  />
                </div>
              </div>

              {/* Sub role selector for government type */}
              {activeTab === 'government' && (
                <div className="space-y-1 text-left animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[11px] font-bold text-slate-600 px-2">Select Government Role</label>
                  <div className="flex bg-[#F1F5F9] p-1 rounded-full border border-slate-200/40">
                    <button
                      type="button"
                      onClick={() => setRole('verifier')}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                        role === 'verifier' 
                          ? 'bg-white text-[#0D5C4E] shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Verifier Application
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('authority')}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                        role === 'authority' 
                          ? 'bg-white text-[#0D5C4E] shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Authority Office
                    </button>
                  </div>
                </div>
              )}

              {/* CITIZEN SPECIFIC FIELDS */}
              {role === 'citizen' && (
                <div className="space-y-1 text-left animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Map size={16} />
                    </span>
                    <select
                      value={region}
                      onChange={e => setRegion(e.target.value)}
                      className="w-full pl-12 pr-10 py-3.5 bg-white border border-[#E2E8F0] rounded-full text-xs focus:outline-none focus:border-[#0D5C4E] focus:ring-1 focus:ring-[#0D5C4E]/20 transition-all appearance-none font-bold text-slate-700"
                      id="select-resident-zone"
                    >
                      <option value="Jaipur Central">Jaipur Central</option>
                      <option value="Malviya Nagar">Malviya Nagar</option>
                      <option value="Vaishali Nagar">Vaishali Nagar</option>
                      <option value="Bari Path">Bari Path</option>
                      <option value="Mansarovar">Mansarovar</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              )}

              {/* AUTHORITY SPECIFIC FIELDS */}
              {role === 'authority' && (
                <div className="space-y-3.5 bg-[#F8FAFC] p-4 rounded-[24px] border border-slate-150 animate-in fade-in slide-in-from-top-1 duration-300 text-left">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#0D5C4E]">Authority Jurisdiction & Documents</p>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 px-2">Jurisdiction Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jaipur Municipal Corporation"
                      value={designatedAreaName}
                      onChange={e => setDesignatedAreaName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  {/* Coverage area map selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 px-2">Coverage Boundary Selection</label>
                    <button
                      type="button"
                      onClick={() => setShowMapModal(true)}
                      className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-700 flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
                    >
                      🗺️ {designatedAreaCoordinates.length > 0 ? `✓ Area Defined (${designatedAreaCoordinates.length} Boundary Points)` : 'Designate Boundaries on Map'}
                    </button>
                    {designatedAreaCoordinates.length === 0 && (
                      <p className="text-[9px] text-red-500 font-bold px-2">* Designated boundary is required</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 px-2">Municipal Authorization Document Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Municipal Board Registration License"
                      value={submittedDocumentName}
                      onChange={e => setSubmittedDocumentName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 px-2">Verification Credentials / Department details</label>
                    <textarea
                      required
                      placeholder="Enter municipal zone department, licensing details and official credentials."
                      rows={2}
                      value={submittedDocumentText}
                      onChange={e => setSubmittedDocumentText(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[18px] text-xs focus:outline-none focus:border-emerald-500 resize-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 px-2">Official Scanning Certificate URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="https://example.com/certificate.pdf"
                        value={submittedDocumentUrl}
                        onChange={e => setSubmittedDocumentUrl(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs focus:outline-none focus:border-emerald-500 font-mono font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSubmittedDocumentName('Jaipur_Municipal_Authorization_Cert_2026.pdf');
                          setSubmittedDocumentUrl(`https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800`);
                          setSubmittedDocumentText('Jaipur Central Division Municipal License Reg #JMC-2026-X84B. Admin zone 4 administrative authorization.');
                        }}
                        className="px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 rounded-full text-[10px] font-bold transition shrink-0 cursor-pointer"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VERIFIER SPECIFIC FIELDS */}
              {role === 'verifier' && (
                <div className="space-y-3.5 bg-[#F8FAFC] p-4 rounded-[24px] border border-slate-150 animate-in fade-in slide-in-from-top-1 duration-300 text-left">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#0D5C4E]">Verifier Qualifications</p>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 px-2">Target Authority for Verification</label>
                    <div className="relative">
                      <select
                        value={verifierTargetAuthorityId}
                        onChange={e => setVerifierTargetAuthorityId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs focus:outline-none focus:border-emerald-500 font-bold text-slate-700 appearance-none"
                      >
                        {authoritiesList.length === 0 ? (
                          <option value="user-authority">Raj Sharma (Jaipur West Authority)</option>
                        ) : (
                          authoritiesList.map(auth => (
                            <option key={auth.id} value={auth.id}>
                              {auth.name} ({auth.designatedAreaName || auth.region || 'Authority Region'})
                            </option>
                          ))
                        )}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 px-2">Volunteer Experience / Community Work Details</label>
                    <textarea
                      required
                      placeholder="Briefly detail experience verifying reports, such as neighborhood leader, civil defense, or civil officer volunteer work."
                      rows={2}
                      value={submittedDocumentText}
                      onChange={e => setSubmittedDocumentText(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[18px] text-xs focus:outline-none focus:border-emerald-500 resize-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 px-2">Government Volunteer ID Card / Photo Scan URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="https://example.com/volunteer-id.jpg"
                        value={submittedDocumentUrl}
                        onChange={e => setSubmittedDocumentUrl(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs focus:outline-none focus:border-emerald-500 font-mono font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSubmittedDocumentName('Jaipur_Civic_Defense_Volunteer_Card.jpg');
                          setSubmittedDocumentUrl(`https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800`);
                          setSubmittedDocumentText('Jaipur Civil Volunteer Reg #JCV-2026-921. 4 years neighborhood resident welfare association coordinator.');
                        }}
                        className="px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 rounded-full text-[10px] font-bold transition shrink-0 cursor-pointer"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (role === 'authority' && designatedAreaCoordinates.length === 0)}
                className="w-full h-14 bg-gradient-to-r from-[#0C6C5E] to-[#065A4F] hover:from-[#0A5A4E] hover:to-[#054B41] disabled:bg-slate-300 text-white font-extrabold rounded-full text-sm transition-all duration-300 cursor-pointer flex items-center p-2 relative group shadow-lg shadow-teal-950/15"
                id="btn-signup-submit"
              >
                <div className="w-10 h-10 rounded-full bg-white text-[#0D5C4E] flex items-center justify-center shrink-0 shadow-md group-hover:translate-x-1 transition duration-300">
                  <ArrowRight size={18} className="stroke-[2.5]" />
                </div>
                
                <span className="flex-grow text-center pr-10 tracking-wide text-[14px]">
                  {loading ? 'Submitting Application...' : role === 'citizen' ? 'Create Account' : 'Submit Application'}
                </span>
              </button>
            </form>
          ) : null}

          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4 relative z-10" id="forgot-form">
              <div className="space-y-1 text-left">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full pl-12 pr-6 py-3.5 bg-white border border-[#E2E8F0] rounded-full text-xs focus:outline-none focus:border-[#0D5C4E] focus:ring-1 focus:ring-[#0D5C4E]/20 transition-all shadow-xs placeholder-slate-400 font-medium"
                    id="input-forgot-email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-[#0C6C5E] to-[#065A4F] hover:from-[#0A5A4E] hover:to-[#054B41] disabled:bg-slate-300 text-white font-extrabold rounded-full text-sm transition-all duration-300 cursor-pointer flex items-center p-2 relative group shadow-lg shadow-teal-950/15"
                id="btn-forgot-submit"
              >
                <div className="w-10 h-10 rounded-full bg-white text-[#0D5C4E] flex items-center justify-center shrink-0 shadow-md group-hover:translate-x-1 transition duration-300">
                  <ArrowRight size={18} className="stroke-[2.5]" />
                </div>
                <span className="flex-grow text-center pr-10 tracking-wide text-[14px]">{loading ? 'Sending link...' : 'Send reset link'}</span>
              </button>
            </form>
          )}

          {/* Toggle modes link */}
          <div className="text-center pt-1 relative z-10">
            {mode === 'login' && (
              <p className="text-xs text-slate-500 font-bold">
                Not a member?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-extrabold text-[#0D5C4E] hover:text-[#0A4D41] cursor-pointer bg-transparent border-0 font-sans text-xs underline"
                  id="btn-switch-signup"
                >
                  Create an account
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-xs text-slate-500 font-bold">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-extrabold text-[#0D5C4E] hover:text-[#0A4D41] cursor-pointer bg-transparent border-0 font-sans text-xs underline"
                  id="btn-switch-login"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p className="text-xs text-slate-500 font-bold">
                Go back to{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-extrabold text-[#0D5C4E] hover:text-[#0A4D41] cursor-pointer bg-transparent border-0 font-sans text-xs underline"
                  id="btn-switch-login-back"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex py-1.5 items-center relative z-10 select-none">
            <div className="flex-grow border-t border-slate-150"></div>
            <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">OR</span>
            <div className="flex-grow border-t border-slate-150"></div>
          </div>

          {/* Google Sign-In Section */}
          <div className="space-y-3 relative z-10 text-center pt-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-all duration-300 font-extrabold text-xs cursor-pointer flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md text-slate-700 hover:text-slate-900 disabled:opacity-50 animate-fade-in"
              id="btn-google-signin"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
            <p className="text-[10px] text-slate-400 select-none font-semibold">
              Secure authentication powered by Google Firebase
            </p>
          </div>

        </div>

        {/* Map Modal */}
        {showMapModal && (
          <SignupMapSelector
            onClose={() => setShowMapModal(false)}
            onSave={(coords, name) => {
              setDesignatedAreaCoordinates(coords);
              setDesignatedAreaName(name);
              setShowMapModal(false);
            }}
            initialCoords={designatedAreaCoordinates}
            initialAreaName={designatedAreaName}
          />
        )}

        {/* Footer */}
        <div className="text-center text-[9px] text-slate-400 font-semibold tracking-wider uppercase pt-6 select-none shrink-0 relative z-10">
          Powered by CivicNet Consensus Protocol
        </div>
      </div>
    </div>
  );
}
