
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppEntry, AppStatus, AISynthesisStyle, SystemMetrics, AIMetadata, IconSuggestion } from './types';
import { AppCard, StatusBadge } from './components/AppCard';
import { AIAssistant } from './components/AIAssistant';
import { generateAppIcon, AI } from './services/geminiService';

const STORAGE_KEY = 'agent_hub_apps_v4';

const INITIAL_APPS: AppEntry[] = [
  {
    id: 'mainframe-core',
    title: 'ARCHITECT Mainframe',
    description: 'The master orchestrator for all local and remote agent networks. Central command and control interface.',
    url: '#',
    status: 'LIVE',
    iconType: 'emoji',
    iconValue: '🌌',
    tags: ['Core', 'Admin', 'Nexus'],
    capabilities: ['Multi-agent Routing', 'Neural Synchronization', 'Persistence Engine', 'Fleet Telemetry'],
    createdAt: Date.now(),
    hasInternalInterface: true
  }
];

const App: React.FC = () => {
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppEntry | null>(null);
  const [viewingApp, setViewingApp] = useState<AppEntry | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<AppStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical'>('recent');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    status: 'LIVE' as AppStatus,
    iconType: 'emoji' as 'emoji' | 'image' | 'ai-gen',
    iconValue: '🚀',
    tags: [] as string[],
    capabilities: [] as string[],
    iconStyle: 'Minimalist' as AISynthesisStyle
  });
  
  const [tagInput, setTagInput] = useState('');
  const [capInput, setCapInput] = useState('');
  
  // AI Agent Layer State
  const [isAiBusy, setIsAiBusy] = useState(false);
  const [error, setError] = useState<{msg: string, action?: string} | null>(null);
  const [aiHints, setAiHints] = useState<AIMetadata | null>(null);
  const [isPreviewingAI, setIsPreviewingAI] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [iconSuggestions, setIconSuggestions] = useState<IconSuggestion | null>(null);

  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 12,
    memoryUsage: 45,
    neuralLinkStability: 98,
    uptime: 0,
    activeAgents: 1
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated = parsed.map((a: AppEntry) => 
          a.id === 'mainframe-core' ? { ...a, hasInternalInterface: true } : a
        );
        if (!migrated.find((a: AppEntry) => a.id === 'mainframe-core')) {
          migrated.unshift(INITIAL_APPS[0]);
        }
        setApps(migrated);
      } catch (e) {
        setApps(INITIAL_APPS);
      }
    } else {
      setApps(INITIAL_APPS);
      saveToStorage(INITIAL_APPS);
    }

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpuUsage: Math.floor(8 + Math.random() * 22),
        memoryUsage: Math.floor(38 + Math.random() * 12),
        neuralLinkStability: Math.floor(96 + Math.random() * 4),
        uptime: prev.uptime + 1,
        activeAgents: apps.filter(a => a.status === 'LIVE').length
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [apps.length]);

  const saveToStorage = (newApps: AppEntry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newApps));
  };

  const handleOpenModal = (app?: AppEntry) => {
    setError(null);
    setAiHints(null);
    setIconSuggestions(null);
    if (app) {
      setEditingApp(app);
      setFormData({
        title: app.title,
        description: app.description,
        url: app.url,
        status: app.status,
        iconType: app.iconType,
        iconValue: app.iconValue,
        tags: app.tags || [],
        capabilities: app.capabilities || [],
        iconStyle: app.iconStyle || 'Minimalist'
      });
    } else {
      setEditingApp(null);
      setFormData({
        title: '',
        description: '',
        url: '',
        status: 'LIVE',
        iconType: 'emoji',
        iconValue: '🚀',
        tags: [],
        capabilities: [],
        iconStyle: 'Minimalist'
      });
    }
    setTagInput('');
    setCapInput('');
    setIsModalOpen(true);
  };

  /**
   * Tag & Capability Management
   */
  const handleAddTag = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    const val = tagInput.trim();
    if (val && !formData.tags.includes(val)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleAddCapability = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    const val = capInput.trim();
    if (val && !formData.capabilities.includes(val)) {
      setFormData(prev => ({ ...prev, capabilities: [...prev.capabilities, val] }));
      setCapInput('');
    }
  };

  const handleRemoveCapability = (cap: string) => {
    setFormData(prev => ({ ...prev, capabilities: prev.capabilities.filter(c => c !== cap) }));
  };


  /**
   * AI AGENT: Smart Suggest Flow
   */
  const handleSmartSuggest = async () => {
    if (!formData.title) return setError({msg: 'Designation Required: AI needs a name to begin synthesis.'});
    setIsAiBusy(true);
    setError(null);
    try {
      const result = await AI.run('smartSuggest', { ...formData, style: formData.iconStyle });
      setPreviewData(result);
      setIsPreviewingAI(true);
    } catch (e: any) {
      setError({ msg: "Neural link failure. The sub-system is currently busy.", action: "RETRY LINK" });
    } finally {
      setIsAiBusy(false);
    }
  };

  const handleApplyAI = () => {
    if (previewData) {
      setFormData(prev => ({
        ...prev,
        title: previewData.title || prev.title,
        description: previewData.description || prev.description,
        status: previewData.status || prev.status
      }));
      // Persist the acceptance in AI Memory
      AI.updateMemory({ acceptedCount: AI.memory.acceptedCount + 1 });
      setIsPreviewingAI(false);
      setPreviewData(null);
      // Re-validate after change
      handleValidationAgent();
    }
  };

  const handleRejectAI = () => {
    // Persist the rejection in AI Memory
    AI.updateMemory({ rejectedCount: AI.memory.rejectedCount + 1 });
    setIsPreviewingAI(false);
    setPreviewData(null);
  };

  /**
   * AI AGENT: Validation flow
   */
  const handleValidationAgent = async () => {
    if (!formData.title) return;
    setIsAiBusy(true);
    try {
      const analysis = await AI.run('validateApp', formData);
      setAiHints(analysis);
    } catch (e) {
      console.error("Validation agent error", e);
    } finally {
      setIsAiBusy(false);
    }
  };

  /**
   * AI AGENT: Icon Intelligence
   */
  const handleIconIntelligence = async () => {
    if (!formData.title) return;
    setIsAiBusy(true);
    try {
      const suggestions = await AI.run('iconSuggest', formData);
      setIconSuggestions(suggestions);
    } catch (e) {
      console.error("Icon agent error", e);
    } finally {
      setIsAiBusy(false);
    }
  };

  const handleAiIconGen = async () => {
    if (!formData.title) return setError({msg: 'Designation Required: Neural icon synthesis requires an active title.'});
    setIsAiBusy(true);
    setError(null);
    try {
      // Use the image prompt from icon intelligence if available
      const prompt = iconSuggestions?.imagePrompt || formData.title;
      const dataUrl = await generateAppIcon(prompt, formData.iconStyle);
      if (dataUrl) {
        setFormData(prev => ({
          ...prev,
          iconType: 'image',
          iconValue: dataUrl
        }));
      }
    } catch (e: any) {
      setError({
        msg: "Visual buffer overflow. Imaging system is resetting.",
        action: "RE-SYNTHESIZE"
      });
    } finally {
      setIsAiBusy(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.url) return setError({msg: 'Operational Parameters Missing: Name and URL are required.'});
    
    let updatedApps: AppEntry[];
    const entry: AppEntry = {
      id: editingApp ? editingApp.id : Math.random().toString(36).substr(2, 9),
      ...formData, // Spread includes capabilities array
      createdAt: editingApp ? editingApp.createdAt : Date.now(),
      hasInternalInterface: editingApp?.hasInternalInterface || false,
      aiMetadata: aiHints || undefined
    };

    if (editingApp) {
      updatedApps = apps.map(a => a.id === editingApp.id ? entry : a);
    } else {
      updatedApps = [entry, ...apps];
    }
    
    setApps(updatedApps);
    saveToStorage(updatedApps);
    setIsModalOpen(false);
  };

  /**
   * BATCH AI FLEET ANALYSIS
   */
  const handleBatchAnalyze = async () => {
    if (isAiBusy) return;
    setIsAiBusy(true);
    const newApps = [...apps];
    try {
      for (let i = 0; i < newApps.length; i++) {
        if (newApps[i].id === 'mainframe-core') continue;
        const analysis = await AI.run('validateApp', newApps[i]);
        newApps[i].aiMetadata = analysis;
      }
      setApps(newApps);
      saveToStorage(newApps);
    } catch (e) {
      console.error("Batch fail", e);
    } finally {
      setIsAiBusy(false);
    }
  };

  const processedApps = useMemo(() => {
    return apps
      .filter(app => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = app.title.toLowerCase().includes(query) || 
                             app.description.toLowerCase().includes(query) ||
                             (app.tags || []).some(t => t.toLowerCase().includes(query));
        const matchesStatus = filterStatus === 'ALL' || app.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') return b.createdAt - a.createdAt;
        return a.title.localeCompare(b.title);
      });
  }, [apps, searchQuery, filterStatus, sortBy]);

  return (
    <div className={`min-h-screen transition-colors duration-500 bg-[#0a0e27] text-slate-100 selection:bg-cyan-500/30 ${isAiBusy ? 'cursor-wait' : ''}`}>
      {/* Background Ambient FX */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/40 rounded-full blur-[160px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/30 rounded-full blur-[160px]"></div>
      </div>

      <nav className="sticky top-0 z-[100] glass-card px-8 py-5 flex justify-between items-center border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-[0_0_20px_rgba(0,217,255,0.4)] ring-1 ring-white/20">
            AH
          </div>
          <div>
            <span className="font-syne font-extrabold text-2xl tracking-tighter gradient-text uppercase block leading-none">ARCHITECT</span>
            <span className="text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.4em] mt-1 block">Deployment Hub</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleBatchAnalyze}
            disabled={isAiBusy}
            className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-50"
          >
            {isAiBusy ? 'AI SYNTHESIZING...' : 'SCAN FLEET'}
            <svg className={`w-4 h-4 ${isAiBusy ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </button>
          <button 
            onClick={() => handleOpenModal()} 
            className="group relative bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-8 py-3 rounded-xl transition-all shadow-[0_0_25px_rgba(0,217,255,0.4)] hover:scale-105 active:scale-95 uppercase text-xs tracking-[0.2em] flex items-center gap-2"
          >
            <span className="relative z-10">+ Initialize Agent</span>
          </button>
        </div>
      </nav>

      <main className="container mx-auto max-w-7xl px-8 py-16 relative z-10">
        <header className="mb-20 text-center">
          <h1 className="text-6xl md:text-8xl font-extrabold mb-6 font-syne tracking-tighter uppercase">Mission <span className="gradient-text">Control</span></h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-xl font-light tracking-wide mb-12">Orchestrating the next generation of autonomous digital entities.</p>

          <div className="glass-card p-6 rounded-[2rem] border border-white/10 max-w-5xl mx-auto flex flex-wrap gap-6 items-center shadow-xl">
            <div className="flex-grow relative group">
              <input 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Probe fleet registry (Name, Tags, Desc)..." 
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded-[1.25rem] pl-12 pr-6 py-4 focus:outline-none focus:border-cyan-500/50 text-base transition-all placeholder:text-slate-700" 
              />
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="bg-slate-900/60 border border-slate-700/50 rounded-[1.25rem] px-6 py-4 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-cyan-500 text-cyan-400">
                <option value="ALL">Status: All</option>
                <option value="LIVE">Live Assets</option>
                <option value="BETA">Beta Protocol</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
              
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-slate-900/60 border border-slate-700/50 rounded-[1.25rem] px-6 py-4 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-cyan-500 text-slate-400">
                <option value="recent">Sort: Chronos</option>
                <option value="alphabetical">Sort: Alpha</option>
              </select>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {processedApps.map((app, index) => (
            <div key={app.id} className="opacity-0 translate-y-8 animate-[fade-in-up_0.6s_cubic-bezier(0.2,0.8,0.2,1)_forwards]" style={{ animationDelay: `${index * 80}ms` }}>
              <AppCard 
                app={app} 
                onEdit={handleOpenModal} 
                onDelete={(id) => {
                  if(window.confirm('Confirm decommissioning of asset instance?')) {
                    const next = apps.filter(x => x.id !== id);
                    setApps(next);
                    saveToStorage(next);
                  }
                }} 
                onView={(app) => {
                  setViewingApp(app);
                  setIsDossierOpen(true);
                }}
                onAccess={(app) => {
                  if (app.id === 'mainframe-core' || app.hasInternalInterface) {
                    setIsTerminalOpen(true);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Internal Mainframe Dashboard Overlay */}
      {isTerminalOpen && (
        <div className="fixed inset-0 z-[3000] bg-[#00050a] flex flex-col font-mono text-cyan-500 p-0 md:p-6 lg:p-12 animate-in fade-in transition-all">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_3px,2px_100%] z-[100] opacity-50"></div>
          
          <div className="relative z-10 flex flex-col h-full bg-slate-950/80 border border-cyan-900/50 shadow-[0_0_80px_rgba(0,217,255,0.05)] rounded-2xl overflow-hidden backdrop-blur-sm">
            <header className="flex justify-between items-center border-b border-cyan-900/50 p-8 bg-cyan-950/20">
              <div className="flex items-center gap-6">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.9)]"></div>
                <div>
                  <h2 className="text-2xl font-bold tracking-[0.4em] uppercase text-white">MAINFRAME_NEXUS_CORE</h2>
                  <div className="flex gap-4 mt-2">
                    <span className="text-[10px] bg-cyan-500 text-black px-2 py-0.5 font-bold uppercase">Authorized Access</span>
                    <span className="text-[10px] text-cyan-800">SESS_ID: {Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsTerminalOpen(false)} className="px-8 py-3 border border-cyan-500/50 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all font-bold uppercase text-xs tracking-[0.3em]">
                TERMINATE_SESSION
              </button>
            </header>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-1 p-1 overflow-hidden">
              <aside className="lg:col-span-3 border border-cyan-900/30 bg-cyan-950/5 p-8 space-y-12 overflow-y-auto custom-scrollbar">
                <section>
                  <h3 className="text-xs text-cyan-800 mb-6 font-bold tracking-[0.2em] uppercase border-b border-cyan-900/20 pb-2">SYSTEM_TELEMETRY</h3>
                  <div className="space-y-8">
                    <div className="group">
                      <div className="flex justify-between text-[11px] mb-2 font-bold"><span className="text-cyan-700">CPU_CORE_UTIL</span><span className={metrics.cpuUsage > 25 ? 'text-red-400' : ''}>{metrics.cpuUsage}%</span></div>
                      <div className="w-full bg-cyan-950 h-2 rounded-full overflow-hidden border border-cyan-900/30"><div className="bg-cyan-400 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,217,255,0.5)]" style={{ width: `${metrics.cpuUsage}%` }}></div></div>
                    </div>
                    <div className="group">
                      <div className="flex justify-between text-[11px] mb-2 font-bold"><span className="text-cyan-700">NEURAL_LOAD</span><span>{metrics.memoryUsage}%</span></div>
                      <div className="w-full bg-cyan-950 h-2 rounded-full overflow-hidden border border-cyan-900/30"><div className="bg-purple-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: `${metrics.memoryUsage}%` }}></div></div>
                    </div>
                  </div>
                </section>
                <section>
                  <h3 className="text-xs text-cyan-800 mb-6 font-bold tracking-[0.2em] uppercase border-b border-cyan-900/20 pb-2">AI_AGENTS_MEM</h3>
                  <div className="space-y-4">
                    <div className="p-4 border border-cyan-900/30 bg-cyan-900/10 rounded-lg">
                      <div className="text-[10px] text-cyan-800 font-bold mb-1">ACCEPTED_ADVICE</div>
                      <div className="text-4xl font-bold text-white tracking-tighter">{AI.memory.acceptedCount}</div>
                    </div>
                    <div className="p-4 border border-cyan-900/30 bg-cyan-900/10 rounded-lg">
                      <div className="text-[10px] text-cyan-800 font-bold mb-1">REJECTED_ADVICE</div>
                      <div className="text-4xl font-bold text-slate-700 tracking-tighter">{AI.memory.rejectedCount}</div>
                    </div>
                  </div>
                </section>
              </aside>

              <main className="lg:col-span-9 border-l border-cyan-900/30 bg-black/40 p-8 flex flex-col gap-6 overflow-hidden">
                <div className="flex-grow overflow-y-auto space-y-3 text-[13px] leading-snug pr-4 custom-scrollbar font-mono selection:bg-cyan-500 selection:text-black">
                  <p className="text-cyan-900">[T-{Math.random().toFixed(4)}] ARCHITECT_SYSTEM_HANDSHAKE_INITIATED</p>
                  <p className="text-white mt-6 font-bold tracking-[0.3em] uppercase text-base">NODE_ACTIVITY_STREAM</p>
                  <div className="space-y-1 pt-4">
                    {apps.map((a, i) => (
                      <p key={a.id} className="hover:bg-cyan-900/20 py-2 px-3 transition-colors rounded border border-transparent hover:border-cyan-900/30 group">
                        <span className="text-cyan-800">[{new Date(a.createdAt).getTime().toString().slice(-6)}]</span> 
                        <span className="text-cyan-400 font-bold uppercase ml-4 group-hover:text-white">SYNC: {a.title} </span>
                        {a.aiMetadata && <span className="text-green-500 ml-4">[READY:{a.aiMetadata.readinessScore}%]</span>}
                        <span className="text-cyan-900 ml-4 font-mono truncate hidden md:inline">STAT:{a.status} ADDR:{a.url.slice(0, 18)}...</span>
                      </p>
                    ))}
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      )}

      {/* Deployment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl glass-card rounded-[2.5rem] p-10 shadow-2xl border border-white/10 max-h-[95vh] overflow-y-auto animate-in zoom-in-95 scrollbar-thin scrollbar-thumb-cyan-500/20">
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
              <div>
                <h2 className="text-3xl font-bold font-syne tracking-tight uppercase">Agent <span className="text-cyan-400">Synthesis</span></h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Configure neural entity parameters</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-all text-slate-500 hover:text-white active:scale-90">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {error && (
              <div className="mb-8 p-5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-sm flex justify-between items-center">
                <span className="font-medium">{error.msg}</span>
                {error.action && (
                  <button onClick={() => error.action === 'RETRY LINK' ? handleSmartSuggest() : handleAiIconGen()} className="px-4 py-1.5 bg-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/30">
                    {error.action}
                  </button>
                )}
              </div>
            )}

            <div className="space-y-8">
              {/* AI VALIDATION HINTS (NON-BLOCKING) */}
              {aiHints && (
                <div className="p-5 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl animate-in slide-in-from-top-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Deployment Analysis</span>
                    <span className={`text-xs font-bold ${aiHints.readinessScore > 75 ? 'text-green-400' : 'text-yellow-400'}`}>Score: {aiHints.readinessScore}%</span>
                  </div>
                  <div className="space-y-2">
                    {aiHints.warnings.map((w, i) => (
                      <div key={i} className="text-[11px] text-slate-400 flex items-start gap-2">
                        <span className="text-yellow-500">⚠</span> {w}
                      </div>
                    ))}
                    {aiHints.warnings.length === 0 && <p className="text-[11px] text-green-500/60 italic">No deployment inhibitors detected.</p>}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Identity Designation</label>
                    <div className="relative group">
                      <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter Designation..." className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 focus:outline-none focus:border-cyan-500 text-white placeholder:text-slate-700" />
                      <div className="absolute right-2 top-2 flex gap-1">
                         <button onClick={handleValidationAgent} disabled={isAiBusy} className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-xl text-[10px] font-bold hover:bg-purple-500/20 disabled:opacity-50">ANALYZE</button>
                         <button onClick={handleSmartSuggest} disabled={isAiBusy} className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-xl text-[10px] font-bold hover:bg-cyan-500/20 disabled:opacity-50">ENHANCE</button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Endpoint Interface URL</label>
                    <input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 focus:outline-none focus:border-cyan-500 text-white placeholder:text-slate-700" />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-8 bg-slate-950/60 rounded-[2rem] border border-white/5 relative group overflow-hidden min-h-[200px] shadow-inner">
                   {isAiBusy ? (
                     <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-bold text-cyan-500 animate-pulse tracking-[0.4em] uppercase">Processing...</span>
                     </div>
                   ) : (
                     <>
                       <div className="text-7xl mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                         {formData.iconType === 'emoji' ? formData.iconValue : <img src={formData.iconValue} className="w-24 h-24 rounded-3xl object-cover shadow-2xl ring-2 ring-white/10" />}
                       </div>
                       <div className="flex gap-2">
                        <button onClick={handleIconIntelligence} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">Icon AI</button>
                        <button onClick={handleAiIconGen} className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 uppercase tracking-widest px-3 py-1.5 bg-cyan-500/5 rounded-lg border border-cyan-500/10">Synthesize</button>
                       </div>
                     </>
                   )}
                </div>
              </div>

              {/* Tags & Capabilities Management */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Classification Tags</label>
                    <div className="flex flex-wrap gap-2 mb-3 min-h-[30px]">
                      {formData.tags.map(tag => (
                        <span key={tag} onClick={() => handleRemoveTag(tag)} className="cursor-pointer bg-cyan-900/30 hover:bg-red-900/30 text-cyan-400 hover:text-red-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border border-cyan-500/10 flex items-center gap-2 transition-colors">
                          {tag} <span className="text-[10px] opacity-50">×</span>
                        </span>
                      ))}
                    </div>
                    <input 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Add tag (Press Enter)..."
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-cyan-500 text-white placeholder:text-slate-700"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Agent Capabilities</label>
                    <div className="flex flex-wrap gap-2 mb-3 min-h-[30px]">
                      {formData.capabilities.map(cap => (
                        <span key={cap} onClick={() => handleRemoveCapability(cap)} className="cursor-pointer bg-purple-900/30 hover:bg-red-900/30 text-purple-400 hover:text-red-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border border-purple-500/10 flex items-center gap-2 transition-colors">
                          {cap} <span className="text-[10px] opacity-50">×</span>
                        </span>
                      ))}
                    </div>
                    <input 
                      value={capInput}
                      onChange={(e) => setCapInput(e.target.value)}
                      onKeyDown={handleAddCapability}
                      placeholder="Add capability (Press Enter)..."
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-purple-500 text-white placeholder:text-slate-700"
                    />
                 </div>
              </div>

              {/* Icon Suggestions List */}
              {iconSuggestions && (
                <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl animate-in fade-in">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Semantic Emoji Suggestions</label>
                  <div className="flex gap-4">
                    {iconSuggestions.emojis.map((emoji, i) => (
                      <button key={i} onClick={() => setFormData({ ...formData, iconType: 'emoji', iconValue: emoji })} className="text-3xl p-3 hover:bg-white/5 rounded-xl transition-all active:scale-90">
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-white/5 flex gap-4">
                <button onClick={handleSave} className="flex-grow bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-cyan-600/20 hover:scale-[1.01] active:scale-95 transition-all uppercase tracking-[0.3em] text-sm">
                  Finalize Initialization
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMART SUGGEST PREVIEW OVERLAY */}
      {isPreviewingAI && previewData && (
        <div className="fixed inset-0 z-[2005] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
           <div className="relative w-full max-w-xl glass-card rounded-[2.5rem] p-10 shadow-2xl border border-cyan-500/50">
              <h3 className="text-2xl font-bold uppercase tracking-widest text-cyan-400 mb-6 font-syne">Neural Enhancement Report</h3>
              
              <div className="space-y-6">
                <div className="p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10">
                  <span className="block text-[10px] font-bold text-cyan-600 uppercase tracking-widest mb-1">Reasoning</span>
                  <p className="text-sm text-slate-300 italic">"{previewData.reasoning}"</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-4">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Proposed Title</span>
                      <p className="text-white font-bold">{previewData.title}</p>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tagline</span>
                      <p className="text-cyan-400 italic text-xs">{previewData.tagline}</p>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description</span>
                    <p className="text-slate-400 text-xs leading-relaxed">{previewData.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                 <button onClick={handleApplyAI} className="flex-grow bg-cyan-500 text-slate-900 font-bold py-4 rounded-xl uppercase tracking-widest text-xs shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all">Accept Improvement</button>
                 <button onClick={handleRejectAI} className="px-8 bg-slate-800 text-slate-400 font-bold rounded-xl uppercase tracking-widest text-xs border border-white/5">Decline</button>
              </div>
           </div>
        </div>
      )}

      {/* Agent Dossier View */}
      {isDossierOpen && viewingApp && (
        <div className="fixed inset-0 z-[2001] flex items-center justify-center p-0 md:p-12">
           <div className="absolute inset-0 bg-[#0a0e27]/98 backdrop-blur-xl animate-in fade-in" onClick={() => setIsDossierOpen(false)}></div>
           <div className="relative w-full h-full max-w-6xl bg-slate-950 rounded-[3rem] p-12 border border-white/5 shadow-[0_0_120px_rgba(0,0,0,0.5)] overflow-y-auto animate-in slide-in-from-bottom-12">
              <div className="flex justify-between items-start mb-16">
                 <div>
                   <h3 className="text-[10px] text-cyan-500 font-bold uppercase tracking-[0.6em] mb-2">Fleet Registry Archive</h3>
                   <h2 className="text-5xl md:text-7xl font-extrabold font-syne uppercase tracking-tighter leading-none">{viewingApp.title}</h2>
                 </div>
                 <button onClick={() => setIsDossierOpen(false)} className="bg-white/5 p-4 rounded-full hover:bg-white/10 transition-all">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                 </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                 <div className="lg:col-span-4 space-y-12">
                    <div className="w-full aspect-square bg-gradient-to-br from-cyan-600/10 to-purple-600/10 rounded-[4rem] flex items-center justify-center text-[12rem] border border-white/5 shadow-inner overflow-hidden ring-1 ring-white/10">
                       {viewingApp.iconType === 'emoji' ? (
                         <span className="drop-shadow-2xl">{viewingApp.iconValue}</span>
                       ) : (
                         <img src={viewingApp.iconValue} className="w-full h-full object-cover" />
                       )}
                    </div>
                    {viewingApp.aiMetadata && (
                      <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-6 shadow-inner">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Readiness Index</span>
                          <span className={`text-xl font-bold ${viewingApp.aiMetadata.readinessScore > 75 ? 'text-green-400' : 'text-yellow-400'}`}>{viewingApp.aiMetadata.readinessScore}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                           <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(0,217,255,0.4)]" style={{ width: `${viewingApp.aiMetadata.readinessScore}%` }}></div>
                        </div>
                        <p className="text-[11px] text-slate-500 italic leading-relaxed">Agent Log: "{viewingApp.aiMetadata.reasoning}"</p>
                      </div>
                    )}
                 </div>

                 <div className="lg:col-span-8 space-y-16">
                    <section>
                       <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-6">Operational Intelligence Summary</label>
                       <p className="text-2xl text-slate-300 leading-relaxed font-light font-syne">{viewingApp.description || 'Metadata currently unavailable.'}</p>
                    </section>

                    <section>
                       <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-8">Autonomous Capability Matrix</label>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(viewingApp.capabilities || []).map((cap, i) => (
                            <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-6 group hover:bg-cyan-500/5 transition-all">
                               <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 font-bold group-hover:scale-110 transition-transform">
                                  {(i + 1).toString().padStart(2, '0')}
                               </div>
                               <span className="font-bold text-base tracking-wide text-slate-200 uppercase">{cap}</span>
                            </div>
                          ))}
                       </div>
                    </section>

                    <div className="pt-12 border-t border-white/5 flex flex-wrap justify-between items-center gap-8 text-[11px] font-mono text-slate-600">
                       <div>SYNC_TIMESTAMP: {new Date(viewingApp.createdAt).toISOString()}</div>
                       <a href={viewingApp.url} target="_blank" className="bg-cyan-500/10 text-cyan-400 px-8 py-4 rounded-xl border border-cyan-500/20 font-bold hover:bg-cyan-500 hover:text-slate-900 transition-all uppercase tracking-[0.2em]">ACCESS_INTERFACE_PORTAL</a>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <footer className="mt-40 border-t border-white/5 py-20 bg-slate-950/60">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="text-center md:text-left space-y-4">
              <p className="text-slate-600 font-bold tracking-[0.5em] uppercase text-[11px]">Architect Mainframe OS v4.5.1</p>
              <p className="text-slate-800 text-[9px] uppercase tracking-widest font-mono">Kernel Release 2025.04.12 // Sector 7G Hub</p>
            </div>
            <div className="flex flex-wrap justify-center gap-10 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
               <button onClick={() => { const data = JSON.stringify(apps, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'architect-registry-export.json'; a.click(); }} className="hover:text-cyan-400 transition-all">Archive Registry</button>
               <button onClick={() => { if(window.confirm('Wipe mission memory?')) { setApps(INITIAL_APPS); localStorage.removeItem(STORAGE_KEY); } }} className="hover:text-red-400 transition-all">Factory Reset</button>
            </div>
          </div>
        </div>
      </footer>

      <AIAssistant 
        apps={apps} 
        onAddApp={(partial) => {
          const entry: AppEntry = {
            id: Math.random().toString(36).substr(2, 9),
            title: partial.title || 'Inferred Entity',
            description: partial.description || 'Self-generated metadata record.',
            url: partial.url || '#',
            status: partial.status || 'LIVE',
            iconType: 'emoji',
            iconValue: partial.iconValue || '🤖',
            tags: partial.tags || ['AI-Inferred'],
            capabilities: partial.capabilities || ['Autonomous Logic'],
            createdAt: Date.now(),
            hasInternalInterface: false
          };
          const next = [entry, ...apps];
          setApps(next);
          saveToStorage(next);
        }} 
        onDeleteApp={(id) => {
          const next = apps.filter(x => x.id !== id);
          setApps(next);
          saveToStorage(next);
        }} 
      />
    </div>
  );
};

export default App;
