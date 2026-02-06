import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/services/api';
import { Search, UserPlus, User } from 'lucide-react';

type EmployeeRow = {
  employeeNo: string;
  name: string;
  department: string;
  designation: string;
  location: string;
  status: string;
  joinDate: string | null;
};

export default function Employees() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.branch.getEmployees();
        const data = res.data?.data ?? [];
        setEmployees(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string }; message?: string }; message?: string };
        setError(e?.response?.data?.error || e?.message || 'Failed to load employees');
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filtered = searchTerm
    ? employees.filter(
        (e) =>
          e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.employeeNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.department?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : employees;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-black text-slate-900">Employees</h1>
        <Link
          to="/branch/employees/add"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700"
        >
          <UserPlus size={18} /> Add Employee
        </Link>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <Card className="p-4">
        <div className="relative max-w-xs mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <input
            type="text"
            placeholder="Search by name, code, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 font-medium"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">Name</th>
                  <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">Code</th>
                  <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">Designation</th>
                  <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr
                    key={emp.employeeNo}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="py-3 font-bold text-slate-800">{emp.name}</td>
                    <td className="py-3 text-slate-600">{emp.employeeNo}</td>
                    <td className="py-3 text-slate-600">{emp.department}</td>
                    <td className="py-3 text-slate-600">{emp.designation}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          emp.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/branch/employees/${emp.employeeNo}`)}
                        className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        <User size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-8 text-center text-slate-500 font-semibold">No employees found.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
