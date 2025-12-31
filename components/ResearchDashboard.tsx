
import React, { useState, useEffect } from 'react';
import { ResearchProject, ResearchSubTopic, StructuredReport, GroundingChunk } from '../types';
import { planResearch, searchGrounding, synthesizeReport } from '../services/geminiService';
import { STORAGE_KEY } from '../constants';

const ResearchDashboard: React.FC = () => {
  const [activeProject, setActiveProject] = useState<ResearchProject | null>(null);
  const [history, setHistory] = useState<ResearchProject[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (project: ResearchProject) => {
    const newHistory = [project, ...history.filter(p => p.id !== project.id)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const startResearch = async () => {
    if (!topicInput.trim() || isProcessing) return;
    
    setIsProcessing(true);
    const newProject: ResearchProject = {
      id: Date.now().toString(),
      topic: topicInput,
      timestamp: Date.now(),
      subTopics: [],
      status: 'analyzing',
      confidenceScore: 0
    };
    setActiveProject(newProject);
    setTopicInput('');

    try {
      const queries = await planResearch(topicInput);
      const subTopics: ResearchSubTopic[] = queries.map((q, i) => ({
        id: `q-${i}`,
        query: q,
        status: 'pending',
        sources: []
      }));
      
      setActiveProject(prev => prev ? { ...prev, subTopics, status: 'searching' } : null);

      const processedSubTopics = await Promise.all(subTopics.map(async (st) => {
        setActiveProject(prev => {
          if (!prev) return null;
          return {
            ...prev,
            subTopics: prev.subTopics.map(t => t.id === st.id ? { ...t, status: 'searching' } : t)
          };
        });

        try {
          const result = await searchGrounding(st.query);
          const updatedSt: ResearchSubTopic = {
            ...st,
            findings: result.text,
            sources: result.sources,
            status: 'completed'
          };
          
          setActiveProject(prev => {
            if (!prev) return null;
            return {
              ...prev,
              subTopics: prev.subTopics.map(t => t.id === st.id ? updatedSt : t)
            };
          });
          
          return updatedSt;
        } catch (err) {
          console.error(`Vector failed: ${st.query}`, err);
          return { ...st, status: 'failed' } as ResearchSubTopic;
        }
      }));

      setActiveProject(prev => prev ? { ...prev, status: 'synthesizing' } : null);
      const report = await synthesizeReport(topicInput, processedSubTopics);
      
      const finalProject: ResearchProject = {
        ...newProject,
        subTopics: processedSubTopics,
        structuredReport: report,
        confidenceScore: report.technicalConfidence,
        status: 'completed'
      };

      setActiveProject(finalProject);
      saveToHistory(finalProject);
    } catch (error) {
      console.error("Critical mission failure:", error);
      setActiveProject(prev => prev ? { ...prev, status: 'idle' } : null);
    } finally {
      setIsProcessing(false);
    }
  };

  const allSources: GroundingChunk[] = activeProject?.subTopics.flatMap(st => st.sources) || [];
  const uniqueSources: GroundingChunk[] = Array.from(new Map(allSources.map(s => [s.web?.uri, s])).values());

  const formatBodyText = (text: string) => {
    const markers = ["[FACTUAL_OBSERVATION]", "[ANALYSIS_PROTOCOL]", "[DATA_VERIFICATION]"];
    // Fix: Explicitly use React.JSX.Element to avoid "Cannot find namespace 'JSX'" error
    let parts: (string | React.JSX.Element)[] = [text as any];
    
    markers.forEach(marker => {
      // Fix: Explicitly use React.JSX.Element to avoid "Cannot find namespace 'JSX'" error
      let nextParts: (string | React.JSX.Element)[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(marker);
          for (let i = 0; i < split.length; i++) {
            if (split[i]) nextParts.push(split[i] as any);
            if (i < split.length - 1) {
              nextParts.push(
                <span key={`${marker}-${i}`} className="font-mono-tech text-blue-400 font-bold block mt-6 mb-2 text-[10px] tracking-widest uppercase opacity-70">
                  // {marker.replace('[', '').replace(']', '').replace('_', ' ')}
                </span>
              );
            }
          }
        } else {
          nextParts.push(part);
        }
      });
      parts = nextParts;
    });

    return parts;
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#020617] font-sans">
      {/* Navigation Matrix */}
      <div className="w-full md:w-80 bg-[#030712] border-r border-slate-900 flex flex-col">
        <div className="p-8 border-b border-slate-900">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-blue-600 rounded-sm shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
            <h3 className="text-[11px] font-black font-heading text-slate-400 uppercase tracking-[0.4em]">Intelligence Logs</h3>
          </div>
          <p className="text-[9px] font-mono-tech text-slate-600 uppercase">Aether Nexus v2.4.5</p>
        </div>
        
        <div className="p-4 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
          {history.length === 0 && <p className="text-slate-800 text-[10px] text-center py-20 uppercase font-black tracking-widest">Vault Empty</p>}
          {history.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveProject(p)}
              className={`w-full text-left p-5 rounded-xl border transition-all duration-300 relative group overflow-hidden ${
                activeProject?.id === p.id 
                  ? 'bg-blue-600/5 border-blue-500/30 text-blue-100' 
                  : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-900/40 hover:text-slate-300'
              }`}
            >
              <div className="font-heading font-bold text-xs truncate uppercase tracking-wide">{p.topic}</div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-[9px] font-mono-tech opacity-30">{new Date(p.timestamp).toLocaleDateString()}</span>
                <span className={`text-[10px] font-mono-tech font-black ${activeProject?.id === p.id ? 'text-blue-500' : 'text-slate-800'}`}>
                  {p.confidenceScore}%_CFD
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Intelligence Core */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-12 lg:p-16 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.03),transparent_40%)]">
        <div className="max-w-4xl mx-auto w-full">
          
          {/* Objective Submission */}
          <div className="mb-20">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-600/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
              <input
                type="text"
                className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl pl-10 pr-52 py-6 text-lg font-heading text-white placeholder-slate-700 focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/40 outline-none transition-all relative z-10"
                placeholder="Declare Research Mission Parameter..."
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                disabled={isProcessing}
                onKeyDown={(e) => e.key === 'Enter' && startResearch()}
              />
              <button
                onClick={startResearch}
                disabled={isProcessing || !topicInput.trim()}
                className="absolute right-3 top-3 bottom-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 text-white px-10 rounded-xl font-heading font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 z-20"
              >
                {isProcessing ? "Processing..." : "Initiate"}
              </button>
            </div>
            <div className="mt-5 flex justify-center md:justify-start gap-10 px-4">
              <div className="flex items-center gap-2 group cursor-help">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-[9px] font-mono-tech text-slate-600 uppercase tracking-widest group-hover:text-slate-400 transition-colors">Neural Grounding: Syncing</span>
              </div>
              <div className="flex items-center gap-2 group cursor-help">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                <span className="text-[9px] font-mono-tech text-slate-600 uppercase tracking-widest group-hover:text-slate-400 transition-colors">Thread Load: {activeProject?.subTopics.length || 0}/6</span>
              </div>
            </div>
          </div>

          {activeProject ? (
            <div className="space-y-16 animate-in fade-in duration-700 pb-20">
              
              {/* Telemetry Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 glass p-8 rounded-3xl">
                  <h4 className="text-[10px] font-mono-tech font-bold text-slate-600 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                    <span className="text-blue-600">01</span> Extraction Vector Telemetry
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeProject.subTopics.map((st) => (
                      <div key={st.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#020617] border border-slate-900 group">
                        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                          st.status === 'completed' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' :
                          st.status === 'searching' ? 'bg-amber-500 animate-pulse' : 'bg-slate-800'
                        }`}></div>
                        <span className="text-[11px] font-mono-tech font-medium text-slate-500 group-hover:text-slate-300 transition-colors truncate tracking-tighter uppercase">{st.query}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass p-8 rounded-3xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-mono-tech font-bold text-slate-600 uppercase tracking-widest mb-4">Precision CFD</span>
                  <div className="text-6xl font-heading font-black text-white tracking-tighter">
                    {activeProject.confidenceScore}<span className="text-blue-600 text-sm ml-1">%</span>
                  </div>
                  <div className="w-12 h-1 bg-blue-600/20 rounded-full mt-6"></div>
                </div>
              </div>

              {/* TIB: Intelligence Bulletin Viewer */}
              {activeProject.structuredReport && (
                <div className="relative">
                  {/* Decorative Scanline */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent blur-md"></div>
                  
                  <div className="bg-[#030712] border border-slate-900 p-8 md:p-20 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden">
                    
                    {/* Identification Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-24">
                      <div className="flex-1">
                        <div className="text-[10px] font-mono-tech font-black text-blue-500/50 uppercase tracking-[0.6em] mb-6">// CLASSIFIED_INTEL_BULLETIN</div>
                        <h1 className="text-4xl md:text-6xl font-heading font-bold text-white tracking-tighter uppercase leading-[0.95]">
                          {activeProject.structuredReport.title}
                        </h1>
                      </div>
                      <div className="w-32 h-32 flex-shrink-0 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center justify-center p-4">
                        <svg className="w-full h-full text-blue-600/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      </div>
                    </div>

                    {/* Logic Gate Summary */}
                    <div className="mb-24">
                      <div className="bg-slate-900/30 p-10 rounded-[2.5rem] border border-slate-800/60 shadow-inner relative">
                        <div className="absolute -top-4 left-10 bg-[#030712] px-4 py-1 text-[10px] font-mono-tech font-black text-slate-500 uppercase tracking-widest">Synthetic Executive Summary</div>
                        <p className="text-slate-300 text-2xl font-heading font-light leading-relaxed tracking-tight">
                          {activeProject.structuredReport.executiveSummary}
                        </p>
                      </div>
                    </div>

                    {/* KPI Matrix */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24">
                      {activeProject.structuredReport.keyDataPoints.map((dp, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-slate-900/20 border border-slate-800 flex flex-col items-center text-center">
                          <div className="text-[9px] font-mono-tech font-black text-slate-600 uppercase mb-3 tracking-widest">{dp.label}</div>
                          <div className="text-xl font-heading font-bold text-white">{dp.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Analytical Deep Dive */}
                    <div className="space-y-32">
                      {activeProject.structuredReport.sections.map((section, i) => (
                        <div key={i} className="group">
                          <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12">
                            <div className="text-[12px] font-mono-tech text-blue-500 font-black tracking-[0.3em] border-l-4 border-blue-600 pl-4 py-1">
                              VECTOR_0{i + 1}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white tracking-tighter uppercase">{section.heading}</h2>
                          </div>
                          
                          <div className="max-w-3xl ml-0 md:ml-10">
                            <div className="text-slate-400 text-xl font-light leading-[1.7] mb-12 font-sans tracking-wide">
                              {formatBodyText(section.body)}
                            </div>
                            
                            {/* Insight Gates */}
                            <div className="space-y-3 mb-12">
                              {section.keyInsights.map((insight, ki) => (
                                <div key={ki} className="flex items-start gap-4 p-5 rounded-2xl bg-blue-600/5 border border-blue-500/10 group-hover:border-blue-500/30 transition-all">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                  <span className="text-[13px] font-heading font-semibold text-blue-400/90 tracking-wide uppercase leading-tight">{insight}</span>
                                </div>
                              ))}
                            </div>

                            {/* Reference Map */}
                            <div className="flex flex-wrap gap-2">
                              {section.citedSourceIndices.map((sIdx) => (
                                <div key={sIdx} className="text-[9px] font-mono-tech font-bold text-slate-700 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 hover:text-blue-500 transition-colors cursor-crosshair">
                                  REF://NODE_{sIdx}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Empirical Reference Repository */}
                    <div className="mt-40 pt-20 border-t border-slate-900">
                      <div className="flex items-center justify-between mb-12">
                         <h4 className="text-[11px] font-mono-tech font-black text-slate-600 uppercase tracking-[0.6em]">Grounding Verification Assets</h4>
                         <span className="text-[9px] font-mono-tech text-slate-800">SOURCE_NODES: {uniqueSources.length}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {uniqueSources.map((source, i) => (
                          source.web && (
                            <a 
                              key={i} 
                              href={source.web.uri} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="group flex flex-col p-6 rounded-2xl bg-slate-900/10 border border-slate-900 hover:border-blue-600/30 hover:bg-slate-900/30 transition-all"
                            >
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-black/50 border border-slate-800 flex items-center justify-center p-1.5">
                                  <img 
                                    src={`https://www.google.com/s2/favicons?sz=64&domain=${new URL(source.web.uri).hostname}`} 
                                    className="w-full h-full filter grayscale group-hover:grayscale-0 transition-all" 
                                    alt="" 
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                  />
                                </div>
                                <span className="text-[10px] font-mono-tech text-slate-600 uppercase group-hover:text-slate-400 transition-colors tracking-widest truncate">
                                  {new URL(source.web.uri).hostname}
                                </span>
                              </div>
                              <div className="text-sm font-heading font-bold text-slate-400 group-hover:text-white transition-colors leading-snug line-clamp-2">
                                {source.web.title}
                              </div>
                              <div className="mt-6 flex items-center text-[9px] font-mono-tech font-black text-blue-600/20 group-hover:text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                                Establish Link &rsaquo;
                              </div>
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-48 opacity-20 pointer-events-none">
              <div className="w-32 h-32 rounded-[2.5rem] bg-[#020617] border-2 border-slate-900 flex items-center justify-center mb-10 shadow-2xl">
                <div className="w-4 h-12 bg-blue-600/20 rounded-full animate-pulse"></div>
              </div>
              <h2 className="text-3xl font-heading font-black text-white mb-2 uppercase tracking-[0.5em]">Nexus Idle</h2>
              <p className="text-[10px] font-mono-tech text-slate-700 text-center max-w-sm uppercase tracking-widest font-bold">Autonomous Research Protocol Awaiting Mission Directives</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchDashboard;
