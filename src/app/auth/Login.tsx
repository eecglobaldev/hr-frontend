import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import Button from '@/components/ui/Button';
import { ShieldCheck, ArrowRight, Mail, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react';
import { validatePasswordStrength, getPasswordStrength } from '@/utils/password';

type LoginStep = 'employeeCode' | 'password' | 'otp' | 'setPassword' | 'resetPassword';

const Login: React.FC = () => {
  const [step, setStep] = useState<LoginStep>('employeeCode');
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [resendingOTP, setResendingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [isLocked, setIsLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  
  const { checkAuthMethod, loginWithPassword, setPasswordAfterOTP, resetPasswordAfterOTP, verifyOTPAndLogin, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    const redirectPath = role === 'admin' ? '/admin/dashboard' : '/employee/attendance';
    return <Navigate to={redirectPath} replace />;
  }

  const handleCheckAuthMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCheckingAuth(true);

    try {
      const authInfo = await checkAuthMethod(employeeCode);
      
      if (authInfo.isLocked) {
        setIsLocked(true);
        setLockedUntil(authInfo.lockedUntil);
        setError(`Account is locked. Please try again after ${authInfo.lockedUntil ? new Date(authInfo.lockedUntil).toLocaleString() : 'lockout period expires'}.`);
        setCheckingAuth(false);
        return;
      }

      if (authInfo.hasPassword) {
        // User has password - go to password login
        setStep('password');
        setAttemptsRemaining(authInfo.attemptsRemaining);
      } else {
        // User doesn't have password - send OTP
        await handleSendOTP();
      }
    } catch (err: any) {
      console.error('[Login] Check auth method error:', err);
      let errorMessage = 'Failed to check authentication method. Please try again.';
      
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('aborted')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err?.code === 'ERR_NETWORK' || !err?.response) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleSendOTP = async () => {
    setError('');
    setSendingOTP(true);

    try {
      await api.employee.sendOTP(employeeCode);
      setOtpSent(true);
      setStep('otp');
    } catch (err: any) {
      console.error('[Login] Send OTP error:', err);
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('aborted')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err?.code === 'ERR_NETWORK' || !err?.response) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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
      // Verify OTP - backend will check if password exists
      const response = await api.employee.verifyOTP(employeeCode, otp);
      
      if (response.data?.success) {
        const responseData = response.data.data;
        
        // Check if password setup is required
        if (responseData?.requiresPasswordSetup) {
          // User doesn't have password - go to set password step
          setStep('setPassword');
          setLoading(false);
          return;
        }
        
        // User has password and OTP is valid - log them in
        // This shouldn't happen in normal flow (users with password should use password login)
        // But handle it for backward compatibility
        if (responseData?.token) {
          const result = await verifyOTPAndLogin(employeeCode, otp);
          if (result.success && result.role) {
            const redirectPath = result.role === 'admin' ? '/admin/dashboard' : '/employee/attendance';
            window.location.href = redirectPath;
          }
        } else {
          // No token but success - should go to set password
          setStep('setPassword');
          setLoading(false);
        }
      } else {
        setError('Invalid OTP. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[Login] Verify OTP error:', err);
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('aborted')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err?.code === 'ERR_NETWORK' || !err?.response) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginWithPassword(employeeCode, password);
      
      if (result.success) {
        const redirectPath = role === 'admin' ? '/admin/dashboard' : '/employee/attendance';
        window.location.href = redirectPath;
      } else {
        setError(result.error || 'Invalid password. Please try again.');
        if (result.attemptsRemaining !== undefined) {
          setAttemptsRemaining(result.attemptsRemaining);
        }
        if (result.lockedUntil) {
          setIsLocked(true);
          setLockedUntil(result.lockedUntil);
        }
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[Login] Password login error:', err);
      let errorMessage = 'Login failed. Please try again.';
      
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('aborted')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err?.code === 'ERR_NETWORK' || !err?.response) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate OTP
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      setError(`Password does not meet requirements: ${validation.errors.join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      // Use resetPasswordAfterOTP for password reset
      // This will call the resetPassword endpoint which verifies OTP internally
      const result = await resetPasswordAfterOTP(employeeCode, otp, password);
      
      if (result.success && result.role) {
        // Password reset successfully and user is logged in
        const redirectPath = result.role === 'admin' ? '/admin/dashboard' : '/employee/attendance';
        window.location.href = redirectPath;
      } else {
        setError(result.error || 'Failed to reset password. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[Login] Reset password error:', err);
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('aborted')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err?.code === 'ERR_NETWORK' || !err?.response) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
        const errors = err.response.data.errors;
        if (errors && Array.isArray(errors)) {
          errorMessage = errors.join(', ');
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      setError(`Password does not meet requirements: ${validation.errors.join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      // Use setPasswordAfterOTP which will set password and log user in
      const result = await setPasswordAfterOTP(employeeCode, otp, password);
      
      if (result.success && result.role) {
        // Password set successfully and user is logged in
        const redirectPath = result.role === 'admin' ? '/admin/dashboard' : '/employee/attendance';
        window.location.href = redirectPath;
      } else {
        setError(result.error || 'Failed to set password. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[Login] Set password error:', err);
      let errorMessage = 'Failed to set password. Please try again.';
      
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('aborted')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err?.code === 'ERR_NETWORK' || !err?.response) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
        const errors = err.response.data.errors;
        if (errors && Array.isArray(errors)) {
          errorMessage = errors.join(', ');
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleBackToEmployeeCode = () => {
    setStep('employeeCode');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setError('');
    setOtpSent(false);
    setIsLocked(false);
    setLockedUntil(null);
    setAttemptsRemaining(5);
    setPasswordStrength('weak');
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(getPasswordStrength(value));
  };

  const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">EEC<span className="text-indigo-600"> HR Portal</span></h1>
          <p className="text-slate-500 font-semibold tracking-wide uppercase text-xs">Identity Management Gateway</p>
        </div>

        <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)]">
          {step === 'employeeCode' ? (
            <form onSubmit={handleCheckAuthMethod} className="space-y-8">
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

              {isLocked && lockedUntil && (
                <div className="p-4 bg-orange-50 text-orange-600 text-xs rounded-2xl border border-orange-100 text-center font-bold">
                  Account locked until {new Date(lockedUntil).toLocaleString()}
                </div>
              )}

              <Button type="submit" fullWidth size="lg" disabled={checkingAuth || isLocked} className="group">
                {checkingAuth ? (
                  <span className="flex items-center">
                    <RefreshCw className="mr-2 animate-spin" size={18} />
                    Checking...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Continue <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </span>
                )}
              </Button>
            </form>
          ) : step === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Lock size={16} />
                    <span className="font-semibold">Password Login</span>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Enter Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 pr-12 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {attemptsRemaining < 5 && attemptsRemaining > 0 && (
                  <p className="text-xs text-orange-600 text-center">
                    {attemptsRemaining} attempt(s) remaining
                  </p>
                )}
              </div>

              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 text-xs rounded-2xl border border-rose-100 text-center font-bold">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Button type="submit" fullWidth size="lg" disabled={loading || !password} className="group">
                  {loading ? (
                    <span className="flex items-center">
                      <RefreshCw className="mr-2 animate-spin" size={18} />
                      Logging in...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Login <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </span>
                  )}
                </Button>
                
                <button
                  type="button"
                  onClick={async () => {
                    setError('');
                    setPassword('');
                    setOtp('');
                    setConfirmPassword('');
                    // Send OTP for password reset
                    try {
                      await handleSendOTP();
                      // After OTP is sent, switch to reset password step
                      setStep('resetPassword');
                    } catch (err) {
                      // Error already handled in handleSendOTP
                    }
                  }}
                  className="w-full text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors text-center"
                >
                  Forgot Password? Reset via OTP
                </button>
              </div>
            </form>
          ) : step === 'otp' ? (
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
          ) : step === 'setPassword' ? (
            <form onSubmit={handleSetPassword} className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Lock size={16} />
                    <span className="font-semibold">Set Your Password</span>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 pr-12 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      required
                      autoFocus
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {password && (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className={`h-1 flex-1 rounded-full ${getPasswordStrengthColor(passwordStrength)}`}></div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{passwordStrength}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Must be at least 8 characters with uppercase, lowercase, and number
                      </p>
                    </div>
                  )}
                </div>

                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 pr-12 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] text-rose-500">Passwords do not match</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 text-xs rounded-2xl border border-rose-100 text-center font-bold">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  fullWidth 
                  size="lg" 
                  disabled={loading || !password || !confirmPassword || password !== confirmPassword || passwordStrength === 'weak'} 
                  className="group"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <RefreshCw className="mr-2 animate-spin" size={18} />
                      Setting Password...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Set Password <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </span>
                  )}
                </Button>
              </div>
            </form>
          ) : step === 'resetPassword' ? (
            <form onSubmit={handleResetPassword} className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Lock size={16} />
                    <span className="font-semibold">Reset Your Password</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('password');
                      setError('');
                      setOtp('');
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Back to Login
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
                    onKeyDown={(e) => {
                      // Prevent form submission when pressing Enter on OTP field
                      if (e.key === 'Enter' && (!password || !confirmPassword)) {
                        e.preventDefault();
                      }
                    }}
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-400 text-center mt-2">
                    Enter the 6-digit OTP sent to your registered mobile number
                  </p>
                </div>

                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 pr-12 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {password && (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className={`h-1 flex-1 rounded-full ${getPasswordStrengthColor(passwordStrength)}`}></div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{passwordStrength}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Must be at least 8 characters with uppercase, lowercase, and number
                      </p>
                    </div>
                  )}
                </div>

                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 pr-12 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] text-rose-500">Passwords do not match</p>
                  )}
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
                <Button 
                  type="submit" 
                  fullWidth 
                  size="lg" 
                  disabled={loading || !otp || otp.length !== 6 || !password || !confirmPassword || password !== confirmPassword || passwordStrength === 'weak'} 
                  className="group"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <RefreshCw className="mr-2 animate-spin" size={18} />
                      Resetting Password...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Reset Password <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
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
          ) : null}
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="flex justify-center items-center space-x-4 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
            <div className="flex items-center text-xs font-black text-slate-500 uppercase tracking-widest">
              <ShieldCheck size={14} className="mr-2 text-indigo-500" />
              Secure Login
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
