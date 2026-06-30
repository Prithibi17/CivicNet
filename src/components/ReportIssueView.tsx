import React, { useState } from 'react';
import { api } from '../api.js';
import MapComponent from './MapComponent.js';
import {
  MapPin,
  Image as ImageIcon,
  FileText,
  Brain,
  CheckCircle,
  FolderOpen,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  UploadCloud,
  Droplets,
  Lightbulb,
  Trash2,
  Waves,
  Building2,
  Wrench,
  Home,
  AlertCircle,
  Trees,
  Footprints,
  Wind,
  Paintbrush,
  Bus,
  HeartPulse
} from 'lucide-react';

interface ReportIssueViewProps {
  onNavigate: (view: string) => void;
}

// Photo templates for quick testing
const EVIDENCE_TEMPLATES = [
  {
    title: 'Severe Pothole',
    url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500&auto=format&fit=crop',
    category: 'Road Damage / Pothole'
  },
  {
    title: 'Water Leak / Pipe Burst',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop',
    category: 'Water Leakage'
  },
  {
    title: 'Broken Light Pole',
    url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=500&auto=format&fit=crop',
    category: 'Streetlight Problem'
  },
  {
    title: 'Overflowing Trash Bin',
    url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=500&auto=format&fit=crop',
    category: 'Garbage & Waste'
  }
];

