
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import ResearchDashboard from './components/ResearchDashboard';
import { UserSession } from './types';
import { SESSION_KEY } from './constants';

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) setSession(JSON.parse(saved));
  }, []);

  const handleLogin = (username: string) => {
    const newSession = { isAuthenticated: true, username };
    setSession(newSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  };

  if (!session?.isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Top Navbar */}
      <header className="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">A</div>
          <span className="font-bold text-white tracking-tight hidden sm:inline">Aether Research <span className="text-blue-500 text-xs font-mono ml-1">v2.4.0</span></span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white uppercase tracking-wider">{session.username}</div>
              <div className="text-[10px] text-green-500 font-mono">AUTHORIZED ACCESS</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              {session.username[0].toUpperCase()}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-white transition-colors"
            title="Disconnect"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 overflow-hidden">
        <ResearchDashboard />
      </main>
    </div>
  );
};

export default App;
