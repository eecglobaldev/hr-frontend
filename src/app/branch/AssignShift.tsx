import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/services/api';
import { CalendarClock, Check } from 'lucide-react';

export default function AssignShift() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Array<{ employeeNo: string; name: string }>>([]);
  const [shifts, setShifts] = useState<Array<{ shiftName: string; startTime: string; endTime: string; timing?: string }>>([]);
  const [form, setForm] = useState({
    employeeCode: '',
    shiftName: '',
    fromDate: '',
    toDate: '',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const [empRes, shiftRes] = await Promise.all([
          api.branch.getEmployees(),
          api.branch.getShifts(),
        ]);
        const empData = empRes.data?.data ?? [];
        setEmployees(Array.isArray(empData) ? empData : []);
        const shiftData = shiftRes.data?.data ?? [];
        setShifts(Array.isArray(shiftData) ? shiftData : []);
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const formatShiftLabel = (s: { shiftName: string; startTime?: unknown; endTime?: unknown; timing?: string }) => {
    if (s.timing) return s.timing.replace(/\s*–\s*/g, ' - ');
    const fmt = (t: unknown): string => {
      if (t == null) return '—';
      if (typeof t === 'string') return t.slice(0, 5);
      if (typeof t === 'object' && t !== null && 'getHours' in t) {
        const d = t as Date;
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
      return String(t).slice(0, 5);
    };
    return `${fmt(s.startTime)} - ${fmt(s.endTime)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (!form.employeeCode || !form.shiftName || !form.fromDate || !form.toDate) {
        setError('All fields are required');
        setSaving(false);
        return;
      }
      await api.branch.assignShift({
        employeeCode: form.employeeCode,
        shiftName: form.shiftName,
        fromDate: form.fromDate,
        toDate: form.toDate,
      });
      setSuccess(`Shift assigned successfully.`);
      setForm((prev) => ({ ...prev, fromDate: '', toDate: '' }));
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to assign shift');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-amber-50 rounded-2xl">
          <CalendarClock className="h-8 w-8 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Assign Shift</h1>
          <p className="text-slate-500 text-sm">Assign a shift to an employee in your branch for a date range.</p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-bold flex items-center gap-2">
          <Check size={20} /> {success}
        </div>
      )}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <Card className="p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employee</label>
            <select
              name="employeeCode"
              value={form.employeeCode}
              onChange={handleChange}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700"
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.employeeNo} value={emp.employeeNo}>
                  {emp.name} ({emp.employeeNo})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Shift</label>
            <select
              name="shiftName"
              value={form.shiftName}
              onChange={handleChange}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700"
            >
              <option value="">Select shift</option>
              {shifts.map((s) => (
                <option key={s.shiftName} value={s.shiftName}>
                  {formatShiftLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">From Date</label>
            <input
              type="date"
              name="fromDate"
              value={form.fromDate}
              onChange={handleChange}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">To Date</label>
            <input
              type="date"
              name="toDate"
              value={form.toDate}
              onChange={handleChange}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <LoadingSpinner /> : <Check size={18} />}
            {saving ? 'Assigning...' : 'Assign Shift'}
          </button>
        </form>
      </Card>
    </div>
  );
}
