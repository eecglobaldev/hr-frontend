import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/services/api';
import { ArrowLeft, Save, Pencil, X, FileUp, Eye, FileCheck, AlertCircle, CheckCircle } from 'lucide-react';

/** All fields from employeedetails (and name from employees) */
type EmployeeData = {
  employeeNo: string;
  name: string;
  joiningDate: string | null;
  exitDate: string | null;
  branchLocation: string | null;
  department: string | null;
  designation: string | null;
  basicSalary: number;
  monthlyCTC: number | null;
  annualCTC: number | null;
  gender: string | null;
  phoneNumber: string | null;
  shift: string | null;
  shiftTiming: string | null;
  bankAccNo: string | null;
  ifscCode: string | null;
  panCardNo: string | null;
  status: string;
};

const inputClass =
  'w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400';

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [formData, setFormData] = useState<Partial<EmployeeData>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [shifts, setShifts] = useState<Array<{ shiftName: string; timing?: string }>>([]);
  const [documentList, setDocumentList] = useState<Array<{ documentType: string; uploadedAt: string }>>([]);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentSuccess, setDocumentSuccess] = useState<string | null>(null);
  const [documentUploading, setDocumentUploading] = useState<string | null>(null);
  const [documentViewing, setDocumentViewing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadType, setPendingUploadType] = useState<string | null>(null);
  const salaryHoldRef = useRef<HTMLDivElement>(null);
  const [salaryHold, setSalaryHold] = useState<{
    Id: number;
    EmployeeCode: string;
    Month: string;
    HoldType: 'MANUAL' | 'AUTO';
    Reason: string | null;
    IsReleased: boolean;
    CreatedAt: string;
    ReleasedAt: string | null;
    ActionBy: string | null;
  } | null>(null);
  const [holdReason, setHoldReason] = useState('');
  const [isSavingHold, setIsSavingHold] = useState(false);
  const [isLoadingHold, setIsLoadingHold] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.branch.getEmployee(id);
        const data = res.data?.data;
        if (data) {
          setEmployee(data);
          setFormData({
            joiningDate: data.joiningDate ?? null,
            exitDate: data.exitDate ?? null,
            department: data.department ?? null,
            designation: data.designation ?? null,
            basicSalary: data.basicSalary ?? 0,
            monthlyCTC: data.monthlyCTC ?? null,
            annualCTC: data.annualCTC ?? null,
            gender: data.gender ?? null,
            phoneNumber: data.phoneNumber ?? null,
            shift: data.shift ?? null,
            shiftTiming: data.shiftTiming ?? null,
            bankAccNo: data.bankAccNo ?? null,
            ifscCode: data.ifscCode ?? null,
            panCardNo: data.panCardNo ?? null,
          });
        } else {
          setError('Employee not found');
        }
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string }; message?: string }; message?: string };
        setError(e?.response?.data?.error || e?.message || 'Failed to load employee');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

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

  const fetchDocumentList = async () => {
    if (!id) return;
    try {
      const res = await api.branch.listEmployeeDocuments(id) as { data?: { data?: Array<{ documentType: string; uploadedAt: string }> } };
      const list = res?.data?.data ?? [];
      setDocumentList(list);
    } catch {
      setDocumentList([]);
    }
  };

  useEffect(() => {
    if (id) fetchDocumentList();
  }, [id]);

  const currentMonth = () => new Date().toISOString().slice(0, 7);

  const loadSalaryHold = async () => {
    if (!id) return;
    try {
      setIsLoadingHold(true);
      const res = await api.branch.getSalaryHold(id, currentMonth());
      if (res.data?.success && res.data?.data) {
        setSalaryHold(res.data.data);
      } else {
        setSalaryHold(null);
      }
    } catch {
      setSalaryHold(null);
    } finally {
      setIsLoadingHold(false);
    }
  };

  useEffect(() => {
    if (id) loadSalaryHold();
  }, [id]);

  const createSalaryHold = async () => {
    if (!id) return;
    setIsSavingHold(true);
    try {
      await api.branch.createSalaryHold(id, { reason: holdReason.trim() || undefined, month: currentMonth() });
      setHoldReason('');
      await loadSalaryHold();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; message?: string }; message?: string };
      setError(e?.response?.data?.message || e?.message || 'Failed to create salary hold');
    } finally {
      setIsSavingHold(false);
    }
  };

  const releaseSalaryHold = async () => {
    if (!id) return;
    if (!salaryHold || salaryHold.IsReleased) return;
    setIsSavingHold(true);
    try {
      await api.branch.releaseSalaryHold(id, { month: currentMonth() });
      await loadSalaryHold();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; message?: string }; message?: string };
      setError(e?.response?.data?.message || e?.message || 'Failed to release salary hold');
    } finally {
      setIsSavingHold(false);
    }
  };

  const hasDocument = (type: string) => documentList.some((d) => d.documentType === type);

  const handleUploadClick = (type: string) => {
    setDocumentError(null);
    setDocumentSuccess(null);
    setPendingUploadType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const type = pendingUploadType;
    setPendingUploadType(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !type || !id) return;
    setDocumentError(null);
    setDocumentSuccess(null);
    setDocumentUploading(type);
    try {
      await api.branch.uploadEmployeeDocument(id, type, file);
      setDocumentSuccess(`${type} uploaded successfully.`);
      setTimeout(() => setDocumentSuccess(null), 4000);
      await fetchDocumentList();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string }; message?: string }; message?: string };
      setDocumentError(e?.response?.data?.error || e?.message || 'Upload failed');
    } finally {
      setDocumentUploading(null);
    }
  };

  const handleViewDocument = async (type: string) => {
    if (!id) return;
    setDocumentError(null);
    setDocumentViewing(type);
    try {
      const res = await api.branch.getEmployeeDocumentViewUrl(id, type);
      const url = res.data?.data?.url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else setDocumentError('Could not open document.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string }; message?: string }; message?: string };
      setDocumentError(e?.response?.data?.error || e?.message || 'Failed to open document');
    } finally {
      setDocumentViewing(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numFields = ['basicSalary', 'monthlyCTC', 'annualCTC'];
    setFormData((prev) => ({
      ...prev,
      [name]:
        numFields.includes(name) && value !== ''
          ? parseFloat(value) || 0
          : value === '' && (name === 'exitDate' || name === 'joiningDate')
            ? null
            : value === ''
              ? null
              : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      await api.branch.updateEmployee(id, {
        joiningDate: formData.joiningDate ?? null,
        exitDate: formData.exitDate ?? null,
        department: formData.department ?? null,
        designation: formData.designation ?? null,
        basicSalary: formData.basicSalary ?? 0,
        monthlyCTC: formData.monthlyCTC ?? null,
        annualCTC: formData.annualCTC ?? null,
        gender: formData.gender ?? null,
        phoneNumber: formData.phoneNumber ?? null,
        shift: formData.shift ?? null,
        BankAccNo: formData.bankAccNo ?? null,
        IFSCCode: formData.ifscCode ?? null,
        PANCardNo: formData.panCardNo ?? null,
        updatedBy: 'Branch Manager',
      });
      setEmployee((prev) => (prev ? { ...prev, ...formData } : null));
      setIsEditing(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string }; message?: string }; message?: string };
      setError(e?.response?.data?.error || e?.message || 'Failed to update');
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
  if (!employee) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/branch/employees')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600">
          <ArrowLeft size={18} /> Back
        </button>
        <ErrorMessage message={error || 'Employee not found'} onRetry={() => navigate('/branch/employees')} />
      </div>
    );
  }

  const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5';
  const valueClass = 'text-slate-800 font-medium';

  const startEditing = () => {
    setFormData({
      joiningDate: employee?.joiningDate ?? null,
      exitDate: employee?.exitDate ?? null,
      department: employee?.department ?? null,
      designation: employee?.designation ?? null,
      basicSalary: employee?.basicSalary ?? 0,
      monthlyCTC: employee?.monthlyCTC ?? null,
      annualCTC: employee?.annualCTC ?? null,
      gender: employee?.gender ?? null,
      phoneNumber: employee?.phoneNumber ?? null,
      shift: employee?.shift ?? null,
      bankAccNo: employee?.bankAccNo ?? null,
      ifscCode: employee?.ifscCode ?? null,
      panCardNo: employee?.panCardNo ?? null,
    });
    setError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
  };

  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—');
  const formatNum = (n: number | null) => (n != null && !Number.isNaN(Number(n)) ? Number(n).toLocaleString('en-IN') : '—');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/branch/employees')}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft size={18} /> Back to Employees
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => salaryHoldRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-700 rounded-xl font-bold text-sm hover:bg-rose-50"
          >
            Salary Hold
          </button>
          {!isEditing ? (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700"
            >
              <Pencil size={16} /> Edit
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900">{employee.name}</h1>
        <p className="text-slate-500 text-sm">
          Code: {employee.employeeNo} · Branch: {employee.branchLocation ?? '—'} · Status: {employee.status}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-bold px-2">
            ×
          </button>
        </div>
      )}

      <Card className="p-6">
        {!isEditing ? (
          /* View mode: read-only */
          <div className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div><label className={labelClass}>Employee Code</label><p className={valueClass}>{employee.employeeNo}</p></div>
              <div><label className={labelClass}>Branch</label><p className={valueClass}>{employee.branchLocation ?? '—'}</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelClass}>Joining Date</label><p className={valueClass}>{formatDate(employee.joiningDate)}</p></div>
              <div><label className={labelClass}>Exit Date</label><p className={valueClass}>{formatDate(employee.exitDate)}</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelClass}>Department</label><p className={valueClass}>{employee.department ?? '—'}</p></div>
              <div><label className={labelClass}>Designation</label><p className={valueClass}>{employee.designation ?? '—'}</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* <div><label className={labelClass}>Basic Salary</label><p className={valueClass}>{formatNum(employee.basicSalary)}</p></div> */}
              {/* <div><label className={labelClass}>Monthly CTC</label><p className={valueClass}>{formatNum(employee.monthlyCTC)}</p></div> */}
              {/* <div><label className={labelClass}>Annual CTC</label><p className={valueClass}>{formatNum(employee.annualCTC)}</p></div> */}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className={labelClass}>Gender</label><p className={valueClass}>{employee.gender ?? '—'}</p></div>
              <div><label className={labelClass}>Phone Number</label><p className={valueClass}>{employee.phoneNumber ?? '—'}</p></div>
              <div><label className={labelClass}>Shift</label><p className={valueClass}>{employee.shift ?? '—'}{employee.shiftTiming ? ` (${employee.shiftTiming})` : ''}</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className={labelClass}>Bank Account No</label><p className={valueClass}>{employee.bankAccNo ?? '—'}</p></div>
              <div><label className={labelClass}>IFSC Code</label><p className={valueClass}>{employee.ifscCode ?? '—'}</p></div>
              <div><label className={labelClass}>PAN Card No</label><p className={valueClass}>{employee.panCardNo ?? '—'}</p></div>
            </div>
          </div>
        ) : (
          /* Edit mode: form */
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <label className={labelClass}>Employee Code</label>
                <p className="text-slate-700 font-semibold">{employee.employeeNo}</p>
              </div>
              <div>
                <label className={labelClass}>Branch (read-only)</label>
                <p className="text-slate-700 font-semibold">{employee.branchLocation ?? '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Joining Date</label>
                <input
                type="date"
                name="joiningDate"
                value={formData.joiningDate ?? ''}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Exit Date (leave empty if active)</label>
              <input
                type="date"
                name="exitDate"
                value={formData.exitDate ?? ''}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* Department & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department ?? ''}
                onChange={handleChange}
                placeholder="Department"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation ?? ''}
                onChange={handleChange}
                placeholder="Designation"
                className={inputClass}
              />
            </div>
          </div>

          {/* Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* <div>
              <label className={labelClass}>Basic Salary</label>
              <input
                type="number"
                name="basicSalary"
                min={0}
                step={1}
                value={formData.basicSalary ?? ''}
                onChange={handleChange}
                className={inputClass}
              />
            </div> */}
            {/* <div>
              <label className={labelClass}>Monthly CTC</label>
              <input
                type="number"
                name="monthlyCTC"
                min={0}
                step={1}
                value={formData.monthlyCTC ?? ''}
                onChange={handleChange}
                className={inputClass}
              /> */}
            {/* </div>
            <div>
              <label className={labelClass}>Annual CTC</label>
              <input
                type="number"
                name="annualCTC"
                min={0}
                step={1}
                value={formData.annualCTC ?? ''}
                onChange={handleChange}
                className={inputClass}
              />
            </div> */}
          </div>

          {/* Gender & Phone & Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Gender</label>
              <select
                name="gender"
                value={formData.gender ?? ''}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">—</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber ?? ''}
                onChange={handleChange}
                placeholder="Phone"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Shift</label>
              <select
                name="shift"
                value={formData.shift ?? ''}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">—</option>
                {shifts.map((s) => (
                  <option key={s.shiftName} value={s.shiftName}>
                    {s.timing ? `${s.shiftName} (${s.timing})` : s.shiftName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bank & PAN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Bank Account No</label>
              <input
                type="text"
                name="bankAccNo"
                value={formData.bankAccNo ?? ''}
                onChange={handleChange}
                placeholder="Bank account"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode ?? ''}
                onChange={handleChange}
                placeholder="IFSC"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>PAN Card No</label>
              <input
                type="text"
                name="panCardNo"
                value={formData.panCardNo ?? ''}
                onChange={handleChange}
                placeholder="e.g. ABCDE1234F"
                className={inputClass}
              />
            </div>
          </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? <LoadingSpinner /> : <Save size={18} />}
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
              >
                <X size={18} /> Cancel
              </button>
            </div>
          </form>
        )}
      </Card>

      {/* Salary Hold (same as admin Salary page) */}
      {employee && (
        <div ref={salaryHoldRef} className="mt-6">
          {isLoadingHold ? (
            <div className="text-center py-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                Loading hold status...
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {salaryHold && !salaryHold.IsReleased ? (
                <div className="p-6 rounded-2xl bg-rose-50 border-2 border-rose-200">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-rose-700 uppercase tracking-widest mb-2">
                        Salary is on hold
                      </span>
                      <span className="text-xs font-bold text-rose-600 mb-1">
                        Hold Type: <span className="text-rose-700">{salaryHold.HoldType}</span>
                        {salaryHold.Reason && (
                          <>
                            <span className="mx-2">|</span>
                            Reason: <span className="text-rose-700">{salaryHold.Reason}</span>
                          </>
                        )}
                      </span>
                      {salaryHold.CreatedAt && (
                        <span className="text-[10px] font-bold text-rose-600/80 mt-1">
                          Held on: {new Date(salaryHold.CreatedAt).toLocaleDateString()} at {new Date(salaryHold.CreatedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={releaseSalaryHold}
                      disabled={isSavingHold}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingHold ? 'Releasing...' : 'Release Hold'}
                    </button>
                  </div>
                  <div className="text-xs text-rose-600/90 bg-rose-100/50 p-3 rounded-lg border border-rose-200/50 mt-4">
                    This employee&apos;s salary is excluded from salary summary until released.
                  </div>
                </div>
              ) : (
                <Card className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-1">
                        Salary Hold
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Manually hold salary for this employee
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="text"
                        value={holdReason}
                        onChange={(e) => setHoldReason(e.target.value)}
                        placeholder="Reason (optional)"
                        className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      />
                      <button
                        type="button"
                        onClick={createSalaryHold}
                        disabled={isSavingHold}
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingHold ? 'Holding...' : 'Hold Salary'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Held salaries are excluded from salary summary and cannot be processed until released. Current month: {currentMonth()}.
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Documents (same as employee Profile) */}
      {employee && (
        <Card className="mt-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <FileUp size={18} className="text-indigo-500" />
            Documents
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Upload Aadhaar (front & back), PAN, Passbook or LOA (JPEG, PNG or PDF, max 5 MB). Branch managers can upload and view documents for employees in their branch.
          </p>
          {documentError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <p className="text-sm text-rose-700 font-semibold">{documentError}</p>
            </div>
          )}
          {documentSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700 font-semibold">{documentSuccess}</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="space-y-4">
            {(['AADHAAR_FRONT', 'AADHAAR_BACK', 'PAN', 'PASSBOOK', 'LOA'] as const).map((docType) => (
              <div key={docType} className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    {docType === 'AADHAAR_FRONT' ? 'Aadhaar (Front)' : docType === 'AADHAAR_BACK' ? 'Aadhaar (Back)' : docType === 'PAN' ? 'PAN Card' : docType === 'PASSBOOK' ? 'Passbook' : 'LOA'}
                  </span>
                  {hasDocument(docType) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      <FileCheck size={12} /> Uploaded
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!!documentUploading}
                    onClick={() => handleUploadClick(docType)}
                    className="flex items-center gap-1.5"
                  >
                    {documentUploading === docType ? (
                      <span className="h-3.5 w-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FileUp size={14} />
                    )}
                    Upload
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={!!documentViewing || !hasDocument(docType)}
                    onClick={() => handleViewDocument(docType)}
                    className="flex items-center gap-1.5"
                  >
                    {documentViewing === docType ? (
                      <span className="h-3.5 w-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Eye size={14} />
                    )}
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
