
import React from 'react';

interface LogoutPageProps {
  onBackToLogin: () => void;
}

const LogoutPage: React.FC<LogoutPageProps> = ({ onBackToLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full glass p-10 rounded-[2.5rem] shadow-2xl relative z-10 border border-slate-800 text-center">
        <div className="mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 mb-6 shadow-xl group">
            <svg className="w-10 h-10 text-slate-500 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tighter uppercase mb-3">Session Terminated</h1>
          <p className="text-slate-400 font-sans text-sm tracking-wide">You have been securely disconnected from the Aether Nexus. All temporary encryption keys have been purged.</p>
        </div>

        <button
          onClick={onBackToLogin}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-heading font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95"
        >
          Re-establish Connection
        </button>

        <div className="mt-10 pt-8 border-t border-slate-900">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            <span className="text-[10px] font-mono-tech text-slate-600 uppercase tracking-widest">Connection: Offline</span>
          </div>
          <p className="text-[9px] font-mono-tech text-slate-700 uppercase tracking-widest">Aether Protocol v2.4.0 // Secure Terminal</p>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;
