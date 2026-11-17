import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  ShieldCheck, 
  PhoneCall, 
  MapPin, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';
import { loginUser } from '../api';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await loginUser({ username, password });
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-between text-slate-100 p-4 sm:p-6">
      {/* Top micro bar */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-xs text-blue-300/80 py-2">
        <span className="font-semibold text-white tracking-wider uppercase text-[11px]">
          Subodhi Institute of Integral Education
        </span>
        <div className="hidden sm:flex items-center gap-4 text-[11px]">
          <span>Wewala, Piliyandala, Sri Lanka</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <PhoneCall className="w-3 h-3 text-red-400" />
            011-2614317 / 011-2613705
          </span>
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md bg-white text-slate-800 rounded-2xl shadow-2xl border border-blue-900/40 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-6 text-center text-white relative">
            <div className="inline-block p-2 bg-white rounded-2xl shadow-md mb-3 border border-slate-200">
              <img 
                src="/assets/logo.png" 
                alt="Subodhi Logo" 
                className="w-14 h-14 object-contain mx-auto"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/logo.jpg';
                }}
              />
            </div>
            <h2 className="text-lg font-extrabold tracking-tight text-white uppercase">
              SUBODHI QUOTATIONS
            </h2>
            <p className="text-[11px] font-semibold text-red-400 tracking-wide mt-0.5">
              Institute of Integral Education
            </p>
            <p className="text-xs text-blue-200/90 mt-1">
              Admin Authorization & Quotation Management Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-800 font-medium"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-800 font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <span className="text-[11px] text-slate-400">
                Authorized Personnel Only • Subodhi Integral Education
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="max-w-7xl mx-auto w-full text-center text-[11px] text-blue-300/60 py-2">
        Subodhi Institute of Integral Education • Wewala, Piliyandala, Sri Lanka • Official Quotation System
      </div>
    </div>
  );
}
