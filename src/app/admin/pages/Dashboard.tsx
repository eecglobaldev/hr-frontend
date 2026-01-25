import { useEffect, useState } from 'react';
import { Users, Calendar, Wallet, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/services/api';
import { formatCurrency, getCurrentMonth } from '@/utils/format';
import type { Employee, SalaryCalculation } from '@/types';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryData, setSalaryData] = useState<SalaryCalculation[]>([]);

  const currentMonth = getCurrentMonth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all employees
      const employeesRes = await api.employees.getAll();
      const employeeList = employeesRes.data.data || [];
      console.log('[Dashboard] Loaded employees:', employeeList.length);
      setEmployees(employeeList);

      if (employeeList.length === 0) {
        console.warn('[Dashboard] No employees found');
        setLoading(false);
        return;
      }

      // Fetch salary data for first 5 employees (for demo)
      // All employees in the list already have EmployeeDetails (filtered by backend)
      const validEmployees = employeeList.slice(0, 5).filter(emp => emp.employeeNo && emp.employeeNo.trim() !== '');
      console.log('[Dashboard] Valid employees for salary calculation:', validEmployees.length);
      
      if (validEmployees.length === 0) {
        console.warn('[Dashboard] No valid employees with employeeNo found');
        setSalaryData([]);
        setLoading(false);
        return;
      }
      
      const salaryPromises = validEmployees.map(emp => {
        // Use employeeId if available, otherwise try to parse employeeNo
        const employeeId = (emp as any).employeeId;
        const employeeNo = emp.employeeNo;
        
        // Determine userId - prefer employeeId, fallback to parsed employeeNo
        let userId: number | null = null;
        if (employeeId && !isNaN(Number(employeeId))) {
          userId = Number(employeeId);
        } else if (employeeNo && !isNaN(parseInt(employeeNo))) {
          userId = parseInt(employeeNo);
        }
        
        if (!userId || isNaN(userId)) {
          // Silently skip - don't log warnings for missing IDs
          return Promise.resolve(null);
        }
        
        console.log(`[Dashboard] Calculating salary for employee ${employeeNo} (userId: ${userId})`);
        return api.salary.calculate(userId, currentMonth)
          .then(res => {
            console.log(`[Dashboard] Successfully calculated salary for ${employeeNo}`);
            return res.data.data;
          })
          .catch((err) => {
            // Log error but don't break the dashboard
            console.warn(`[Dashboard] Failed to calculate salary for ${employeeNo}:`, err.response?.data?.message || err.message);
            return null;
          });
      });
      
      const salaries = (await Promise.all(salaryPromises)).filter(Boolean) as SalaryCalculation[];
      console.log('[Dashboard] Successfully loaded salary data:', salaries.length);
      setSalaryData(salaries);

    } catch (err: any) {
      console.error('[Dashboard] Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchDashboardData} />;
  }

  // Calculate stats
  const totalEmployees = employees.length;
  const todayAttendance = salaryData.length > 0 ? salaryData.reduce((sum, s) => sum + s.attendance.fullDays, 0) : 0;
  const totalSalary = salaryData.length > 0 ? salaryData.reduce((sum, s) => sum + s.netSalary, 0) : 0;
  const avgHours = salaryData.length > 0
    ? salaryData.reduce((sum, s) => sum + s.attendance.totalWorkedHours, 0) / salaryData.length
    : 0;

  // Prepare chart data - handle empty data gracefully
  const attendanceChartData = salaryData.length > 0 ? salaryData.map(s => ({
    name: s.employeeCode || 'Unknown',
    fullDays: s.attendance?.fullDays || 0,
    halfDays: s.attendance?.halfDays || 0,
    absent: s.attendance?.absentDays || 0,
  })) : [];

  const salaryChartData = salaryData.length > 0 ? salaryData.map(s => ({
    name: s.employeeCode || 'Unknown',
    baseSalary: s.baseSalary || 0,
    netSalary: s.netSalary || 0,
    deductions: s.breakdown?.totalDeductions || 0,
  })) : [];

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
          <h1 className="text-4xl font-bold text-white tracking-tight">Executive Dashboard</h1>
        </div>
        <p className="text-slate-400 font-medium pl-4">
          Corporate performance and workforce analytics for {currentMonth}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Workforce Size"
          value={totalEmployees}
          icon={Users}
          color="blue"
          trend={{ value: "2.4%", isPositive: true }}
        />
        <StatCard
          title="Active Presence"
          value={todayAttendance}
          icon={Calendar}
          color="green"
          trend={{ value: "12%", isPositive: true }}
        />
        <StatCard
          title="Monthly Payroll"
          value={formatCurrency(totalSalary)}
          icon={Wallet}
          color="purple"
          trend={{ value: "0.8%", isPositive: false }}
        />
        <StatCard
          title="Avg Efficiency"
          value={`${avgHours.toFixed(1)}h`}
          icon={Clock}
          color="orange"
          trend={{ value: "4.2%", isPositive: true }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Attendance Performance Metrics">
          <div className="h-[350px]">
            {attendanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorFull" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                  <Bar dataKey="fullDays" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="halfDays" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <p>No attendance data available</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Financial Disbursement Trends">
          <div className="h-[350px]">
            {salaryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salaryChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                  <Line type="monotone" dataKey="netSalary" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <p>No salary data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card title="Personnel Roster Extract" action={
        <button onClick={() => window.location.href='/employees'} className="px-4 py-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">
          Full Directory →
        </button>
      }>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-white/[0.05]">Serial</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-white/[0.05]">Identity</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-white/[0.05]">Business Unit</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-white/[0.05]">Total Comp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {employees.length > 0 ? (
                employees.slice(0, 5).map((employee, index) => (
                  <tr key={employee.employeeId || employee.employeeNo || `emp-${index}`} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap text-xs font-bold text-slate-500">#{employee.employeeNo || 'N/A'}</td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-white font-bold">{employee.name}</td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-400 font-semibold">{employee.department}</td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-white font-bold">{formatCurrency(employee.fullBasic)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-center text-slate-500">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

