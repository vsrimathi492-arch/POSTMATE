import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Mail, Lock, Building2, ArrowRight, CheckCircle2, Globe } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('PM600040');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, quickLogin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const success = await login(employeeId, password);
      if (success) {
        navigate('/');
      } else {
        setError('Invalid employee credentials. Please check employee ID or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (role: 'POSTMASTER' | 'POSTAL_STAFF' | 'DELIVERY' | 'ADMIN') => {
    setLoading(true);
    try {
      await quickLogin(role);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Postal Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />

      {/* Language Switcher in corner */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
        >
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Brand Header */}
        <div className="bg-slate-950 p-6 text-white text-center border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 mx-auto flex items-center justify-center font-black text-2xl text-white shadow-lg mb-3">
            P
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">POSTMATE</h1>
          <p className="text-xs text-blue-400 font-medium tracking-wide uppercase mt-0.5">
            {t.app.subtitle}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 italic">
            "{t.app.tagline}"
          </p>
        </div>

        <div className="p-6">
          {/* Quick Role Selection for instant testing */}
          <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <p className="font-bold text-slate-700 mb-2 uppercase tracking-wider text-[10px]">
              Select Demo Role (1-Click Login):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRole('POSTMASTER')}
                className="p-2 rounded-lg bg-white border border-slate-300 hover:border-blue-500 text-left transition font-medium hover:bg-blue-50/50"
              >
                <div className="font-bold text-slate-900">Postmaster</div>
                <div className="text-[10px] text-slate-500">PM600040 (Full Ops)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('POSTAL_STAFF')}
                className="p-2 rounded-lg bg-white border border-slate-300 hover:border-blue-500 text-left transition font-medium hover:bg-blue-50/50"
              >
                <div className="font-bold text-slate-900">Postal Assistant</div>
                <div className="text-[10px] text-slate-500">PA600041 (Counter)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('DELIVERY')}
                className="p-2 rounded-lg bg-white border border-slate-300 hover:border-blue-500 text-left transition font-medium hover:bg-blue-50/50"
              >
                <div className="font-bold text-slate-900">Beat Postman</div>
                <div className="text-[10px] text-slate-500">PMTS600042 (Delivery)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('ADMIN')}
                className="p-2 rounded-lg bg-white border border-slate-300 hover:border-blue-500 text-left transition font-medium hover:bg-blue-50/50"
              >
                <div className="font-bold text-slate-900">Administrator</div>
                <div className="text-[10px] text-slate-500">ADMIN001 (System)</div>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Postal Employee ID</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. PM600040"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Access Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center justify-center gap-2 shadow disabled:opacity-50 text-xs"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to POSTMATE Terminal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-400 mt-5">
            Default sandbox demonstration password: <code className="font-mono font-bold text-slate-600">password123</code>
          </p>
        </div>
      </div>
    </div>
  );
};
