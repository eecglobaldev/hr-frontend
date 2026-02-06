import { useEffect, useState } from 'react';
import { Building2, UserPlus, Save } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/services/api';
import { BRANCHES } from '@/data/branches';

type BranchManagerRow = {
  id: number;
  username: string;
  branch_location: string;
  created_at: string | null;
};

export default function BranchManagers() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [list, setList] = useState<BranchManagerRow[]>([]);
  const [form, setForm] = useState({
    username: '',
    password: '',
    branch_location: BRANCHES[0]?.name ?? '',
  });

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.branchManagers.getAll();
      const data = res.data?.data ?? [];
      setList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load branch managers');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      if (!form.username.trim()) {
        setError('Username is required');
        setSubmitting(false);
        return;
      }
      if (!form.password || form.password.length < 6) {
        setError('Password must be at least 6 characters');
        setSubmitting(false);
        return;
      }
      if (!form.branch_location.trim()) {
        setError('Branch is required');
        setSubmitting(false);
        return;
      }
      await api.branchManagers.create({
        username: form.username.trim(),
        password: form.password,
        branch_location: form.branch_location.trim(),
      });
      setSuccess('Branch manager created. They can log in at /branch/login.');
      setForm((prev) => ({ ...prev, username: '', password: '' }));
      await fetchList();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to create branch manager');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-2xl shadow-indigo-500/20">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Branch Managers</h1>
          <p className="text-slate-400 font-semibold mt-1">Create accounts for branch portal login. Password is stored hashed (bcrypt).</p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
          <p className="text-green-400 font-bold">{success}</p>
        </div>
      )}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <Card className="p-6 bg-white/[0.03] border-white/10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-indigo-400" /> Add Branch Manager
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <Input
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Login username for branch portal"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Min 6 characters (stored hashed)"
            required
            minLength={6}
          />
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Branch</label>
            <select
              name="branch_location"
              value={form.branch_location}
              onChange={handleChange}
              required
              className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              {BRANCHES.map((b) => (
                <option key={b.identifier || b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">Must match employee branch location (employeedetails.branchlocation).</p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? <LoadingSpinner /> : <Save size={18} />}
            {submitting ? 'Creating...' : 'Create Branch Manager'}
          </button>
        </form>
      </Card>

      <Card className="p-6 bg-white/[0.03] border-white/10">
        <h2 className="text-lg font-bold text-white mb-4">Existing Branch Managers</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Username</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Branch</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Created</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id} className="border-b border-white/5">
                    <td className="py-3 font-semibold text-white">{row.username}</td>
                    <td className="py-3 text-slate-300">{row.branch_location}</td>
                    <td className="py-3 text-slate-400 text-sm">
                      {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && (
              <p className="py-8 text-center text-slate-500 font-semibold">No branch managers yet. Add one above.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
