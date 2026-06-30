import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api.js';
import { Issue, User } from '../shared-types.js';
import {
  ShieldCheck,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Sliders,
  Award,
  Clock,
  Camera,
  ChevronDown,
  User as UserIcon,
  Activity
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  'Road Damage / Pothole': '#ef4444',
  'Road Damage': '#ef4444',
  'Water Leakage': '#3b82f6',
  'Streetlight Problem': '#f59e0b',
  'Garbage & Waste': '#10b981',
  'Drainage / Sewage': '#8b5cf6',
  'Traffic & Road Signs': '#f97316',
  'Parks & Recreation': '#22c55e',
  'Stray Animals / Safety': '#ec4899',
  'Air & Noise Pollution': '#14b8a6',
  'Vandalism & Graffiti': '#06b6d4',
  'Public Transit & Bus Stops': '#6366f1',
  'Public Health & Encroachments': '#64748b',
  'Public Infrastructure / Other': '#6b7280',
  'Public Infrastructure': '#6b7280'
};

interface MiniIssueMapProps {
  latitude: number;
  longitude: number;
  category: string;
}

function MiniIssueMap({ latitude, longitude, category }: MiniIssueMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    // Create map
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: true,
    });

    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Map data &copy; Google'
    }).addTo(map);

    const color = CATEGORY_COLORS[category] || '#6b7280';

    // Add high fidelity custom pin icon with animated ping
    const pinIcon = L.divIcon({
      className: 'custom-mini-pin',
      html: `
        <div style="
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background-color: ${color};
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
          <div style="
            position: absolute;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid ${color};
            animation: mini-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            opacity: 0.7;
          "></div>
        </div>
        <style>
          @keyframes mini-ping {
            75%, 100% {
              transform: scale(2);
              opacity: 0;
            }
          }
        </style>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    mapRef.current = map;

    // Invalidate size after brief timeout to make sure it loads fully in expanding containers
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, category]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-48 sm:h-64 rounded-2xl border border-slate-200 bg-slate-50 shadow-inner overflow-hidden relative z-10" 
    />
  );
}

interface VerificationQueueProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onRefreshUser: () => void;
}

export default function VerificationQueue({ currentUser, onNavigate, onRefreshUser }: VerificationQueueProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [assignedIssues, setAssignedIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab: 'verification' (Awaiting Verification) or 'worksite' (Assigned)
  const [activeTab, setActiveTab] = useState<'verification' | 'worksite'>('verification');

  // Interactive inline expandable card
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  // Active review states (Tab 1)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [result, setResult] = useState<'confirm' | 'reject'>('confirm');
  const [confidence, setConfidence] = useState(1.0);
  const [note, setNote] = useState('');
  const [evidenceMediaUrl, setEvidenceMediaUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Active worksite tracking states (Tab 2)
  const [progressPhotoUrl, setProgressPhotoUrl] = useState('');
  const [progressNotes, setProgressNotes] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');

  const progressPhotoPresets = [
    { label: 'Asphalt & Paving', url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80' },
    { label: 'Leak Repairs', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80' },
    { label: 'Infrastructure Install', url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80' }
  ];

  const loadQueue = () => {
    setLoading(true);
    api.getIssues()
      .then(res => {
        // Queue issues that are in status: Awaiting Verification, Reported, or Reopened
        const queueIssues = res.issues.filter(
          i => ['Awaiting Verification', 'Reported', 'Reopened'].includes(i.status) && !i.duplicateOfIssueId
        );
        // Queue issues that are in Assigned status
        const assigned = res.issues.filter(
          i => i.status === 'Assigned' && !i.duplicateOfIssueId
        );
        setIssues(queueIssues);
        setAssignedIssues(assigned);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch verification queue.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleToggleExpand = (issue: Issue) => {
    if (expandedIssueId === issue.id) {
      setExpandedIssueId(null);
      setSelectedIssue(null);
    } else {
      setExpandedIssueId(issue.id);
      setSelectedIssue(issue);
      // Initialize forms state
      if (activeTab === 'verification') {
        setResult('confirm');
        setConfidence(1.0);
        setNote('');
        setEvidenceMediaUrl('');
      } else {
        setProgressPhotoUrl('');
        setProgressNotes('');
      }
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent, issue: Issue) => {
    e.preventDefault();
    if (!issue || !currentUser) return;

    setSubmitting(true);
    try {
      await api.verifyIssue(issue.id, {
        result,
        confidence,
        note,
        evidenceMediaUrl
      });
      alert(`Verification recorded successfully! Trust weight applied. Status has been updated to Verified.`);
      
      // Reset states
      setExpandedIssueId(null);
      setSelectedIssue(null);
      onRefreshUser(); // Reward points
      loadQueue(); // Refresh list
    } catch (err: any) {
      alert(err.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitWorksiteProgress = async (e: React.FormEvent, issue: Issue) => {
    e.preventDefault();
    if (!issue || !currentUser) return;
    if (!progressPhotoUrl) {
      alert('Photographic proof of crews actively working is required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.verifyProgress(issue.id, {
        progressPhotoUrl,
        notes: progressNotes
      });
      alert('Active worksite verified! Status transitioned to "In Progress" (in process).');
      
      // Reset states
      setExpandedIssueId(null);
      setSelectedIssue(null);
      setProgressPhotoUrl('');
      setProgressNotes('');
      onRefreshUser(); // Reward points
      loadQueue(); // Refresh list
    } catch (err: any) {
      alert(err.message || 'Failed to submit progress photo');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser || !['verifier', 'authority', 'admin'].includes(currentUser.role)) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <ShieldCheck size={48} className="text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Verifier credentials required</h2>
        <p className="text-xs text-slate-500">You must be logged in as a Verifier, Authority staff, or Admin to verify civic reports.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow"
        >
          Sign In
        </button>
      </div>
    );
  }

  const currentIssuesList = activeTab === 'verification' ? issues : assignedIssues;
  const filteredIssues = categoryFilter
    ? currentIssuesList.filter(i => i.category === categoryFilter)
    : currentIssuesList;

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 font-sans space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" /> Field Verification Hub
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Verify civic complaints or photograph active work crews to transition tasks to "in process".</p>
        </div>

        {/* Filtering row */}
        <div className="flex items-center gap-2 shrink-0">
          <Sliders size={13} className="text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setExpandedIssueId(null); setSelectedIssue(null); }}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 transition shadow-sm"
          >
            <option value="">All Categories</option>
            <option value="Road Damage / Pothole">Road Damage</option>
            <option value="Water Leakage">Water Leakage</option>
            <option value="Streetlight Problem">Streetlights</option>
            <option value="Garbage & Waste">Garbage</option>
            <option value="Drainage / Sewage">Drainage</option>
            <option value="Traffic & Road Signs">Traffic Signs</option>
            <option value="Parks & Recreation">Parks</option>
            <option value="Stray Animals / Safety">Stray Animals</option>
            <option value="Air & Noise Pollution">Air & Noise Pollution</option>
            <option value="Vandalism & Graffiti">Vandalism</option>
            <option value="Public Transit & Bus Stops">Transit Stops</option>
            <option value="Public Health & Encroachments">Public Health</option>
          </select>
          <button
            onClick={loadQueue}
            className="p-1.5 bg-white hover:bg-slate-50 border border-gray-200 rounded-xl text-slate-600 transition shadow-sm cursor-pointer"
            title="Reload Queue"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tab Selection */}
      <div className="flex border border-slate-200 bg-slate-50 p-1.5 rounded-2xl shadow-sm">
        <button
          onClick={() => { setActiveTab('verification'); setExpandedIssueId(null); setSelectedIssue(null); }}
          className={`flex-1 py-2.5 text-xs font-bold transition-all rounded-xl flex items-center justify-center gap-1.5 ${
            activeTab === 'verification'
              ? 'bg-white text-emerald-800 shadow-sm border border-emerald-100'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck size={14} className={activeTab === 'verification' ? 'text-emerald-500' : 'text-slate-400'} />
          Pending Verification ({issues.length})
        </button>
        <button
          onClick={() => { setActiveTab('worksite'); setExpandedIssueId(null); setSelectedIssue(null); }}
          className={`flex-1 py-2.5 text-xs font-bold transition-all rounded-xl flex items-center justify-center gap-1.5 ${
            activeTab === 'worksite'
              ? 'bg-white text-blue-800 shadow-sm border border-blue-100'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Camera size={14} className={activeTab === 'worksite' ? 'text-blue-500' : 'text-slate-400'} />
          Active Worksite Tracking ({assignedIssues.length})
        </button>
      </div>

      {/* LIST SECTION */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="animate-spin text-emerald-500" size={32} />
          <p className="text-xs text-slate-400 font-light">Retrieving queue...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-dashed border-gray-200 text-center space-y-3">
          <CheckCircle className="mx-auto text-emerald-500" size={36} />
          <p className="text-sm font-bold text-slate-800">Queue is clear!</p>
          <p className="text-xs text-slate-500 font-light max-w-sm mx-auto leading-relaxed">
            {activeTab === 'verification'
              ? 'No issues currently need initial verification.'
              : 'No newly assigned crew dispatches require on-site active photograph validation.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => {
            const isExpanded = expandedIssueId === issue.id;
            return (
              <div
                key={issue.id}
                onClick={() => handleToggleExpand(issue)}
                className={`p-6 rounded-3xl border transition-all duration-300 text-left cursor-pointer ${
                  isExpanded
                    ? activeTab === 'verification'
                      ? 'border-emerald-500 bg-emerald-50/10 ring-1 ring-emerald-500/20 shadow-md'
                      : 'border-blue-500 bg-blue-50/10 ring-1 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Collapsed Top Header Grid */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-1.5 overflow-hidden flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-600">
                        #{issue.id}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        activeTab === 'worksite'
                          ? 'text-blue-700 bg-blue-50 border border-blue-100'
                          : 'text-amber-700 bg-amber-50 border border-amber-100'
                      }`}>
                        {issue.status === 'Assigned' ? 'assigned in process' : issue.status}
                      </span>
                      <span className="text-[10.5px] text-slate-500 font-semibold">• {issue.category}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-950 leading-snug">{issue.title}</h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{issue.addressText}</span>
                    </p>
                  </div>

                   {/* Right: Actions, Crew Status & Expand Arrow */}
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0">
                    <div className="text-left md:text-right min-w-[120px] shrink-0">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">Crew / Dispatch</p>
                      <p className="text-xs font-black text-slate-800 mt-0.5 whitespace-nowrap">
                        {issue.assignedOfficer || 'Pending'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button className={`px-4 py-2 font-black rounded-xl text-xs transition cursor-pointer shrink-0 shadow-sm ${
                        activeTab === 'verification'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}>
                        {isExpanded 
                          ? 'Collapse' 
                          : activeTab === 'verification' 
                            ? 'Review Report' 
                            : 'Photograph Crew'
                        }
                      </button>

                      <div className={`p-1.5 rounded-full border transition-all duration-300 shrink-0 ${
                        isExpanded
                          ? activeTab === 'verification'
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                            : 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}>
                        <ChevronDown 
                          size={16} 
                          className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Inline Drawer Section */}
                {isExpanded && (
                  <div 
                    onClick={(e) => e.stopPropagation()} // Prevent card collapse when clicking elements inside
                    className="mt-6 pt-6 border-t border-slate-150 space-y-6"
                  >
                    {/* Location Details and Map */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Map Container */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <MapPin size={14} className="text-emerald-500" /> Geographic Map Location
                        </p>
                        <MiniIssueMap 
                          latitude={issue.lat} 
                          longitude={issue.lng} 
                          category={issue.category} 
                        />
                        <p className="text-[10.5px] text-slate-400 font-medium">
                          Latitude: {issue.lat.toFixed(6)} • Longitude: {issue.lng.toFixed(6)}
                        </p>
                      </div>

                      {/* Extra Details */}
                      <div className="space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-slate-400">Description</p>
                            <p className="text-xs text-slate-700 font-normal leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
                              {issue.description}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                <UserIcon size={10} /> Reporter
                              </p>
                              <p className="font-bold text-slate-800 mt-0.5">{issue.createdBy.name}</p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                <Activity size={10} /> Priority Score
                              </p>
                              <span className="inline-flex items-center gap-1 font-extrabold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded text-[10px] mt-0.5 w-fit">
                                PS: {issue.priorityScore}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={() => onNavigate(`issue-details-${issue.id}`)}
                            className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition cursor-pointer w-fit border border-slate-200 shadow-sm"
                          >
                            <Search size={13} /> View Full Incident Timeline
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action Form */}
                    <div className="border-t border-slate-150 pt-6">
                      {activeTab === 'verification' ? (
                        <form onSubmit={(e) => handleSubmitVerification(e, issue)} className="space-y-4">
                          <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl space-y-1">
                            <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                              <ShieldCheck size={14} className="text-emerald-600" /> Initial Report Verification
                            </p>
                            <p className="text-[10.5px] text-emerald-700 leading-relaxed font-semibold">
                              Provide your field verification verdict. Confirming valid reports builds trust consensus; false or spam reports should be rejected.
                            </p>
                          </div>

                          {/* Verdict selectors */}
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setResult('confirm')}
                              className={`py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                result === 'confirm'
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                              }`}
                            >
                              <CheckCircle size={15} /> Confirm (Valid Issue)
                            </button>
                            <button
                              type="button"
                              onClick={() => setResult('reject')}
                              className={`py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                result === 'reject'
                                  ? 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500/20'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                              }`}
                            >
                              <XCircle size={15} /> Reject (Invalid / Spam)
                            </button>
                          </div>

                          {/* Confidence Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                              <span>Verification Confidence</span>
                              <span className="font-mono text-emerald-600">{Math.round(confidence * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="1.0"
                              step="0.1"
                              value={confidence}
                              onChange={e => setConfidence(Number(e.target.value))}
                              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                            />
                            <p className="text-[10px] text-slate-400 font-light">Lower your confidence if you are making an assessment remotely.</p>
                          </div>

                          {/* Evidence URL Input */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Optional Evidence Attachment URL</label>
                            <input
                              type="text"
                              placeholder="e.g. Paste a live photo URL if you checked the site"
                              value={evidenceMediaUrl}
                              onChange={e => setEvidenceMediaUrl(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition"
                            />
                          </div>

                          {/* Review notes */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Reviewer Verification Note</label>
                            <textarea
                              required
                              rows={3}
                              placeholder="Explain what you verified. (e.g. 'Personally visited Tonk Road. Pothole is indeed 4 inches deep and extremely dangerous.')"
                              value={note}
                              onChange={e => setNote(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition"
                            />
                          </div>

                          {/* Submit */}
                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow transition-all flex items-center justify-center gap-1.5"
                          >
                            <Award size={14} /> Submit Verification (+10 Points)
                          </button>
                        </form>
                      ) : (
                        /* Worksite Photo validation form */
                        <form onSubmit={(e) => handleSubmitWorksiteProgress(e, issue)} className="space-y-4">
                          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-1">
                            <p className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                              <Camera size={14} className="text-blue-500" /> Active Worksite Photo Validation
                            </p>
                            <p className="text-[10.5px] text-blue-700 leading-relaxed font-semibold">
                              To transition this issue to "in process", you must visit the site where workers are working and upload a photo of the team on duty.
                            </p>
                          </div>

                          {/* Photo presets for quick testing */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">Click a photo preset to simulate capture:</label>
                            <div className="grid grid-cols-3 gap-2">
                              {progressPhotoPresets.map((p) => (
                                <button
                                  key={p.label}
                                  type="button"
                                  onClick={() => setProgressPhotoUrl(p.url)}
                                  className={`p-2 rounded-xl border text-[9.5px] font-bold text-center transition flex flex-col items-center gap-1 bg-white ${
                                    progressPhotoUrl === p.url
                                      ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm ring-1 ring-blue-500/25'
                                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                  }`}
                                >
                                  <img src={p.url} alt={p.label} className="w-full h-8 object-cover rounded" />
                                  <span className="truncate w-full">{p.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* URL input */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Photo URL</label>
                            <input
                              type="text"
                              required
                              placeholder="Or paste a live photo URL"
                              value={progressPhotoUrl}
                              onChange={e => setProgressPhotoUrl(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition"
                            />
                          </div>

                          {/* Notes */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Verifier Field Notes</label>
                            <textarea
                              rows={2}
                              placeholder="e.g., Road repair machinery is deployed and staff has set up diversion signs."
                              value={progressNotes}
                              onChange={e => setProgressNotes(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition"
                            />
                          </div>

                          {/* Submit */}
                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow transition-all flex items-center justify-center gap-1.5"
                          >
                            <Award size={14} /> Submit Worksite Photo (+15 Points)
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
