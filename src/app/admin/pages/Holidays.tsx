import { useEffect, useState } from 'react';
import { CalendarDays, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/services/api';
import type { Holiday } from '@/types';

export default function Holidays() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  /** Map API response (PascalCase) to frontend Holiday (camelCase) */
  const mapApiHoliday = (h: Record<string, unknown>): Holiday => ({
    id: (h.HolidayId ?? h.id) as number,
    date: ((h.HolidayDate ?? h.date) ?? '').toString().split('T')[0],
    name: (h.HolidayName ?? h.name) as string,
    description: (h.Description ?? h.description) as string | undefined,
    isActive: (h.IsActive ?? h.isActive ?? true) as boolean,
    createdAt: h.CreatedAt != null ? new Date(h.CreatedAt as string).toISOString() : undefined,
    createdBy: (h.CreatedBy ?? h.createdBy) as string | undefined,
    updatedAt: h.UpdatedAt != null ? new Date(h.UpdatedAt as string).toISOString() : undefined,
    updatedBy: (h.UpdatedBy ?? h.updatedBy) as string | undefined,
  });

  const fetchHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.admin.holidays.getAll(selectedYear);
      const raw = (response.data.data ?? []) as unknown as Record<string, unknown>[];
      setHolidays(Array.isArray(raw) ? raw.map(mapApiHoliday) : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingHoliday(null);
    setFormData({ date: '', name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      date: holiday.date,
      name: holiday.name,
      description: holiday.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      await api.admin.holidays.delete(id);
      await fetchHolidays();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete holiday');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingHoliday) {
        // Update
        await api.admin.holidays.update(editingHoliday.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        });
      } else {
        // Create
        await api.admin.holidays.create({
          date: formData.date,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        });
      }
      setIsModalOpen(false);
      await fetchHolidays();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save holiday');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /** Format YYYY-MM-DD as readable date without timezone shift (treat as calendar date) */
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '—';
    const local = dateStr.split('T')[0].split('-').map(Number);
    if (local.length !== 3 || local.some(Number.isNaN)) return '—';
    const [y, m, d] = local;
    const date = new Date(y, m - 1, d);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Generate year options (current year ± 2 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Holidays</h1>
          <p className="text-slate-400 mt-1">Manage company holidays</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Add Holiday
        </button>
      </div>

      {error && !loading && (
        <ErrorMessage message={error} onRetry={() => { setError(null); fetchHolidays(); }} />
      )}

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Holiday Calendar</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-300">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="px-3 py-2 bg-slate-800/80 border border-white/20 rounded-lg text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 [&>option]:bg-slate-800 [&>option]:text-slate-200"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="mx-auto h-12 w-12 text-slate-500 mb-4" />
              <p className="text-slate-400">No holidays found for {selectedYear}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Description</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {holidays.map((holiday) => (
                    <tr key={holiday.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-200 font-medium">
                        {formatDate(holiday.date)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-200">{holiday.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-400">
                        {holiday.description || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(holiday)}
                            className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(holiday.id)}
                            className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Add/Edit Modal - light panel so form text is readable */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date {editingHoliday && <span className="text-slate-500">(cannot be changed)</span>}
                  </label>
                  <Input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingHoliday}
                    className="w-full !bg-white !text-slate-900 !border-slate-300 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Holiday Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., New Year, Independence Day"
                    className="w-full !bg-white !text-slate-900 !border-slate-300 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Optional description"
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors bg-white"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <Save size={16} />
                    {isSubmitting ? 'Saving...' : editingHoliday ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
