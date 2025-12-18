

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AppEntry, ChatRichContent } from '../types';
import { startAssistantChat } from '../services/geminiService';

interface AIAssistantProps {
  apps: AppEntry[];
  onAddApp: (app: Partial<AppEntry>) => void;
  onDeleteApp: (id: string) => void;
}

const RichRegistryList: React.FC<{ apps: AppEntry[], onDelete: (id: string) => void }> = ({ apps, onDelete }) => (
  <div className="bg-slate-900 border border-cyan-900/50 rounded-xl overflow-hidden mt-2 font-mono text-[11px]">
    <div className="bg-slate-800 px-3 py-1 text-[9px] text-cyan-500 uppercase font-bold border-b border-cyan-900/30 flex justify-between">
      <span>Registry_Explorer_v1.0</span>
      <span>Count: {apps.length}</span>
    </div>
    <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
      {apps.map(app => (
        <div key={app.id} className="p-2 flex items-center justify-between group hover:bg-cyan-500/5 transition-colors">
          <div className="flex items-center gap-2 truncate">
            <span className="text-cyan-400">{app.iconValue}</span>
            <span className="text-slate-300 font-bold truncate">{app.title}</span>
            <span className="text-slate-600 text-[9px] hidden md:inline">[{app.status}]</span>
          </div>
          <button 
            onClick={() => onDelete(app.id)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-500 transition-all"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      ))}
    </div>
  </div>
);

const RichSystemReport: React.FC = () => (
  <div className="bg-slate-900 border border-purple-900/50 rounded-xl p-3 mt-2 font-mono text-[10px] space-y-3">
    <div className="flex justify-between border-b border-purple-900/30 pb-1">
      <span className="text-purple-400 font-bold">SYSTEM_DIAGNOSTICS_REPORT</span>
      <span className="text-slate-600">SEC_ID: {Math.random().toString(16).slice(2, 6).toUpperCase()}</span>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between"><span>Kernel_Integrity:</span> <span className="text-green-500">OPTIMAL</span></div>
      <div className="flex justify-between"><span>Neural_Buffer:</span> <span className="text-cyan-500">STABLE</span></div>
      <div className="flex justify-between"><span>Registry_Sync:</span> <span className="text-green-500">ACTIVE</span></div>
    </div>
    <div className="bg-black/40 p-2 rounded border border-white/5 text-[9px] text-slate-500 italic">
      "Fleet synchronization at 99.4%. No anomalies detected in current quadrant."
    </div>
  </div>
);

export const AIAssistant: React.FC<AIAssistantProps> = ({ apps, onAddApp, onDeleteApp }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: "Systems initialized. ARCHITECT mission control online. Standing by for instructions." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (!chatRef.current) {
      chatRef.current = startAssistantChat();
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg });
      
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          let result = "Operational success.";
          let richContent: ChatRichContent | undefined = undefined;
          
          if (fc.name === 'add_app') {
            onAddApp({
              title: fc.args.title as string,
              description: fc.args.description as string,
              url: fc.args.url as string,
              status: (fc.args.status as any) || 'LIVE',
              tags: (fc.args.tags as string[]) || [],
              capabilities: (fc.args.capabilities as string[]) || ['Autonomous Processing'],
              iconType: 'emoji',
              iconValue: (fc.args.iconEmoji as string) || '🤖'
            });
            result = `Deployment initialized: "${fc.args.title}" is now active.`;
          } else if (fc.name === 'list_registry') {
            result = "Accessing fleet registry archives...";
            richContent = { type: 'registry_list', data: apps };
          } else if (fc.name === 'system_report') {
            result = "Synthesizing real-time diagnostics report...";
            richContent = { type: 'system_report', data: {} };
          } else if (fc.name === 'delete_app') {
            const target = apps.find(a => a.id === fc.args.id || a.title.toLowerCase() === (fc.args.title as string)?.toLowerCase());
            if (target) {
              onDeleteApp(target.id);
              result = `Termination confirmed: Agent "${target.title}" has been decommissioned.`;
            } else {
              result = "Target acquisition failed. Invalid ID or title.";
            }
          }

          const toolResponse = await chatRef.current.sendMessage({
            message: `Architect log: ${result}`
          });
          
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: toolResponse.text || result,
            richContent: richContent
          }]);
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: response.text || "Instruction processed." }]);
      }
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', text: "Communication blackout. " + (e.message || "Unknown anomaly.") }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2000]">
      {isOpen ? (
        <div className="w-80 md:w-96 h-[550px] glass-card rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-cyan-500/30">
          <div className="bg-gradient-to-r from-slate-900 to-cyan-900 p-4 flex justify-between items-center text-white shrink-0 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                 <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
                 <div className="absolute inset-0 w-3 h-3 rounded-full bg-cyan-400 animate-ping opacity-75"></div>
              </div>
              <span className="font-syne font-bold tracking-widest text-sm uppercase">Architect OS</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-grow p-5 overflow-y-auto space-y-4 bg-slate-950/80 scrollbar-thin scrollbar-thumb-cyan-900/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[95%] p-3.5 rounded-2xl text-[12px] leading-relaxed ${m.role === 'user' ? 'bg-cyan-600/20 text-cyan-100 rounded-tr-none border border-cyan-500/20' : 'bg-slate-900 text-slate-300 rounded-tl-none border border-white/5'}`}>
                  {m.text}
                  {m.richContent?.type === 'registry_list' && <RichRegistryList apps={apps} onDelete={onDeleteApp} />}
                  {m.richContent?.type === 'system_report' && <RichSystemReport />}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 p-3 rounded-2xl rounded-tl-none flex gap-1.5 border border-white/5">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10 flex gap-3 bg-slate-950 shrink-0">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Transmit directive... (e.g. 'show files')"
              className="flex-grow bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500 text-white placeholder:text-slate-600"
            />
            <button onClick={handleSend} className="bg-cyan-600 hover:bg-cyan-500 p-2.5 rounded-xl transition-all active:scale-95">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-gradient-to-tr from-slate-900 to-cyan-600 rounded-full flex items-center justify-center text-white shadow-[0_8px_32px_rgba(0,217,255,0.3)] hover:scale-110 active:scale-90 transition-all group animate-float border border-cyan-400/30"
        >
          <div className="relative">
            <svg className="w-8 h-8 group-hover:rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-950"></div>
          </div>
        </button>
      )}
    </div>
  );
};
