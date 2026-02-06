import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import { api } from '@/services/api';
import { Users, UserPlus, CalendarClock, ChevronRight, Clock, UserCheck, UserX, AlertCircle } from 'lucide-react';
import type { AttendanceLog } from '@/types';

const DEFAULT_START_MINUTES = 10 * 60; // 10:00 AM

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseLogTime(logDate: Date | string): number {
  const d = typeof logDate === 'string' ? new Date(logDate) : logDate;
  return d.getHours() * 60 + d.getMinutes();
}

function getFirstEntryMinutesLate(logs: AttendanceLog[]): number | null {
  const inLogs = logs.filter(
    (l) => String(l.Direction || '').toUpperCase() === 'IN' || l.Direction === '1'
  );
  if (inLogs.length === 0) return null;
  const sorted = [...inLogs].sort((a, b) => {
    const t1 = typeof a.LogDate === 'string' ? new Date(a.LogDate).getTime() : (a.LogDate as Date).getTime();
    const t2 = typeof b.LogDate === 'string' ? new Date(b.LogDate).getTime() : (b.LogDate as Date).getTime();
    return t1 - t2;
  });
  const first = sorted[0];
  const entryMins = parseLogTime(first.LogDate);
  const late = entryMins - DEFAULT_START_MINUTES;
  return late > 0 ? late : null;
}

interface BranchEmployee {
  employeeNo: string;
  name: string;
  department?: string;
  designation?: string;
  location?: string;
  status?: string;
  joinDate?: string | null;
}

const Dashboard: React.FC = () => {
  const { user, branchId } = useAuth();
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<BranchEmployee[]>([]);
  const [logsToday, setLogsToday] = useState<AttendanceLog[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const today = useMemo(() => getTodayDate(), []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.branch.getEmployees();
        const data = res.data?.data ?? [];
        const list = Array.isArray(data) ? data : [];
        setEmployees(list);
        setEmployeeCount(list.length);
      } catch {
        setEmployeeCount(0);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!today) return;
    const fetchLogs = async () => {
      try {
        const res = await api.attendance.getByDate(today);
        setLogsToday(res.data?.data ?? []);
      } catch {
        setLogsToday([]);
      } finally {
        setAttendanceLoading(false);
      }
    };
    fetchLogs();
  }, [today]);

  const todayStats = useMemo(() => {
    const late10: BranchEmployee[] = [];
    const late30: BranchEmployee[] = [];
    let presentCount = 0;
    const empMap = new Map(employees.map((e) => [e.employeeNo, e]));

    for (const emp of employees) {
      const code = emp.employeeNo;
      const userLogs = logsToday.filter((l) => String(l.UserId ?? (l as any).userid) === String(code));
      if (userLogs.length === 0) continue;
      presentCount += 1;
      const minutesLate = getFirstEntryMinutesLate(userLogs);
      if (minutesLate !== null) {
        if (minutesLate >= 30) late30.push(emp);
        else if (minutesLate >= 10) late10.push(emp);
      }
    }

    const absentCount = employees.length - presentCount;
    return {
      late10,
      late30,
      presentCount,
      absentCount,
    };
  }, [employees, logsToday]);

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-8">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full">
            <span className="text-[10px] font-black uppercase tracking-widest">Branch Portal</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">
            Hello, {user?.name?.split(' ')[0] || 'Manager'}
          </h1>
          <p className="text-slate-500 font-semibold">{branchId || 'Your branch'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Employees</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {loading ? '...' : employeeCount}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <Users size={24} className="text-indigo-600" />
            </div>
          </div>
          <Link
            to="/branch/employees"
            className="mt-4 flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            View list <ChevronRight size={16} />
          </Link>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Add Employee</p>
              <p className="text-sm font-bold text-slate-600 mt-1">Register new</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <UserPlus size={24} className="text-emerald-600" />
            </div>
          </div>
          <Link
            to="/branch/employees/add"
            className="mt-4 flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            Add employee <ChevronRight size={16} />
          </Link>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assign Shift</p>
              <p className="text-sm font-bold text-slate-600 mt-1">Manage shifts</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl">
              <CalendarClock size={24} className="text-amber-600" />
            </div>
          </div>
          <Link
            to="/branch/assign-shift"
            className="mt-4 flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            Assign shift <ChevronRight size={16} />
          </Link>
        </Card>
      </div>

      {/* Today's attendance summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Today&apos;s Attendance</h2>
          <span className="text-sm text-slate-500">{today}</span>
        </div>
        {attendanceLoading || loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 font-semibold text-slate-700">Metric</th>
                  <th className="text-left py-2 font-semibold text-slate-700">Count / List</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-b border-slate-100">
                  <td className="py-3 flex items-center gap-2">
                    <AlertCircle size={18} className="text-amber-500 shrink-0" />
                    <span>10 min late (today)</span>
                  </td>
                  <td className="py-3">
                    {todayStats.late10.length === 0 ? (
                      <span className="text-slate-400">None</span>
                    ) : (
                      <ul className="list-disc list-inside">
                        {todayStats.late10.map((e) => (
                          <li key={e.employeeNo}>
                            #{e.employeeNo} {e.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 flex items-center gap-2">
                    <Clock size={18} className="text-red-500 shrink-0" />
                    <span>30 min late (today)</span>
                  </td>
                  <td className="py-3">
                    {todayStats.late30.length === 0 ? (
                      <span className="text-slate-400">None</span>
                    ) : (
                      <ul className="list-disc list-inside">
                        {todayStats.late30.map((e) => (
                          <li key={e.employeeNo}>
                            #{e.employeeNo} {e.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 flex items-center gap-2">
                    <UserCheck size={18} className="text-emerald-600 shrink-0" />
                    <span>Total present today</span>
                  </td>
                  <td className="py-3 font-semibold">{todayStats.presentCount}</td>
                </tr>
                <tr>
                  <td className="py-3 flex items-center gap-2">
                    <UserX size={18} className="text-slate-500 shrink-0" />
                    <span>Total absent today</span>
                  </td>
                  <td className="py-3 font-semibold">{todayStats.absentCount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
