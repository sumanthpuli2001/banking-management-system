import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleType } from '../../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: RoleType[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slatebank-900 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-bank-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-mono text-bank-200 tracking-wider">
          AUTHENTICATING INSTITUTIONAL SESSION...
        </p>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.some((role) => user.roles.includes(role))) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto mt-20 bg-white rounded-xl shadow-lg border border-red-200">
        <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
        <p className="text-sm text-slatebank-600 mb-4">
          Your active institutional profile ({user.roles.join(', ')}) does not have clearance for this administrative portal.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-bank-800 text-white rounded-lg text-sm hover:bg-bank-700"
        >
          Return to Permitted Console
        </button>
      </div>
    );
  }

  return <Outlet />;
};
