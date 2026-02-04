import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Phone, Building, MapPin, Calendar, AlertCircle, CheckCircle, Briefcase, CreditCard, User, Save, Pencil, X } from 'lucide-react';
import { api, getEmployeeProfile, changePassword, updateEmployeeProfile } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/format';

/** Profile data from API (Employees + EmployeeDetails) */
interface ProfileData {
  employeeCode?: string | null;
  employeeId?: number | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  branchLocation?: string | null;
  joiningDate?: string | null;
  exitDate?: string | null;
  shift?: string | null;
  gender?: string | null;
  basicSalary?: number | null;
  monthlyCTC?: number | null;
  annualCTC?: number | null;
  bankAccNo?: string | null;
  ifscCode?: string | null;
  panCardNo?: string | null;
}

const display = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined || v === '') return 'N/A';
  return String(v);
};

const Profile: React.FC = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<ProfileData | null>(authUser as ProfileData | null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success] = useState<string | null>(null); // @ts-ignore - setter unused but variable is displayed
  
  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [shiftLabelByValue, setShiftLabelByValue] = useState<Record<string, string>>({});
  const [bankAccNo, setBankAccNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [panCardNo, setPanCardNo] = useState('');
  const [bankDetailsSaving, setBankDetailsSaving] = useState(false);
  const [bankDetailsError, setBankDetailsError] = useState<string | null>(null);
  const [bankDetailsSuccess, setBankDetailsSuccess] = useState(false);
  const [editingField, setEditingField] = useState<'bankAccNo' | 'ifscCode' | 'panCardNo' | null>(null);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await api.shifts.getAll();
        const shiftsData = response.data?.data || [];
        const parseTime = (timeValue: unknown): string => {
          if (timeValue instanceof Date) return timeValue.toTimeString().slice(0, 5);
          if (typeof timeValue === 'string') return timeValue.slice(0, 5);
          return '';
        };
        const map: Record<string, string> = {};
        shiftsData.forEach((shift: { ShiftName: string; IsSplitShift?: boolean; StartTime?: unknown; EndTime?: unknown; StartTime_1?: unknown; EndTime_1?: unknown; StartTime_2?: unknown; EndTime_2?: unknown; WorkHours?: number }) => {
          let timing = '';
          if (shift.IsSplitShift) {
            const s1 = parseTime(shift.StartTime_1);
            const e1 = parseTime(shift.EndTime_1);
            const s2 = parseTime(shift.StartTime_2);
            const e2 = parseTime(shift.EndTime_2);
            timing = `${s1}–${e1} | ${s2}–${e2}`;
          } else {
            timing = `${parseTime(shift.StartTime)}–${parseTime(shift.EndTime)}`;
          }
          const label = `Shift ${shift.ShiftName} (${timing})${shift.WorkHours != null && shift.WorkHours < 9 ? ' - Part Time' : ''}`;
          map[shift.ShiftName] = label;
        });
        setShiftLabelByValue(map);
      } catch {
        // ignore; shift will show name only
      }
    };
    fetchShifts();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const response = await getEmployeeProfile();
        setUser((response.data?.data || null) as ProfileData | null);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };

    if (authUser) {
      fetchProfile();
    }
  }, [authUser]);

  useEffect(() => {
    if (user) {
      setBankAccNo(user.bankAccNo ?? '');
      setIfscCode(user.ifscCode ?? '');
      setPanCardNo(user.panCardNo ?? '');
    }
  }, [user]);

  const handleSaveBankDetails = async (field: 'bankAccNo' | 'ifscCode' | 'panCardNo') => {
    setBankDetailsError(null);
    setBankDetailsSuccess(false);
    try {
      setBankDetailsSaving(true);
      await updateEmployeeProfile({
        bankAccNo: field === 'bankAccNo' ? (bankAccNo || null) : (user?.bankAccNo ?? null),
        ifscCode: field === 'ifscCode' ? (ifscCode || null) : (user?.ifscCode ?? null),
        panCardNo: field === 'panCardNo' ? (panCardNo || null) : (user?.panCardNo ?? null),
      });
      setUser(prev => prev ? { ...prev, bankAccNo: bankAccNo || null, ifscCode: ifscCode || null, panCardNo: panCardNo || null } : null);
      setBankDetailsSuccess(true);
      setTimeout(() => setBankDetailsSuccess(false), 3000);
      setEditingField(null);
    } catch (err) {
      setBankDetailsError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setBankDetailsSaving(false);
    }
  };

  const handleCancelEdit = (field: 'bankAccNo' | 'ifscCode' | 'panCardNo') => {
    if (field === 'bankAccNo') setBankAccNo(user?.bankAccNo ?? '');
    if (field === 'ifscCode') setIfscCode(user?.ifscCode ?? '');
    if (field === 'panCardNo') setPanCardNo(user?.panCardNo ?? '');
    setEditingField(null);
    setBankDetailsError(null);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      console.error('Password change failed:', err);
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Loading profile...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-64 bg-gray-100 rounded-lg"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        {/* <p className="text-gray-600">View your personal information and manage account security.</p> */}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="text-rose-600" size={20} />
          <p className="text-sm text-rose-700 font-semibold">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
          <CheckCircle className="text-green-600" size={20} />
          <p className="text-sm text-green-700 font-semibold">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4 border-4 border-white shadow-sm">
                <span className="text-3xl font-bold">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'E'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user?.name || 'Employee'}</h2>
              <p className="text-sm text-blue-600 font-medium">{user?.designation || 'Employee'}</p>
              <div className="mt-2 text-xs font-semibold text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full">
                {user?.employeeCode || 'N/A'}
              </div>
            </div>

            <div className="mt-8 space-y-4 border-t border-gray-100 pt-6">
               <InfoRow icon={<Phone size={16} />} label="Phone Number" value={display(user?.phone)} />
               <InfoRow icon={<Building size={16} />} label="Department" value={display(user?.department)} />
               <InfoRow icon={<User size={16} />} label="Gender" value={display(user?.gender)} />
            </div>
          </Card>

          <Card className="mt-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-indigo-500" />
              Work information
            </h3>
            <div className="space-y-4">
              <InfoRow icon={<Building size={16} />} label="Designation" value={display(user?.designation)} />
              <InfoRow icon={<MapPin size={16} />} label="Branch / Location" value={display(user?.branchLocation)} />
              <InfoRow icon={<Calendar size={16} />} label="Joining Date" value={user?.joiningDate ? formatDate(user.joiningDate) : 'N/A'} />
              {/* <InfoRow icon={<Calendar size={16} />} label="Exit Date" value={user?.exitDate ? formatDate(user.exitDate) : 'N/A'} /> */}
              <InfoRow icon={<Briefcase size={16} />} label="Shift" value={user?.shift ? (shiftLabelByValue[user.shift] ?? user.shift) : 'N/A'} />
            </div>
          </Card>
        </div>

        {/* Compensation & Bank Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-indigo-500" />
              Compensation & bank details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoRow icon={<CreditCard size={16} />} label="Basic salary" value={user?.basicSalary != null ? formatCurrency(user.basicSalary) : 'N/A'} />
              {/* <InfoRow icon={<CreditCard size={16} />} label="Monthly CTC" value={user?.monthlyCTC != null ? formatCurrency(user.monthlyCTC) : 'N/A'} /> */}
              {/* <InfoRow icon={<CreditCard size={16} />} label="Annual CTC" value={user?.annualCTC != null ? formatCurrency(user.annualCTC) : 'N/A'} /> */}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Bank & tax details</p>
              {bankDetailsError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                  <AlertCircle size={18} className="text-rose-600 shrink-0" />
                  <p className="text-sm text-rose-700 font-semibold">{bankDetailsError}</p>
                </div>
              )}
              {bankDetailsSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-600 shrink-0" />
                  <p className="text-sm text-green-700 font-semibold">Saved successfully.</p>
                </div>
              )}

              {/* Bank account no. */}
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Bank account no.</p>
                {editingField === 'bankAccNo' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={bankAccNo}
                      onChange={(e) => setBankAccNo(e.target.value)}
                      placeholder="e.g. 1234567890"
                      className="!bg-white !border-gray-200 !text-gray-900 placeholder:!text-gray-400 flex-1 min-w-[180px]"
                    />
                    <Button type="button" size="sm" onClick={() => handleSaveBankDetails('bankAccNo')} disabled={bankDetailsSaving} className="flex items-center gap-1.5">
                      {bankDetailsSaving ? <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                      Save
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleCancelEdit('bankAccNo')} disabled={bankDetailsSaving} className="flex items-center gap-1.5">
                      <X size={14} /> Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800 font-medium">{display(user?.bankAccNo)}</span>
                    <button type="button" onClick={() => setEditingField('bankAccNo')} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* IFSC code */}
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">IFSC code</p>
                {editingField === 'ifscCode' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      placeholder="e.g. SBIN0001234"
                      className="!bg-white !border-gray-200 !text-gray-900 placeholder:!text-gray-400 flex-1 min-w-[180px]"
                    />
                    <Button type="button" size="sm" onClick={() => handleSaveBankDetails('ifscCode')} disabled={bankDetailsSaving} className="flex items-center gap-1.5">
                      {bankDetailsSaving ? <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                      Save
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleCancelEdit('ifscCode')} disabled={bankDetailsSaving} className="flex items-center gap-1.5">
                      <X size={14} /> Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800 font-medium">{display(user?.ifscCode)}</span>
                    <button type="button" onClick={() => setEditingField('ifscCode')} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* PAN card no. */}
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">PAN card no.</p>
                {editingField === 'panCardNo' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={panCardNo}
                      onChange={(e) => setPanCardNo(e.target.value)}
                      placeholder="e.g. ABCDE1234F"
                      className="!bg-white !border-gray-200 !text-gray-900 placeholder:!text-gray-400 flex-1 min-w-[180px]"
                    />
                    <Button type="button" size="sm" onClick={() => handleSaveBankDetails('panCardNo')} disabled={bankDetailsSaving} className="flex items-center gap-1.5">
                      {bankDetailsSaving ? <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                      Save
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleCancelEdit('panCardNo')} disabled={bankDetailsSaving} className="flex items-center gap-1.5">
                      <X size={14} /> Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800 font-medium">{display(user?.panCardNo)}</span>
                    <button type="button" onClick={() => setEditingField('panCardNo')} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* <Card titleClassName="text-blue-600" title="Account Security">
            <div className="flex items-center space-x-4 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-3 bg-white rounded-lg shadow-sm text-blue-600">
                 <Shield size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Change Password</h4>
                <p className="text-sm text-gray-600">Update your account password regularly to keep your information secure.</p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="text-sm text-rose-700 font-semibold">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-semibold">Password updated successfully!</p>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="max-w-md space-y-5">
              <Input 
                label="Current Password" 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input 
                label="New Password" 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input 
                label="Confirm New Password" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <div className="pt-4 flex space-x-3">
                 <Button type="submit" disabled={loading}>
                   {loading ? 'Updating...' : 'Save Password'}
                 </Button>
                 <Button 
                   type="button" 
                   variant="ghost"
                   onClick={() => {
                     setCurrentPassword('');
                     setNewPassword('');
                     setConfirmPassword('');
                     setPasswordError(null);
                     setPasswordSuccess(false);
                   }}
                 >
                   Cancel
                 </Button>
              </div>
            </form>
          </Card> */}

          <div className="p-6 bg-amber-50/80 border border-amber-200 rounded-xl">
             <h4 className="font-bold text-yellow-800 flex items-center mb-2">
                <AlertCircle size={18} className="mr-2" />
                Profile Editing
             </h4>
             <p className="text-sm text-yellow-700">
                To update your basic information (Name, Department, Email, etc.), please contact your HR representative. These fields are managed by the administration.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center space-x-3">
    <div className="text-gray-400">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  </div>
);

export default Profile;
