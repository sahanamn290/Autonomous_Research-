
import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full glass p-10 rounded-[2.5rem] shadow-2xl relative z-10 border border-slate-800">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600 mb-6 shadow-xl shadow-blue-600/20">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tighter uppercase mb-2">Aether Research</h1>
          <p className="text-slate-400 font-sans text-sm tracking-wide">Autonomous Intelligence Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-mono-tech font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Access ID</label>
            <input
              type="text"
              required
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-4 px-5 text-white focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder-slate-700"
              placeholder="Enter Terminal Credentials"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono-tech font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Security Key</label>
            <input
              type="password"
              required
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-4 px-5 text-white focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder-slate-700"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-heading font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95 mt-4"
          >
            Establish Connection
          </button>
        </form>
        
        <div className="mt-10 pt-8 border-t border-slate-900 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span className="text-[10px] font-mono-tech text-slate-600 uppercase tracking-widest">Quantum Encryption: Active</span>
          </div>
          <p className="text-[9px] font-mono-tech text-slate-700 uppercase tracking-widest">Secured Terminal Access // Aether-7</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
