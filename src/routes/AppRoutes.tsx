import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Auth
import Login from '@/app/auth/Login';
import AdminLogin from '@/app/auth/AdminLogin';
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
    // Redirect to appropriate login based on route
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/employee/attendance'} replace />;
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

// Main App Routes
const AppRoutes: React.FC = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      {/* Public login routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      
      {/* Protected Admin routes - requires authentication */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      
      {/* Protected Employee routes - requires authentication */}
      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route path="/employee/*" element={<EmployeeRoutes />} />
      </Route>
      
      {/* Root route - redirect to employee login */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Navigate to={role === 'admin' ? '/admin/dashboard' : '/employee/attendance'} replace />
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
