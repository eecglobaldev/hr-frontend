import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

const NotFound: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  
  const dashboardPath = role === 'admin' ? '/admin/dashboard' : role === 'branch_manager' ? '/branch/dashboard' : '/employee/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-blue-100">404</h1>
        <div className="relative -mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <Button size="lg" onClick={() => navigate(dashboardPath)}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

