import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import Button from '@/components/ui/Button';
import { ShieldCheck, ArrowRight, Mail, RefreshCw } from 'lucide-react';

type LoginStep = 'employeeCode' | 'otp';

const Login: React.FC = () => {
  const [step, setStep] = useState<LoginStep>('employeeCode');
  const [employeeCode, setEmployeeCode] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [resendingOTP, setResendingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  const { verifyOTPAndLogin, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    const redirectPath = role === 'admin' ? '/admin/dashboard' : '/employee/attendance';
    return <Navigate to={redirectPath} replace />;
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSendingOTP(true);

    try {
      await api.employee.sendOTP(employeeCode);
      setOtpSent(true);
      setStep('otp');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setResendingOTP(true);

    try {
      await api.employee.resendOTP(employeeCode);
      setOtpSent(true);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendingOTP(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyOTPAndLogin(employeeCode, otp);
      
      if (result.success && result.role) {
        // Use the role from the result
        const redirectPath = result.role === 'admin' ? '/admin/dashboard' : '/employee/attendance';
        // Use window.location for a full page reload to ensure auth state is properly set
        window.location.href = redirectPath;
      } else {
        setError('Invalid OTP. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  const handleBackToEmployeeCode = () => {
    setStep('employeeCode');
    setOtp('');
    setError('');
    setOtpSent(false);
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">EEC<span className="text-indigo-600"> HR Portal</span></h1>
          <p className="text-slate-500 font-semibold tracking-wide uppercase text-xs">Identity Management Gateway</p>
        </div>

        <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)]">
          {step === 'employeeCode' ? (
            <form onSubmit={handleSendOTP} className="space-y-8">
              <div className="space-y-6">
                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Employee Reference</label>
                  <input
                    type="text"
                    placeholder="EMP-000"
                    className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 text-xs rounded-2xl border border-rose-100 text-center font-bold">
                  {error}
                </div>
              )}

              <Button type="submit" fullWidth size="lg" disabled={sendingOTP} className="group">
                {sendingOTP ? (
                  <span className="flex items-center">
                    <RefreshCw className="mr-2 animate-spin" size={18} />
                    Sending OTP...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Send OTP <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Mail size={16} />
                    <span className="font-semibold">OTP sent to registered mobile</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToEmployeeCode}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Change Employee Code
                  </button>
                </div>

                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Enter OTP</label>
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 text-center text-2xl tracking-widest"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                    }}
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-400 text-center mt-2">
                    Enter the 6-digit OTP sent to your registered mobile number
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 text-xs rounded-2xl border border-rose-100 text-center font-bold">
                  {error}
                </div>
              )}

              {otpSent && !error && (
                <div className="p-4 bg-green-50 text-green-600 text-xs rounded-2xl border border-green-100 text-center font-bold">
                  OTP sent successfully!
                </div>
              )}

              <div className="space-y-3">
                <Button type="submit" fullWidth size="lg" disabled={loading || otp.length !== 6} className="group">
                  {loading ? (
                    <span className="flex items-center">
                      <RefreshCw className="mr-2 animate-spin" size={18} />
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Verify OTP <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </span>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  size="md"
                  onClick={handleResendOTP}
                  disabled={resendingOTP}
                >
                  {resendingOTP ? (
                    <span className="flex items-center">
                      <RefreshCw className="mr-2 animate-spin" size={16} />
                      Resending...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <RefreshCw className="mr-2" size={16} />
                      Resend OTP
                    </span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="flex justify-center items-center space-x-4 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
            <div className="flex items-center text-xs font-black text-slate-500 uppercase tracking-widest">
              <ShieldCheck size={14} className="mr-2 text-indigo-500" />
              OTP Secured
            </div>
            <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Tier-3 Security
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
          >
            Admin Login →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