export default function ReportIssueView({ onNavigate }: ReportIssueViewProps) {
  const [step, setStep] = useState(1);

  // Form States
  const [category, setCategory] = useState('Road Damage / Pothole');
  const [lat, setLat] = useState(26.8501); // default Jaipur VGU
  const [lng, setLng] = useState(75.8110);
  const [addressText, setAddressText] = useState('Near VGU Main Gate, Sector 36, Jagatpura, Jaipur');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [customMediaUrl, setCustomMediaUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // AI Loading & Result States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [createdIssueId, setCreatedIssueId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Category Selection
  const categories = [
    { 
      name: 'Road Damage / Pothole', 
      icon: <Wrench size={24} className="text-red-500" />, 
      desc: 'Deep road craters, collapsed asphalt slabs, cracked pavements, or broken curbs causing safety hazards for vehicles.' 
    },
    { 
      name: 'Water Leakage', 
      icon: <Droplets size={24} className="text-blue-500" />, 
      desc: 'Subterranean main pipe bursts, spraying water valves, bubbling clean water streams, or overflows from public supply points.' 
    },
    { 
      name: 'Streetlight Problem', 
      icon: <Lightbulb size={24} className="text-yellow-500" />, 
      desc: 'Completely dark street stretches, blinking overhead lamps, broken light poles, or exposed high-voltage electrical wires.' 
    },
    { 
      name: 'Garbage & Waste', 
      icon: <Trash2 size={24} className="text-emerald-500" />, 
      desc: 'Overflowing community bins, scattered litter attracting pests, smelly heaps, or illegally dumped debris and rubble.' 
    },
    { 
      name: 'Drainage / Sewage', 
      icon: <Waves size={24} className="text-purple-500" />, 
      desc: 'Blocked sewer lines, bubbling foul-smelling dark liquid from manholes, slow storm drains, or street waterlogging.' 
    },
    { 
      name: 'Traffic & Road Signs', 
      icon: <AlertCircle size={24} className="text-orange-500" />, 
      desc: 'Defective traffic lights, missing speed limit boards, smashed metal road dividers, or faded pedestrian lane markings.' 
    },
    { 
      name: 'Parks & Recreation', 
      icon: <Trees size={24} className="text-green-500" />, 
      desc: 'Vandalized swings and slides, broken wooden benches, overgrown thorny bushes, or fallen park trees blocking walkways.' 
    },
    { 
      name: 'Stray Animals / Safety', 
      icon: <Footprints size={24} className="text-pink-500" />, 
      desc: 'Aggressive stray dog packs, wandering cattle blockading traffic lanes, or potentially rabid animals in residential zones.' 
    },
    { 
      name: 'Air & Noise Pollution', 
      icon: <Wind size={24} className="text-teal-500" />, 
      desc: 'Thick black industrial exhaust, unauthorized loud loudspeakers operating late at night, or heavy construction dust clouds.' 
    },
    { 
      name: 'Vandalism & Graffiti', 
      icon: <Paintbrush size={24} className="text-cyan-500" />, 
      desc: 'Illegal spray-painted graffiti on historical monuments, shattered window glass, or intentionally defaced public artworks.' 
    },
    { 
      name: 'Public Transit & Bus Stops', 
      icon: <Bus size={24} className="text-indigo-500" />, 
      desc: 'Shattered glass panels at local bus shelters, missing town route timetable boards, or structurally damaged transit seats.' 
    },
    { 
      name: 'Public Health & Encroachments', 
      icon: <HeartPulse size={24} className="text-slate-500" />, 
      desc: 'Unlicensed stalls completely blocking pedestrian footpaths, dumped medical syringes, or stagnant pools breeding mosquitoes.' 
    }
  ];

  const handleSelectCategory = (catName: string) => {
    setCategory(catName);
    setStep(2);
  };

  // Step 2: Location Selector
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setAddressText(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)} (GPS Coordinates)`);
        },
        () => {
          // Fallback
          setLat(26.8501);
          setLng(75.8110);
          setAddressText('VGU Main Gate, Jaipur (GPS Fallback)');
        }
      );
    } else {
      setLat(26.8501);
      setLng(75.8110);
      setAddressText('VGU Main Gate, Jaipur (GPS Fallback)');
    }
  };

  const handleMapCoordSelect = (coords: [number, number]) => {
    setLat(coords[0]);
    setLng(coords[1]);
    setAddressText(`Coordinates [${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}] in Jaipur`);
  };

  // Step 3: Media Upload Helper
  const handleAddMediaUrl = (url: string) => {
    if (url && !mediaUrls.includes(url)) {
      setMediaUrls([...mediaUrls, url]);
      setCustomMediaUrl('');
    }
  };

  const handleRemoveMediaUrl = (url: string) => {
    setMediaUrls(mediaUrls.filter(u => u !== url));
  };

  // Submit and run simulated AI review
  const handleSubmitReport = async () => {
    setStep(5);
    setAiLoading(true);
    setError(null);

    // AI Pipeline emulation
    setTimeout(async () => {
      try {
        const payload = {
          title,
          description,
          lat,
          lng,
          addressText,
          category,
          mediaUrls
        };

        const response = await api.createIssue(payload);
        setAiAnalysisResult(response.aiAnalysis);
        setCreatedIssueId(response.issue.id);
      } catch (err: any) {
        setError(err.message || 'Failed to submit issue');
        setStep(4);
      } finally {
        setAiLoading(false);
      }
    }, 2500); // Realistic 2.5s review delay
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 font-sans">
      
      {/* Step Indicator Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Report a Civic Issue</h1>
          <p className="text-xs text-slate-500 font-medium">Follow the simple steps to notify Jaipur Municipal Officers</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <span
              key={num}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition ${
                step === num
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : step > num
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-gray-400'
              }`}
            >
              {num}
            </span>
          ))}
        </div>
      </div>

      {/* STEP 1: CATEGORY */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FolderOpen className="text-emerald-500" size={18} />
              Step 1: Select Issue Category
            </h2>
            <p className="text-sm text-slate-500 font-light">What type of community problem are you reporting?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.name}
                onClick={() => handleSelectCategory(cat.name)}
                className={`p-5 rounded-2xl border transition text-left cursor-pointer group flex gap-4 ${
                  category === cat.name
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="shrink-0 p-3 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center justify-center">
                  {cat.icon}
                </div>
                <div className="space-y-1 overflow-hidden">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    {cat.name.split('/')[0]}
                  </h3>
                  <p className="text-xs text-slate-500 font-light leading-relaxed truncate md:whitespace-normal">
                    {cat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: LOCATION */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="text-emerald-500" size={18} />
              Step 2: Georeference the Problem
            </h2>
            <p className="text-sm text-slate-500 font-light">Where is this issue located? Drag or click on the map to place your pin.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={handleUseCurrentLocation}
              className="p-4 bg-white hover:bg-slate-50 border border-gray-200 hover:border-gray-300 rounded-xl text-left cursor-pointer flex items-center gap-3"
            >
              <span className="p-2.5 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <MapPin size={18} />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">GPS Location</p>
                <p className="text-[10px] text-slate-500 font-light mt-0.5">Detect current location</p>
              </div>
            </button>

            <div className="md:col-span-2 p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl flex items-center gap-3">
              <span className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <Home size={18} />
              </span>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900">Location Tag</p>
                <input
                  type="text"
                  value={addressText}
                  onChange={e => setAddressText(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:outline-none focus:border-emerald-500 rounded px-2 py-1 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          <div className="h-[300px] border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <MapComponent
              center={[lat, lng]}
              selectedCoords={[lat, lng]}
              onSelectCoords={handleMapCoordSelect}
            />
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1"
            >
              Next <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: EVIDENCE UPLOAD */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="text-emerald-500" size={18} />
              Step 3: Attach Media Evidence
            </h2>
            <p className="text-sm text-slate-500 font-light">Upload photo proof of the problem. You can use our presets below for instant testing.</p>
          </div>

          {/* Preset templates for rapid evaluation */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Quick-Upload Preset Proofs</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {EVIDENCE_TEMPLATES.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleAddMediaUrl(item.url)}
                  className={`relative aspect-video rounded-lg overflow-hidden border cursor-pointer transition ${
                    mediaUrls.includes(item.url)
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/45 p-2 flex items-end">
                    <p className="text-[10px] text-white font-bold truncate w-full">{item.title}</p>
                  </div>
                  {mediaUrls.includes(item.url) && (
                    <div className="absolute top-1 right-1 bg-emerald-500 text-slate-950 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Manual URL input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste custom photo URL (e.g. Unsplash link) or type dummy"
              value={customMediaUrl}
              onChange={e => setCustomMediaUrl(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => handleAddMediaUrl(customMediaUrl)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Add Photo
            </button>
          </div>

          {/* Current Gallery */}
          {mediaUrls.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Selected Gallery ({mediaUrls.length})</p>
              <div className="flex flex-wrap gap-3">
                {mediaUrls.map((url) => (
                  <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={url} alt="Proof" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveMediaUrl(url)}
                      className="absolute inset-0 bg-red-600/80 text-white text-xs font-bold items-center justify-center hidden group-hover:flex cursor-pointer transition"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1"
            >
              Next <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: DESCRIBE THE PROBLEM */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="text-emerald-500" size={18} />
              Step 4: Describe the Problem
            </h2>
            <p className="text-sm text-slate-500 font-light">Tell Jaipur officers exactly what is happening to expedite the fix.</p>
          </div>

          <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Report Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Large pothole near VGU Main Gate"
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Detailed Description</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. A large pothole has formed near the main gate of VGU. Several bikes have already slipped. The problem becomes difficult to see during rain and is dangerous for students."
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={handleSubmitReport}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-500/20"
            >
              Submit Report <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: AI PIPELINE SIMULATOR */}
      {step === 5 && (
        <div className="flex flex-col items-center justify-center text-center py-16 space-y-6">
          {aiLoading ? (
            <>
              <div className="relative">
                <Loader2 size={48} className="animate-spin text-emerald-500" />
                <Brain size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-900" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h2 className="text-lg font-bold text-slate-900">AI Review Underway...</h2>
                <div className="text-xs text-slate-500 space-y-1 font-mono">
                  <p className="animate-pulse">✓ Identifying Category with keyword heuristics...</p>
                  <p className="animate-pulse delay-200">✓ Checking geometric overlap distances...</p>
                  <p className="animate-pulse delay-500">✓ Scoring severity & escalating weights...</p>
                </div>
              </div>
            </>
          ) : aiAnalysisResult ? (
            <div className="space-y-6 w-full max-w-lg bg-white p-6 rounded-2xl border border-gray-100 shadow-xl text-left">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                <Brain className="text-purple-500" size={24} />
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">AI Assessment Output</h2>
                  <p className="text-[10px] text-slate-400">Heuristics completed successfully</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-50">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Category</p>
                  <p className="text-xs font-extrabold text-slate-900 mt-1">{aiAnalysisResult.category}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-50">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Severity</p>
                  <p className={`text-xs font-extrabold capitalize mt-1 ${
                    aiAnalysisResult.severity === 'critical' || aiAnalysisResult.severity === 'high'
                      ? 'text-red-600'
                      : 'text-amber-600'
                  }`}>{aiAnalysisResult.severity}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-50">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Priority Rating</p>
                  <p className="text-xs font-extrabold text-slate-900 mt-1">{aiAnalysisResult.priorityScore} / 100</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-50">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Urgency Flags</p>
                  <p className="text-xs font-extrabold text-slate-900 mt-1 flex items-center gap-1">
                    {aiAnalysisResult.isUrgent ? (
                      <>
                        <AlertTriangle size={14} className="text-amber-500" />
                        Urgent Priority
                      </>
                    ) : (
                      'Normal Response'
                    )}
                  </p>
                </div>
              </div>

              {/* Duplicate warnings */}
              {aiAnalysisResult.isDuplicate ? (
                <div className="p-4 bg-amber-50 border border-amber-150 rounded-xl text-xs text-amber-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Duplicate Report Detected
                  </div>
                  <p className="font-light">
                    Our database found an active overlapping issue matching your category and coordinates. You are automatically subscribed to the original report.
                  </p>
                </div>
              ) : aiAnalysisResult.duplicateCandidates && aiAnalysisResult.duplicateCandidates.length > 0 ? (
                <div className="p-4 bg-slate-50 border border-gray-150 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <AlertTriangle size={16} className="text-amber-500 animate-pulse" />
                    Possible Related Reports Nearby
                  </div>
                  <div className="space-y-1">
                    {aiAnalysisResult.duplicateCandidates.slice(0, 2).map((cand: any) => (
                      <div key={cand.id} className="flex justify-between text-slate-600">
                        <span className="truncate w-2/3"># {cand.title}</span>
                        <span className="font-semibold">{Math.round(cand.similarity * 100)}% Match</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <button
                onClick={() => setStep(6)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow transition text-center block"
              >
                Proceed to Confirmation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-red-500 text-sm">Failed to retrieve analysis.</p>
              <button onClick={() => setStep(4)} className="text-xs font-bold text-slate-950 underline">Go Back</button>
            </div>
          )}
        </div>
      )}

      {/* STEP 6: CONFIRMATION */}
      {step === 6 && (
        <div className="flex flex-col items-center justify-center text-center py-16 space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl shadow-inner animate-bounce">
            <CheckCircle size={36} />
          </div>

          <div className="space-y-2 max-w-sm">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Report Created Successfully!</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-light">
              Your issue is now registered in our decentralized ledger. Local verifiers have been pinged to authenticate.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 text-xs w-full max-w-xs space-y-1.5 font-mono text-left">
            <p className="flex justify-between"><span className="text-gray-400">Issue ID:</span> <span className="font-bold text-slate-800"># {createdIssueId}</span></p>
            <p className="flex justify-between"><span className="text-gray-400">Initial Status:</span> <span className="font-bold text-emerald-600">AI Reviewed</span></p>
            <p className="flex justify-between"><span className="text-gray-400">Assigned Dept:</span> <span className="font-bold text-slate-800">Jaipur Maintenance</span></p>
            <p className="flex justify-between"><span className="text-gray-400">Submissions Points:</span> <span className="font-bold text-emerald-600">+5 Points</span></p>
          </div>

          <button
            onClick={() => {
              if (createdIssueId) {
                onNavigate(`issue-details-${createdIssueId}`);
              } else {
                onNavigate('citizen-dashboard');
              }
            }}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow transition"
          >
            View Live Issue Details
          </button>
        </div>
      )}

    </div>
  );
}
