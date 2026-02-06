import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/services/api';
import ErrorMessage from '@/components/ui/ErrorMessage';

/** Light-theme override so input text is visible in branch portal */
const inputClass =
  '!bg-white !border-slate-200 !text-slate-800 placeholder:!text-slate-400 focus:!ring-indigo-500/20 focus:!border-indigo-400';
const selectClass =
  'w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400';
const labelClass = 'block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1';

interface FormData {
  employeeCode: string;
  joiningDate: string;
  department: string;
  designation: string;
  basicSalary: string;
  monthlyCTC: string;
  annualCTC: string;
  gender: string;
  phoneNumber: string;
  shift: string;
  bankAccNo: string;
  ifscCode: string;
  panCardNo: string;
}

const initialFormData: FormData = {
  employeeCode: '',
  joiningDate: new Date().toISOString().split('T')[0],
  department: '',
  designation: '',
  basicSalary: '',
  monthlyCTC: '',
  annualCTC: '',
  gender: '',
  phoneNumber: '',
  shift: '',
  bankAccNo: '',
  ifscCode: '',
  panCardNo: '',
};

export default function AddEmployee() {
  const navigate = useNavigate();
  const { branchId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [shifts, setShifts] = useState<Array<{ shiftName: string; timing?: string }>>([]);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await api.branch.getShifts();
        const data = res.data?.data ?? [];
        setShifts(Array.isArray(data) ? data : []);
      } catch {
        setShifts([]);
      }
    };
    fetchShifts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (!formData.employeeCode.trim()) {
        setError('Employee Code is required');
        setLoading(false);
        return;
      }
      const basic = parseFloat(formData.basicSalary);
      if (isNaN(basic) || basic < 0) {
        setError('Basic Salary must be a positive number');
        setLoading(false);
        return;
      }
      const requestData = {
        employeeCode: formData.employeeCode.trim(),
        joiningDate: formData.joiningDate || null,
        department: formData.department.trim() || null,
        designation: formData.designation.trim() || null,
        basicSalary: basic,
        monthlyCTC: formData.monthlyCTC ? parseFloat(formData.monthlyCTC) : null,
        annualCTC: formData.annualCTC ? parseFloat(formData.annualCTC) : null,
        gender: formData.gender || null,
        phoneNumber: formData.phoneNumber.trim() || null,
        shift: formData.shift.trim() || null,
        BankAccNo: formData.bankAccNo.trim() || null,
        IFSCCode: formData.ifscCode.trim() || null,
        PANCardNo: formData.panCardNo.trim() || null,
        createdBy: 'Branch Manager',
      };
      await api.branch.addEmployee(requestData);
      setSuccess(true);
      setTimeout(() => navigate('/branch/employees'), 1500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string }; message?: string }; message?: string };
      setError(e?.response?.data?.error || e?.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/branch/employees')}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft size={18} /> Back to Employees
      </button>

      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 rounded-2xl">
          <UserPlus className="h-8 w-8 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Add New Employee</h1>
          {/* <p className="text-slate-500 text-sm mt-0.5">Create employee details for your branch. Employee code must already exist in system.</p> */}
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-bold">
          Employee details created successfully. Redirecting...
        </div>
      )}
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Employee Information</h2>
        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
          {/* Employee Code */}
          <div>
            <label className={labelClass}>Employee Code <span className="text-rose-500">*</span></label>
            <input
              type="text"
              name="employeeCode"
              value={formData.employeeCode}
              onChange={handleChange}
              required
              placeholder="e.g., 1001"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
            {/* <p className="text-xs text-slate-500 mt-1 px-1">Must match existing employee code in Employees table</p> */}
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={selectClass}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g., +91 9876543210"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* HR Information */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4">HR Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Joining Date"
                name="joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={handleChange}
                className={inputClass}
              />
              <div>
                <label className={labelClass}>Branch Location</label>
                <input
                  type="text"
                  readOnly
                  value={branchId ?? '—'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-medium"
                />
                <p className="text-xs text-slate-500 mt-1 px-1">Assigned from your branch</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g., TEACHING"
                className={inputClass}
              />
              <Input
                label="Designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g., TUTOR"
                className={inputClass}
              />
            </div>
          </div>

          {/* Salary Details */}
          {/* <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Salary Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"> */}
              {/* <Input
                label="Basic Salary (Monthly) *"
                name="basicSalary"
                type="number"
                min="0"
                step="0.01"
                value={formData.basicSalary}
                onChange={handleChange}
                required
                placeholder="e.g., 50000"
                className={inputClass}
              /> */}
              {/* <Input
                label="Monthly CTC"
                name="monthlyCTC"
                type="number"
                min="0"
                step="0.01"
                value={formData.monthlyCTC}
                onChange={handleChange}
                placeholder="e.g., 60000"
                className={inputClass}
              />
              <Input
                label="Annual CTC"
                name="annualCTC"
                type="number"
                min="0"
                step="0.01"
                value={formData.annualCTC}
                onChange={handleChange}
                placeholder="e.g., 720000"
                className={inputClass}
              /> */}
            {/* </div>
          </div> */}

          {/* Shift */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Work Schedule</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Shift (optional)</label>
                <select name="shift" value={formData.shift} onChange={handleChange} className={selectClass}>
                  <option value="">—</option>
                  {shifts.map((s) => (
                    <option key={s.shiftName} value={s.shiftName}>
                      {s.timing ? `${s.shiftName} (${s.timing})` : s.shiftName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bank & Tax Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Bank & Tax Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Bank Account No"
                name="bankAccNo"
                value={formData.bankAccNo}
                onChange={handleChange}
                required={true}
                placeholder="e.g., 1234567890"
                className={inputClass}
              />
              <Input
                label="IFSC Code"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
                required={true}
                placeholder="e.g., SBIN0001234"
                className={inputClass}
              />
              <Input
                label="PAN Card No"
                name="panCardNo"
                value={formData.panCardNo}
                onChange={handleChange}
                required={true}
                placeholder="e.g., ABCDE1234F"
                className={inputClass}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner /> : <Save size={18} />}
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => navigate('/branch/employees')}
              className="px-6 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>

      {/* <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-3">Important Notes</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <p>• Employee Code must already exist in the Employees table (contact HR to add the employee first).</p>
          <p>• Basic Salary is required and will be used for salary calculations.</p>
          <p>• Branch is set automatically from your login; you cannot change it.</p>
          <p>• All other fields are optional but recommended for complete records.</p>
          <p>• Salary values should be in INR (Indian Rupees).</p>
        </div>
      </Card> */}
    </div>
  );
}
