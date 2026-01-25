import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ApiResponse,
  Employee,
  AttendanceLog,
  AttendanceSummary,
  SalaryCalculation,
  User,
  AttendanceRecord,
  SalaryRecord,
} from '@/types';
import { SalaryStatus } from '@/types';

// Dynamically determine API base URL based on current host
const getApiBaseUrl = (): string => {
  // Always prioritize the environment variable if set
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback logic for local development
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3001/api`;
    }
    
    // Production fallback (should not reach here if VITE_API_BASE_URL is set)
    return `${protocol}//${hostname}:3001/api`;
  }
  
  // Server-side fallback
  return 'http://localhost:3001/api';
};

const API_KEY = import.meta.env.VITE_API_KEY || 'your-api-key';

// Log API configuration on module load (for debugging)
if (typeof window !== 'undefined') {
  const apiUrl = getApiBaseUrl();
  console.log('[API Config]', {
    baseURL: apiUrl,
    apiKey: API_KEY ? '***set***' : 'not set',
    env: import.meta.env.MODE,
    viteApiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  });
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
  timeout: 60000, // Increased to 60 seconds for slower networks
  withCredentials: false, // Don't send cookies to avoid CORS issues
});

// Request interceptor - add JWT token if available
apiClient.interceptors.request.use(
  (config) => {
    const currentApiUrl = getApiBaseUrl();
    config.baseURL = currentApiUrl;
    
    // Log API URL for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log('[API] Making request to:', currentApiUrl + (config.url || ''));
    }
    
    // Add JWT token if available (for employee portal)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Log detailed error information
    if (error.code === 'ECONNABORTED' || error.message.includes('aborted')) {
      console.error('[API Error] Request aborted - timeout or network issue', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
      });
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      console.error('[API Error] Network error - unable to reach server', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        message: error.message,
      });
    } else {
      console.error('[API Error]', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
    }
    
    if (error.response?.status === 401) {
      // Only redirect to login if we're not on an admin route
      // Admin routes use API key authentication, not JWT tokens
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/admin')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('employeeCode');
        localStorage.removeItem('role');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper to get token
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Admin APIs
const adminApi = {
  // Auth
  login: (username: string, password: string) =>
    apiClient.post<ApiResponse<{ token: string; username: string; role: string }>>('/auth/admin/login', { username, password }),
};

// Employee Self-Service APIs
const employeeApi = {
  // Auth
  sendOTP: (employeeCode: string) =>
    apiClient.post<ApiResponse<void>>('/auth/employee/send-otp', { employeeCode }),
  
  verifyOTP: (employeeCode: string, otp: string) =>
    apiClient.post<ApiResponse<{ token: string; employeeCode: string; role: string }>>('/auth/employee/verify-otp', { employeeCode, otp }),
  
  resendOTP: (employeeCode: string) =>
    apiClient.post<ApiResponse<void>>('/auth/employee/resend-otp', { employeeCode }),
  
  // Profile
  getProfile: () =>
    apiClient.get<ApiResponse<User>>('/employee/me'),
  
  updateProfile: (updates: Partial<User>) =>
    apiClient.patch<ApiResponse<User>>('/employee/me', updates),
  
  // Salary
  getCurrentSalary: (month?: string) => {
    const monthParam = month ? `?month=${month}` : '';
    return apiClient.get<ApiResponse<SalaryRecord>>(`/employee/salary${monthParam}`);
  },
  
  getSalaryHistory: () =>
    apiClient.get<ApiResponse<SalaryRecord[]>>('/employee/salary/history'),
  
  downloadPayslip: async (month: string): Promise<void> => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`${getApiBaseUrl()}/employee/salary/pdf?month=${month}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to download' }));
      throw new Error(error.message || 'Failed to download payslip');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${month}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  
  // Attendance
  getAttendance: (month?: string) => {
    const monthParam = month ? `?month=${month}` : '';
    return apiClient.get<ApiResponse<{ summary: any; dailyBreakdown: AttendanceRecord[] }>>(`/employee/attendance${monthParam}`);
  },
};

// Admin APIs (from admin-dashboard)
export const api = {
  // Admin APIs
  admin: adminApi,
  
  // Employee Self-Service APIs
  employee: employeeApi,
  
  // Admin Employee APIs
  employees: {
    getAll: () => 
      apiClient.get<ApiResponse<Employee[]>>('/employees'),
    getByCode: (employeeNo: string) =>
      apiClient.get<ApiResponse<Employee>>(`/employees/${employeeNo}`),
    search: (name: string) =>
      apiClient.get<ApiResponse<Employee[]>>(`/employees/search?name=${name}`),
    getByDepartment: (department: string) =>
      apiClient.get<ApiResponse<Employee[]>>(`/employees/department/${department}`),
    reload: () =>
      apiClient.post<ApiResponse<void>>('/employees/reload'),
  },

  employeeDetails: {
    getAll: () =>
      apiClient.get<ApiResponse<Employee[]>>('/employee-details'),
    getByCode: (employeeCode: string) =>
      apiClient.get<ApiResponse<Employee>>(`/employee-details/${employeeCode}`),
    getByDepartment: (department: string) =>
      apiClient.get<ApiResponse<Employee[]>>(`/employee-details/department/${department}`),
    create: (data: any) =>
      apiClient.post<ApiResponse<any>>('/employee-details', data),
    update: (employeeCode: string, data: any) =>
      apiClient.put<ApiResponse<any>>(`/employee-details/${employeeCode}`, data),
    markAsExited: (employeeCode: string, exitDate: string, updatedBy?: string) =>
      apiClient.post<ApiResponse<void>>(`/employee-details/${employeeCode}/exit`, { exitDate, updatedBy }),
    getSalaryInfo: (employeeCode: string) =>
      apiClient.get<ApiResponse<{ baseSalary: number; hourlyRate: number }>>(`/employee-details/${employeeCode}/salary-info`),
  },

  attendance: {
    getLatest: (limit: number = 50) =>
      apiClient.get<ApiResponse<AttendanceLog[]>>(`/attendance/latest?limit=${limit}`),
    getByDate: (date: string) =>
      apiClient.get<ApiResponse<AttendanceLog[]>>(`/attendance/by-date?date=${date}`),
    getRawLogs: (userId: number, date: string) =>
      apiClient.get<ApiResponse<any>>(`/attendance/logs/${userId}/${date}`),
    getByEmployee: (userId: number, start?: string, end?: string) => {
      let url = `/attendance/employee/${userId}`;
      if (start && end) url += `?start=${start}&end=${end}`;
      return apiClient.get<ApiResponse<AttendanceLog[]>>(url);
    },
    getSummary: (userId: number, month: string) =>
      apiClient.get<ApiResponse<AttendanceSummary>>(`/salary/${userId}/breakdown/${month}`),
    getDaily: (userId: number, date: string) =>
      apiClient.get<ApiResponse<AttendanceLog[]>>(`/attendance/daily/${userId}/${date}`),
    saveRegularization: (payload: any) =>
      apiClient.post<ApiResponse<any>>('/attendance/regularize', payload),
    getRegularization: (employeeCode: string, month: string) =>
      apiClient.get<ApiResponse<any>>(`/attendance/regularization/${employeeCode}?month=${month}`),
    deleteRegularization: (employeeCode: string, date: string) =>
      apiClient.delete<ApiResponse<void>>(`/attendance/regularization/${employeeCode}/${date}`),
  },

  salary: {
    calculate: (userId: number, month?: string, joinDate?: string, exitDate?: string, paidLeaveDates?: Array<{ date: string; value: number }> | string[], casualLeaveDates?: Array<{ date: string; value: number }> | string[]) => {
      let url = `/salary/${userId}`;
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (joinDate) params.append('joinDate', joinDate);
      if (exitDate) params.append('exitDate', exitDate);
      
      const extractDates = (dates: Array<{ date: string; value: number }> | string[] | undefined): string[] => {
        if (!dates || dates.length === 0) return [];
        if (typeof dates[0] === 'string') return dates as string[];
        return (dates as Array<{ date: string; value: number }>).map(item => item.date);
      };
      
      const paidDates = extractDates(paidLeaveDates);
      const casualDates = extractDates(casualLeaveDates);
      
      paidDates.forEach(date => params.append('paidLeave', date));
      casualDates.forEach(date => params.append('casualLeave', date));
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      return apiClient.get<ApiResponse<SalaryCalculation>>(url);
    },
    getStatus: (userId: number, month?: string) => {
      const url = month ? `/salary/${userId}/status?month=${month}` : `/salary/${userId}/status`;
      return apiClient.get<ApiResponse<any>>(url);
    },
    finalize: (userId: number, month: string) =>
      apiClient.post<ApiResponse<any>>(`/salary/${userId}/finalize`, { month }),
    finalizeAll: (month: string) =>
      apiClient.post<ApiResponse<any>>('/salary/finalize-all', { month }),
    getMonthlyHours: (userId: number, month?: string) => {
      const url = month ? `/salary/${userId}/hours?month=${month}` : `/salary/${userId}/hours`;
      return apiClient.get<ApiResponse<AttendanceSummary>>(url);
    },
    getBreakdown: (userId: number, month: string) =>
      apiClient.get<ApiResponse<AttendanceSummary>>(`/salary/${userId}/breakdown/${month}`),
    batchCalculate: (employeeCodes: string[], month: string) =>
      apiClient.post<ApiResponse<SalaryCalculation[]>>('/salary/batch', { employeeCodes, month }),
    getSummary: (month?: string, chunkSize?: number) => {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (chunkSize) params.append('chunkSize', chunkSize.toString());
      const queryString = params.toString();
      return apiClient.get<ApiResponse<any>>(`/salary/summary${queryString ? `?${queryString}` : ''}`);
    },
    getRecentAttendance: (userId: number) =>
      apiClient.get<ApiResponse<any>>(`/salary/${userId}/recent-attendance`),
    getAdjustments: (employeeCode: string, month: string) =>
      apiClient.get<ApiResponse<any>>(`/salary/adjustments/${employeeCode}?month=${month}`),
    saveAdjustment: (payload: any) =>
      apiClient.post<ApiResponse<any>>('/salary/adjustment', payload),
    getHold: (employeeCode: string, month: string) =>
      apiClient.get<any>(`/salary/hold/${employeeCode}?month=${month}`),
    createHold: (payload: any) =>
      apiClient.post<ApiResponse<any>>('/salary/hold', payload),
    releaseHold: (payload: any) =>
      apiClient.post<ApiResponse<any>>('/salary/release-hold', payload),
  },

  employeeShifts: {
    assign: (payload: any) =>
      apiClient.post<ApiResponse<any>>('/employee-shifts/assign', payload),
    getAssignments: (employeeCode: string, startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const queryString = params.toString();
      return apiClient.get<ApiResponse<any>>(`/employee-shifts/${employeeCode}${queryString ? `?${queryString}` : ''}`);
    },
    deleteAssignment: (id: number) =>
      apiClient.delete<ApiResponse<void>>(`/employee-shifts/${id}`),
  },

  leave: {
    approve: (employeeCode: string, month: string, paidLeaveDates: Array<{ date: string; value: number }>, casualLeaveDates: Array<{ date: string; value: number }>, approvedBy?: string) =>
      apiClient.post('/leave/approve', { employeeCode, month, paidLeaveDates, casualLeaveDates, approvedBy }),
    getBalance: (employeeCode: string, year: number, month?: string) => {
      const params = new URLSearchParams({ year: year.toString() });
      if (month) params.append('month', month);
      return apiClient.get(`/leave/${employeeCode}/balance?${params.toString()}`);
    },
    getMonthlyUsage: (employeeCode: string, month: string) =>
      apiClient.get(`/leave/${employeeCode}/monthly/${month}`),
  },

  shifts: {
    getAll: () =>
      apiClient.get<ApiResponse<any[]>>('/shifts'),
    getByName: (shiftName: string) =>
      apiClient.get<ApiResponse<any>>(`/shifts/${shiftName}`),
  },

  overtime: {
    getStatus: (employeeCode: string, month: string) =>
      apiClient.get<ApiResponse<{ employeeCode: string; month: string; isOvertimeEnabled: boolean }>>(`/overtime/${employeeCode}/${month}`),
    updateStatus: (employeeCode: string, month: string, isOvertimeEnabled: boolean) =>
      apiClient.post<ApiResponse<any>>(`/overtime/${employeeCode}/${month}`, { isOvertimeEnabled }),
    getBatchStatus: (employeeCodes: string[], month: string) => {
      const codes = employeeCodes.join(',');
      return apiClient.get<ApiResponse<any>>(`/overtime/batch/${month}?employeeCodes=${codes}`);
    },
  },

  health: () => apiClient.get('/health'),
  ping: () => apiClient.get('/ping'),
  get: (url: string) => apiClient.get(url),
  post: (url: string, data?: any) => apiClient.post(url, data),
  put: (url: string, data?: any) => apiClient.put(url, data),
  delete: (url: string) => apiClient.delete(url),
};

// Export employee API functions directly for backward compatibility
export const sendOTP = (employeeCode: string) => api.employee.sendOTP(employeeCode);
export const verifyOTP = (employeeCode: string, otp: string) => api.employee.verifyOTP(employeeCode, otp);
export const resendOTP = (employeeCode: string) => api.employee.resendOTP(employeeCode);
export const getEmployeeProfile = () => api.employee.getProfile();
export const updateEmployeeProfile = (updates: Partial<User>) => api.employee.updateProfile(updates);
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${getApiBaseUrl()}/employee/me/password`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  
  if (response.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to change password' }));
    throw new Error(error.error || error.message || 'Failed to change password');
  }
};

// Salary functions with proper response transformation
export const getCurrentSalary = async (month?: string): Promise<SalaryRecord | null> => {
  try {
    const response = await api.employee.getCurrentSalary(month);
    if (response.data?.data) {
      const data: any = response.data.data;
      return {
        id: data.month || month || new Date().toISOString().slice(0, 7),
        month: data.month || new Date().toLocaleDateString('en-US', { month: 'long' }),
        year: parseInt((data.month || month || new Date().toISOString().slice(0, 7)).split('-')[0]),
        grossSalary: data.grossSalary || data.baseSalary || 0,
        netSalary: data.netSalary || 0,
        baseSalary: data.baseSalary || data.grossSalary || 0,
        perDayRate: data.perDayRate || 0,
        status: (data.isHeld || data.status === 'HOLD') ? SalaryStatus.HOLD : SalaryStatus.PAID,
        paymentDate: data.paymentDate,
      };
    }
    return null;
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.data?.status === 'NOT_GENERATED') {
      return null;
    }
    throw error;
  }
};

export const getSalaryHistory = async (): Promise<SalaryRecord[]> => {
  try {
    const response = await api.employee.getSalaryHistory();
    console.log('[API] Salary history response:', response.data);
    
    if (response.data?.success && response.data?.data && Array.isArray(response.data.data)) {
      const mapped = response.data.data.map((item: any) => {
        // Parse month from "YYYY-MM" format
        let monthStr = item.month || '';
        let year = new Date().getFullYear();
        let monthName = new Date().toLocaleDateString('en-US', { month: 'long' });
        
        if (monthStr && monthStr.includes('-')) {
          // Format: "2024-01" or "2024-1"
          const [yearStr, monthNumStr] = monthStr.split('-');
          year = parseInt(yearStr, 10);
          const monthNum = parseInt(monthNumStr, 10);
          if (!isNaN(year) && !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
            const date = new Date(year, monthNum - 1, 1);
            monthName = date.toLocaleDateString('en-US', { month: 'long' });
          }
        } else if (monthStr) {
          // Try to parse as date string
          const date = new Date(monthStr);
          if (!isNaN(date.getTime())) {
            year = date.getFullYear();
            monthName = date.toLocaleDateString('en-US', { month: 'long' });
          }
        }
        
        return {
          id: item.id || item.month || `${year}-${monthName}`,
          month: monthName,
          year: year,
          grossSalary: item.grossSalary || item.baseSalary || 0,
          netSalary: item.netSalary || 0,
          baseSalary: item.baseSalary || item.grossSalary || 0,
          perDayRate: item.perDayRate || 0,
          status: (item.isHeld || item.status === 'HOLD' || item.status === 'hold') ? SalaryStatus.HOLD : SalaryStatus.PAID,
          paymentDate: item.paymentDate || undefined,
        };
      });
      
      console.log('[API] Mapped salary history:', mapped);
      return mapped;
    }
    
    console.warn('[API] No salary history data in response:', response.data);
    return [];
  } catch (error) {
    console.error('[API] Error fetching salary history:', error);
    throw error;
  }
};

export const downloadPayslip = (month: string) => api.employee.downloadPayslip(month);

export const getAttendanceData = async (month?: string): Promise<{ summary: any; dailyBreakdown: AttendanceRecord[] }> => {
  const response = await api.employee.getAttendance(month);
  if (response.data?.data) {
    return response.data.data;
  }
  return {
    summary: {
      fullDays: 0,
      halfDays: 0,
      absentDays: 0,
      lateDays: 0,
      earlyExits: 0,
      totalWorkedHours: 0,
    },
    dailyBreakdown: [],
  };
};

export default apiClient;

