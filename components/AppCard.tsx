
import React from 'react';
import { AppEntry, AppStatus } from '../types';

interface AppCardProps {
  app: AppEntry;
  onEdit: (app: AppEntry) => void;
  onDelete: (id: string) => void;
  onView: (app: AppEntry) => void;
  onAccess: (app: AppEntry) => void;
}

export const StatusBadge: React.FC<{ status: AppStatus }> = ({ status }) => {
  const colors: Record<AppStatus, string> = {
    LIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
    BETA: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    DRAFT: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    MAINTENANCE: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-widest ${colors[status]}`}>
      {status}
    </span>
  );
};

export const AppCard: React.FC<AppCardProps> = ({ app, onEdit, onDelete, onView, onAccess }) => {
  const handleAccess = (e: React.MouseEvent) => {
    if (app.hasInternalInterface) {
      e.preventDefault();
      onAccess(app);
    }
  };

  const score = app.aiMetadata?.readinessScore ?? 0;
  const scoreColor = score > 80 ? 'text-green-400' : score > 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="glass-card group relative p-6 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,217,255,0.12)] flex flex-col h-full border-white/5 hover:border-cyan-500/30 overflow-hidden">
      {/* Quick Actions */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <button 
          onClick={(e) => { e.preventDefault(); onEdit(app); }}
          className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-colors border border-blue-500/20"
          title="Configure"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); onDelete(app.id); }}
          className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors border border-red-500/20"
          title="Decommission"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>

      <div className="mb-5 flex justify-between items-start">
        <StatusBadge status={app.status} />
        <div className="flex flex-col items-end">
          <button 
            onClick={() => onView(app)}
            className="text-[9px] text-cyan-500/60 hover:text-cyan-400 font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
          >
            Dossier <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/></svg>
          </button>
          {app.aiMetadata && (
            <div className={`text-[8px] font-mono mt-1 ${scoreColor}`}>
              READINESS: {score}%
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-purple-600/20 flex items-center justify-center text-3xl overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-700 ring-1 ring-white/10 shrink-0">
          {app.iconType === 'emoji' ? (
            <span className="drop-shadow-lg">{app.iconValue}</span>
          ) : (
            <img src={app.iconValue} className="w-full h-full object-cover" alt="Agent visual ID" />
          )}
        </div>
        <div className="min-w-0 flex-grow">
          <h3 className="text-xl font-bold font-syne group-hover:text-cyan-400 transition-colors leading-tight truncate tracking-tight">
            {app.title}
          </h3>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {(app.tags || []).slice(0, 2).map(tag => (
              <span key={tag} className="text-[8px] px-1.5 py-0.5 bg-cyan-900/10 text-cyan-500/80 uppercase tracking-widest rounded border border-cyan-500/10">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-5 line-clamp-2">
        {app.description || 'No operational metadata provided.'}
      </p>

      <div className="mb-8 space-y-3 flex-grow">
        <div className="text-[9px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <div className="h-px bg-slate-800 flex-grow"></div>
          Capabilities
          <div className="h-px bg-slate-800 flex-grow"></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(app.capabilities || []).slice(0, 3).map(cap => (
            <span key={cap} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/5 text-purple-400/90 text-[10px] border border-purple-500/10 transition-all hover:bg-purple-500/10">
              <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse"></div>
              {cap}
            </span>
          ))}
        </div>
      </div>

      <a 
        href={app.url} 
        target={app.hasInternalInterface ? undefined : "_blank"}
        rel={app.hasInternalInterface ? undefined : "noopener noreferrer"}
        onClick={handleAccess}
        className="block w-full text-center py-3.5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-bold hover:bg-cyan-500 hover:text-white hover:border-cyan-500 transition-all duration-500 shadow-[0_4px_12px_rgba(0,217,255,0.05)] hover:shadow-[0_4px_20px_rgba(0,217,255,0.3)] uppercase tracking-widest"
      >
        {app.hasInternalInterface ? 'OPEN TERMINAL →' : 'ACCESS INTERFACE →'}
      </a>
    </div>
  );
};
