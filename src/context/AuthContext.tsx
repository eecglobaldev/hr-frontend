/**
 * Unified Authentication Context
 * Supports both Admin and Employee authentication
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { api } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  employeeCode: string | null;
  role: string | null; // 'admin' | 'employee'
  checkAuthMethod: (employeeCode: string) => Promise<{ hasPassword: boolean; requiresOTP: boolean; isLocked: boolean; lockedUntil: string | null; attemptsRemaining: number }>;
  verifyOTPAndLogin: (employeeCode: string, otp: string) => Promise<{ success: boolean; role?: string }>;
  loginWithPassword: (employeeCode: string, password: string) => Promise<{ success: boolean; error?: string; attemptsRemaining?: number; lockedUntil?: string | null }>;
  setPasswordAfterOTP: (employeeCode: string, otp: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  resetPasswordAfterOTP: (employeeCode: string, otp: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  adminLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [employeeCode, setEmployeeCode] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedEmployeeCode = localStorage.getItem('employeeCode');
      const storedRole = localStorage.getItem('role');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedEmployeeCode) {
        setToken(storedToken);
        setEmployeeCode(storedEmployeeCode);
        setRole(storedRole);
        
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Failed to parse stored user:', e);
          }
        }
        
        // Verify token by fetching profile (for employee portal)
        if (storedRole === 'employee') {
          try {
            const profileResponse = await api.employee.getProfile();
            const profileData = profileResponse.data?.data;
            if (profileData) {
              setUser(profileData);
              localStorage.setItem('user', JSON.stringify(profileData));
            }
          } catch (error) {
            console.error('Token validation failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('employeeCode');
            localStorage.removeItem('role');
            localStorage.removeItem('user');
            setToken(null);
            setEmployeeCode(null);
            setRole(null);
            setUser(null);
          }
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const checkAuthMethod = async (employeeCode: string): Promise<{ hasPassword: boolean; requiresOTP: boolean; isLocked: boolean; lockedUntil: string | null; attemptsRemaining: number }> => {
    try {
      const response = await api.employee.checkAuthMethod(employeeCode);
      const responseData = response.data?.data;
      
      if (responseData && response.data?.success) {
        return {
          hasPassword: responseData.hasPassword,
          requiresOTP: responseData.requiresOTP,
          isLocked: responseData.isLocked,
          lockedUntil: responseData.lockedUntil,
          attemptsRemaining: responseData.attemptsRemaining,
        };
      }
      
      // Default to OTP required if check fails
      return {
        hasPassword: false,
        requiresOTP: true,
        isLocked: false,
        lockedUntil: null,
        attemptsRemaining: 5,
      };
    } catch (error: any) {
      console.error('[AuthContext] Error checking auth method:', error);
      // Default to OTP required on error
      return {
        hasPassword: false,
        requiresOTP: true,
        isLocked: false,
        lockedUntil: null,
        attemptsRemaining: 5,
      };
    }
  };

  const loginWithPassword = async (employeeCode: string, password: string): Promise<{ success: boolean; error?: string; attemptsRemaining?: number; lockedUntil?: string | null }> => {
    try {
      const response = await api.employee.loginWithPassword(employeeCode, password);
      const responseData = response.data?.data;
      
      if (responseData && response.data?.success) {
        const { token, employeeCode: code, role: userRole } = responseData;
        
        if (!token || !code || !userRole) {
          console.error('[AuthContext] Invalid password login response data:', responseData);
          return { success: false, error: 'Invalid response from server' };
        }
        
        const normalizedRole = userRole.toLowerCase();
        
        localStorage.setItem('token', token);
        localStorage.setItem('employeeCode', code);
        localStorage.setItem('role', normalizedRole);
        
        setToken(token);
        setEmployeeCode(code);
        setRole(normalizedRole);
        
        // Fetch user profile
        try {
          const profileResponse = await api.employee.getProfile();
          const profileData = profileResponse.data?.data;
          if (profileData) {
            setUser(profileData);
            localStorage.setItem('user', JSON.stringify(profileData));
          }
        } catch (error) {
          console.error('[AuthContext] Failed to fetch user profile:', error);
        }
        
        return { success: true };
      }
      
      return { success: false, error: 'Invalid password' };
    } catch (error: any) {
      console.error('[AuthContext] Password login failed:', error);
      const errorData = error?.response?.data;
      const errorMessage = errorData?.error || errorData?.message || error?.message || 'Login failed. Please try again.';
      
      return {
        success: false,
        error: errorMessage,
        attemptsRemaining: errorData?.data?.attemptsRemaining,
        lockedUntil: errorData?.data?.lockedUntil || errorData?.lockedUntil,
      };
    }
  };

  const resetPasswordAfterOTP = async (employeeCode: string, otp: string, password: string): Promise<{ success: boolean; error?: string; role?: string }> => {
    try {
      const response = await api.employee.resetPassword(employeeCode, otp, password);
      const responseData = response.data?.data;
      
      if (responseData && response.data?.success) {
        const { token, employeeCode: code, role: userRole } = responseData;
        
        if (!token || !code || !userRole) {
          console.error('[AuthContext] Invalid reset password response data:', responseData);
          return { success: false, error: 'Invalid response from server' };
        }
        
        const normalizedRole = userRole.toLowerCase();
        
        localStorage.setItem('token', token);
        localStorage.setItem('employeeCode', code);
        localStorage.setItem('role', normalizedRole);
        
        setToken(token);
        setEmployeeCode(code);
        setRole(normalizedRole);
        
        // Fetch user profile
        try {
          const profileResponse = await api.employee.getProfile();
          const profileData = profileResponse.data?.data;
          if (profileData) {
            setUser(profileData);
            localStorage.setItem('user', JSON.stringify(profileData));
          }
        } catch (error) {
          console.error('[AuthContext] Failed to fetch user profile:', error);
        }
        
        return { success: true, role: normalizedRole };
      }
      
      return { success: false, error: 'Failed to reset password' };
    } catch (error: any) {
      console.error('[AuthContext] Reset password failed:', error);
      const errorData = error?.response?.data;
      const errorMessage = errorData?.error || errorData?.message || error?.message || 'Failed to reset password. Please try again.';
      const errors = errorData?.errors || [];
      
      return {
        success: false,
        error: errors.length > 0 ? errors.join(', ') : errorMessage,
      };
    }
  };

  const setPasswordAfterOTP = async (employeeCode: string, otp: string, password: string): Promise<{ success: boolean; error?: string; role?: string }> => {
    try {
      const response = await api.employee.setPassword(employeeCode, otp, password);
      const responseData = response.data?.data;
      
      if (responseData && response.data?.success) {
        const { token, employeeCode: code, role: userRole } = responseData;
        
        if (!token || !code || !userRole) {
          console.error('[AuthContext] Invalid set password response data:', responseData);
          return { success: false, error: 'Invalid response from server' };
        }
        
        const normalizedRole = userRole.toLowerCase();
        
        localStorage.setItem('token', token);
        localStorage.setItem('employeeCode', code);
        localStorage.setItem('role', normalizedRole);
        
        setToken(token);
        setEmployeeCode(code);
        setRole(normalizedRole);
        
        // Fetch user profile
        try {
          const profileResponse = await api.employee.getProfile();
          const profileData = profileResponse.data?.data;
          if (profileData) {
            setUser(profileData);
            localStorage.setItem('user', JSON.stringify(profileData));
          }
        } catch (error) {
          console.error('[AuthContext] Failed to fetch user profile:', error);
        }
        
        return { success: true, role: normalizedRole };
      }
      
      return { success: false, error: 'Failed to set password' };
    } catch (error: any) {
      console.error('[AuthContext] Set password failed:', error);
      const errorData = error?.response?.data;
      const errorMessage = errorData?.error || errorData?.message || error?.message || 'Failed to set password. Please try again.';
      const errors = errorData?.errors || [];
      
      return {
        success: false,
        error: errors.length > 0 ? errors.join(', ') : errorMessage,
      };
    }
  };

  const verifyOTPAndLogin = async (employeeCode: string, otp: string): Promise<{ success: boolean; role?: string }> => {
    try {
      const response = await api.employee.verifyOTP(employeeCode, otp);
      
      // Axios response structure: response.data is the ApiResponse wrapper
      // Backend returns: { success: true, data: { token, employeeCode, role } }
      // So we need: response.data.data
      const responseData = response.data?.data;
      
      if (responseData && response.data?.success) {
        const { token, employeeCode: code, role: userRole } = responseData;
        
        if (!token || !code || !userRole) {
          console.error('[AuthContext] Invalid response data:', responseData);
          return { success: false };
        }
        
        // Normalize role to lowercase (backend returns 'EMPLOYEE', we need 'employee')
        const normalizedRole = userRole.toLowerCase();
        
        localStorage.setItem('token', token);
        localStorage.setItem('employeeCode', code);
        localStorage.setItem('role', normalizedRole);
        
        setToken(token);
        setEmployeeCode(code);
        setRole(normalizedRole);
        
        // Fetch user profile
        try {
          const profileResponse = await api.employee.getProfile();
          // Profile response structure: { success: true, data: User }
          const profileData = profileResponse.data?.data;
          if (profileData) {
            setUser(profileData);
            localStorage.setItem('user', JSON.stringify(profileData));
          }
        } catch (error) {
          console.error('[AuthContext] Failed to fetch user profile:', error);
          // Don't fail login if profile fetch fails
        }
        
        return { success: true, role: normalizedRole };
      }
      
      return { success: false };
    } catch (error: any) {
      console.error('[AuthContext] OTP verification failed:', error);
      return { success: false };
    }
  };

  const adminLogin = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.admin.login(username, password);
      
      // Axios response structure: response.data is the ApiResponse wrapper
      // Backend returns: { success: true, data: { token, username, role } }
      const responseData = response.data?.data;
      
      if (responseData && response.data?.success) {
        const { token, username: adminUsername, role: userRole } = responseData;
        
        if (!token || !adminUsername || !userRole) {
          console.error('[AuthContext] Invalid admin login response data:', responseData);
          return { success: false, error: 'Invalid response from server' };
        }
        
        // Normalize role to lowercase (backend returns 'ADMIN', we need 'admin')
        const normalizedRole = userRole.toLowerCase();
        
        localStorage.setItem('token', token);
        localStorage.setItem('employeeCode', adminUsername); // Store username as employeeCode for consistency
        localStorage.setItem('role', normalizedRole);
        localStorage.setItem('username', adminUsername);
        
        setToken(token);
        setEmployeeCode(adminUsername);
        setRole(normalizedRole);
        
        // For admin, we might not have a user profile endpoint
        // Set a basic user object if needed
        const adminUser: User = {
          id: adminUsername,
          employeeCode: adminUsername,
          name: adminUsername,
          email: '',
          phone: '',
          department: 'Administration',
          designation: 'Administrator',
          joinDate: new Date().toISOString(),
        };
        setUser(adminUser);
        localStorage.setItem('user', JSON.stringify(adminUser));
        
        return { success: true };
      }
      
      return { success: false, error: 'Invalid credentials' };
    } catch (error: any) {
      console.error('[AuthContext] Admin login failed:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Login failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employeeCode');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    
    setToken(null);
    setEmployeeCode(null);
    setRole(null);
    setUser(null);
    
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!token, 
        token,
        employeeCode,
        role,
        checkAuthMethod,
        verifyOTPAndLogin,
        loginWithPassword,
        setPasswordAfterOTP,
        resetPasswordAfterOTP,
        adminLogin,
        logout, 
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

