
import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { CalendarDays, Plus, Plane, X } from 'lucide-react';

const LeaveManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic will be added later
    console.log('Form submitted:', formData);
    setIsModalOpen(false);
    // Reset form
    setFormData({
      leaveType: '',
      fromDate: '',
      toDate: '',
      reason: ''
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setFormData({
      leaveType: '',
      fromDate: '',
      toDate: '',
      reason: ''
    });
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Time Off Control</h1>
          <p className="text-slate-400 font-semibold tracking-wide">Manage your leave entitlements and requests.</p>
        </div>
        <Button 
          variant="primary" 
          size="lg" 
          className="rounded-3xl"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={20} className="mr-2" /> Submit New Request
        </Button>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/40 animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-white/40 px-8 py-6 flex items-center justify-between rounded-t-[2.5rem]">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Submit Leave Request</h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Close modal"
              >
                <X size={24} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
              {/* Leave Type Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Leave Type <span className="text-rose-500">*</span>
                </label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  required
                  className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="">Select Leave Type</option>
                  <option value="Paid Leave">Paid Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                    From Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleInputChange}
                    required
                    className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                    To Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleInputChange}
                    required
                    min={formData.fromDate}
                    className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Reason Field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Please provide a reason for your leave request..."
                  className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 bg-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleCancel}
                  className="flex-1 rounded-3xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1 rounded-3xl"
                >
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BalanceCard label="Annual Leave" current={14} total={24} color="bg-indigo-600" />
        <BalanceCard label="Medical/Sick" current={8} total={12} color="bg-emerald-500" />
        <BalanceCard label="Casual Leave" current={2} total={4} color="bg-blue-400" />
      </div>

      <Card title="Active & Recent Requests" className="border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Days</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <LeaveRow type="Vacation" dates="Jun 12 - Jun 15, 2024" days={4} status="Approved" />
              <LeaveRow type="Sick Leave" dates="May 20 - May 21, 2024" days={2} status="Approved" />
              <LeaveRow type="Casual" dates="Jul 04, 2024" days={1} status="Pending" />
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const BalanceCard = ({ label, current, total, color }: { label: string, current: number, total: number, color: string }) => (
  <Card className="relative group overflow-hidden border-none shadow-none ring-1 ring-slate-100">
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <Plane size={20} className="text-slate-300" />
      </div>
      <div className="flex items-baseline space-x-2 mb-4">
        <span className="text-4xl font-black text-slate-900">{current}</span>
        <span className="text-slate-400 font-bold">/ {total} Days</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000`} 
          style={{ width: `${(current/total)*100}%` }}
        ></div>
      </div>
    </div>
  </Card>
);

const LeaveRow = ({ type, dates, days, status }: any) => (
  <tr className="hover:bg-indigo-50/20 transition-all">
    <td className="px-8 py-6">
      <div className="flex items-center">
        <div className="p-2 bg-slate-50 rounded-xl mr-3"><CalendarDays size={16} className="text-slate-400" /></div>
        <p className="text-sm font-black text-slate-900">{type}</p>
      </div>
    </td>
    <td className="px-8 py-6 text-sm font-bold text-slate-500">{dates}</td>
    <td className="px-8 py-6 text-sm font-black text-slate-900">{days} Days</td>
    <td className="px-8 py-6">
      <Badge variant={status === 'Approved' ? 'success' : status === 'Pending' ? 'warning' : 'danger'}>
        {status}
      </Badge>
    </td>
    <td className="px-8 py-6">
      <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Details</button>
    </td>
  </tr>
);

export default LeaveManagement;
