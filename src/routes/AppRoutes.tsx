import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Auth
import Login from '@/app/auth/Login';
import AdminLogin from '@/app/auth/AdminLogin';
import BranchLogin from '@/app/auth/BranchLogin';
import NotFound from '@/app/shared/NotFound';

// Admin Layout & Pages
import AdminLayout from '@/app/admin/layouts/Layout';
import AdminDashboard from '@/app/admin/pages/Dashboard';
import AdminEmployees from '@/app/admin/pages/Employees';
import AdminEmployeeDetail from '@/app/admin/pages/EmployeeDetail';
import AdminAddEmployee from '@/app/admin/pages/AddEmployee';
import AdminAttendance from '@/app/admin/pages/Attendance';
import AdminSalary from '@/app/admin/pages/Salary';
import AdminSalarySummary from '@/app/admin/pages/SalarySummary';
import AdminHolidays from '@/app/admin/pages/Holidays';
import AdminBranchManagers from '@/app/admin/pages/BranchManagers';

// Employee Layout & Pages
import EmployeeLayout from '@/app/employee/layouts/Layout';
import EmployeeDashboard from '@/app/employee/pages/Dashboard';
import EmployeeAttendance from '@/app/employee/pages/Attendance';
import EmployeeSalaryHistory from '@/app/employee/pages/SalaryHistory';
import EmployeeProfile from '@/app/employee/pages/Profile';
import EmployeeLeaveManagement from '@/app/employee/pages/LeaveManagement';
import EmployeeDocumentCenter from '@/app/employee/pages/DocumentCenter';
import EmployeeTasks from '@/app/employee/pages/Tasks';
import EmployeeHelpdesk from '@/app/employee/pages/Helpdesk';

// Branch Layout & Pages
import BranchLayout from '@/app/branch/layouts/Layout';
import BranchDashboard from '@/app/branch/Dashboard';
import BranchEmployees from '@/app/branch/Employees';
import BranchAddEmployee from '@/app/branch/AddEmployee';
import BranchEmployeeProfile from '@/app/branch/EmployeeProfile';
import BranchAssignShift from '@/app/branch/AssignShift';

// Protected Route Component
const ProtectedRoute: React.FC<{ allowedRoles?: string[] }> = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/admin')) return <Navigate to="/admin/login" replace />;
    if (currentPath.startsWith('/branch')) return <Navigate to="/branch/login" replace />;
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'branch_manager') return <Navigate to="/branch/dashboard" replace />;
    return <Navigate to="/employee/attendance" replace />;
  }

  return <Outlet />;
};

// Admin Routes - Protected with authentication
const AdminRoutes = () => (
  <Routes>
    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="employees/add" element={<AdminAddEmployee />} />
        <Route path="employees/:employeeNo" element={<AdminEmployeeDetail />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="salary" element={<AdminSalary />} />
        <Route path="salary/summary" element={<AdminSalarySummary />} />
        <Route path="holidays" element={<AdminHolidays />} />
        <Route path="branch-managers" element={<AdminBranchManagers />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Route>
  </Routes>
);

// Employee Routes
const EmployeeRoutes = () => (
  <Routes>
    <Route element={<EmployeeLayout />}>
      <Route index element={<Navigate to="/employee/dashboard" replace />} />
      <Route path="dashboard" element={<EmployeeDashboard />} />
      <Route path="attendance" element={<EmployeeAttendance />} />
      <Route path="salary" element={<EmployeeSalaryHistory />} />
      <Route path="profile" element={<EmployeeProfile />} />
      <Route path="leave" element={<EmployeeLeaveManagement />} />
      <Route path="documents" element={<EmployeeDocumentCenter />} />
      <Route path="tasks" element={<EmployeeTasks />} />
      <Route path="helpdesk" element={<EmployeeHelpdesk />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);

// Branch Manager Routes
const BranchRoutes = () => (
  <Routes>
    <Route element={<BranchLayout />}>
      <Route index element={<Navigate to="/branch/dashboard" replace />} />
      <Route path="dashboard" element={<BranchDashboard />} />
      <Route path="employees" element={<BranchEmployees />} />
      <Route path="employees/add" element={<BranchAddEmployee />} />
      <Route path="employees/:id" element={<BranchEmployeeProfile />} />
      <Route path="assign-shift" element={<BranchAssignShift />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);

// Main App Routes
const AppRoutes: React.FC = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      {/* Public login routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/branch/login" element={<BranchLogin />} />
      
      {/* Protected Admin routes */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      
      {/* Protected Employee routes */}
      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route path="/employee/*" element={<EmployeeRoutes />} />
      </Route>
      
      {/* Protected Branch Manager routes */}
      <Route element={<ProtectedRoute allowedRoles={['branch_manager']} />}>
        <Route path="/branch/*" element={<BranchRoutes />} />
      </Route>
      
      {/* Root route */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
            role === 'branch_manager' ? <Navigate to="/branch/dashboard" replace /> :
            <Navigate to="/employee/attendance" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// App Component with Router
const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
