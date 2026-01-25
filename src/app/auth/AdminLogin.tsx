import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import { ShieldCheck, ArrowRight, User, Lock, RefreshCw, AlertCircle } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { adminLogin, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated && role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await adminLogin(username, password);
      
      if (result.success) {
        // Redirect to admin dashboard
        window.location.href = '/admin/dashboard';
      } else {
        setError(result.error || 'Invalid credentials. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-100/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-100/30 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-lg z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-full overflow-hidden shadow-xl shadow-indigo-100 ring-4 ring-indigo-100">
            <img 
              src="/EECLOGORED.png" 
              alt="EEC Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin<span className="text-indigo-600"> Portal</span></h1>
          <p className="text-slate-500 font-semibold tracking-wide uppercase text-xs">Administrative Access Gateway</p>
        </div>

        <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="group space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center">
                  <User size={14} className="mr-2" />
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>

              <div className="group space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center">
                  <Lock size={14} className="mr-2" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 pr-12 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <Lock size={18} />
                    ) : (
                      <Lock size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 text-xs rounded-2xl border border-rose-100 flex items-start space-x-3">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">{error}</p>
                </div>
              </div>
            )}

            <Button type="submit" fullWidth size="lg" disabled={loading} className="group">
              {loading ? (
                <span className="flex items-center">
                  <RefreshCw className="mr-2 animate-spin" size={18} />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center">
                  Sign In <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                </span>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Employee Login →
              </button>
            </div>
          </form>
        </div>

        <div className="flex justify-center items-center space-x-4 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
          <div className="flex items-center text-xs font-black text-slate-500 uppercase tracking-widest">
            <ShieldCheck size={14} className="mr-2 text-indigo-500" />
            Secure Access
          </div>
          <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Admin Only
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

