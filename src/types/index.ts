// Branch Types
export interface Branch {
  "@type": string;
  name: string;
  address: {
    "@type": string;
    streetAddress: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  contactPoint?: Array<{
    "@type": string;
    contactType: string;
    telephone: string;
    url?: string;
  }>;
  counselors?: Array<{
    name: string;
    phone: string;
    email?: string;
  }>;
  hasMap?: string;
  identifier?: string;
  [key: string]: any; // Allow additional properties
}

// Employee Types
export interface Employee {
  employeeNo: string;
  employeeId?: number | null; // EmployeeId for salary calculations
  name: string;
  department: string;
  designation: string;
  fullBasic: number;
  monthlyCTC: number;
  annualCTC: number;
  joinDate: string;
  status: string;
  location: string;
  joiningDate?: string;
  exitDate?: string | null;
  isActive?: boolean;
  shift?: string | null;
  BankAccountNo: string;
  IFSCcode: string;
}

// User Types
export interface User {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  joinDate: string;
}

// Attendance Types
export enum AttendanceStatus {
  PRESENT = 'Present',
  HALF = 'Half',
  ABSENT = 'Absent',
  LEAVE = 'Leave',
  WEEK_OFF = 'Week Off',
  HOLIDAY = 'Holiday'
}

export interface AttendanceLog {
  DeviceLogId: number;
  UserId: number;
  LogDate: string;
  Direction: string;
  DeviceId: number;
}

export interface DailyAttendance {
  date: string;
  firstEntry: string | null;
  lastExit: string | null;
  totalHours: number;
  isLate: boolean;
  minutesLate: number | null;
  isEarlyExit: boolean;
  status: 'full-day' | 'half-day' | 'absent' | 'not-active' | 'weekoff' | 'holiday';
  logCount: number;
  weekoffType?: 'paid' | 'unpaid';
}

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
  shift: string;
  firstEntry?: string | null;
  lastExit?: string | null;
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  isLate?: boolean;
  minutesLate?: number | null;
  isEarlyExit?: boolean;
  logCount?: number;
  isPaidLeave?: boolean;
  isCasualLeave?: boolean;
  isRegularized?: boolean;
  regularizationValue?: number;
  regularizationOriginalStatus?: string;
}

export interface AttendanceSummary {
  userId?: number;
  month: string;
  summary: {
    totalWorkedHours: number;
    fullDays: number;
    halfDays: number;
    absentDays: number;
    lateDays: number;
    earlyExits: number;
    tenMinLate?: number;
    thirtyMinLate?: number;
  };
  dailyBreakdown: (DailyAttendance | AttendanceRecord)[];
}

// Salary Types
export enum SalaryStatus {
  PAID = 'PAID',
  HOLD = 'HOLD'
}

export interface SalaryBreakdown {
  perDayRate: number;
  hourlyRate: number;
  absentDeduction: number;
  halfDayDeduction: number;
  lateDeduction: number;
  totalDeductions: number;
  overtimeAmount: number;
  sundayPay: number;
  adjustmentDeductions?: number;
  adjustmentAdditions?: number;
  incentiveAmount?: number;
  adjustmentDetails?: Array<{
    type: string;
    category: string;
    amount: number;
    description?: string;
  }>;
}

export interface AttendanceInfo {
  totalDays: number;
  expectedWorkingDays: number;
  fullDays: number;
  halfDays: number;
  absentDays: number;
  lateDays: number;
  earlyExits: number;
  totalWorkedHours: number;
  expectedHours: number;
  overtimeHours: number;
  isOvertimeEnabled?: boolean;
  sundaysInMonth: number;
  actualDaysWorked: number;
  totalPayableDays: number;
}

export interface SalaryCalculation {
  employeeCode: string;
  employeeName?: string;
  month: string;
  baseSalary: number;
  grossSalary: number;
  netSalary: number;
  attendance: AttendanceInfo;
  breakdown: SalaryBreakdown;
}

export interface SalaryRecord {
  id: string;
  month: string;
  year: number;
  grossSalary: number;
  netSalary: number;
  baseSalary?: number;
  perDayRate?: number;
  status: SalaryStatus;
  paymentDate?: string;
}

// Leave Types
export enum LeaveStatus {
  APPROVED = 'Approved',
  PENDING = 'Pending',
  REJECTED = 'Rejected'
}

export interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason: string;
}

export interface LeaveDateWithValue {
  date: string;
  value: number;
}

// Holiday Types
export interface Holiday {
  id: number;
  date: string; // YYYY-MM-DD
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// Other Types
export interface CompanyDocument {
  id: string;
  name: string;
  category: 'Payroll' | 'Policy' | 'Tax' | 'Legal';
  uploadDate: string;
  size: string;
}

export interface HRTask {
  id: string;
  title: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalEmployees: number;
  todayAttendance: number;
  monthlySalary: number;
  averageWorkHours: number;
}

