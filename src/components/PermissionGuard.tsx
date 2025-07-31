import React, { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

interface PermissionGuardProps {
  children: ReactNode;
  hasPermission: boolean;
  fallbackPath?: string;
  showMessage?: boolean;
}

/**
 * A component that guards routes based on user permissions
 * 
 * @param children - The content to render if user has permission
 * @param hasPermission - Boolean indicating if user has permission
 * @param fallbackPath - Path to redirect to if user doesn't have permission (defaults to "/")
 * @param showMessage - Whether to show a message instead of redirecting
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  hasPermission,
  fallbackPath = '/acesso-negado',
  showMessage = false
}) => {
  const navigate = useNavigate();
  
  // Always allow access in development mode or if user has permission
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Check if user is admin in multiple ways
  let isAdmin = false;
  try {
    // Check PDV operator
    const storedOperator = localStorage.getItem('pdv_operator');
    if (storedOperator) {
      const operator = JSON.parse(storedOperator);
      isAdmin = operator.code?.toUpperCase() === 'ADMIN' || 
                operator.name?.toUpperCase().includes('ADMIN');
    }
    
    // Check attendance session
    const attendanceSession = localStorage.getItem('attendance_session');
    if (attendanceSession) {
      const session = JSON.parse(attendanceSession);
      isAdmin = isAdmin || session.user?.role === 'admin' || 
                session.user?.username === 'admin';
    }
    
    // Check admin session
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      const session = JSON.parse(adminSession);
      isAdmin = isAdmin || session.isAuthenticated;
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
  }
  
  // Grant full access if user has permission, is admin, or in development
  if (hasPermission || isDevelopment || isAdmin) {
    return <>{children}</>;
  }

  if (showMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta página. Entre em contato com o administrador para obter acesso.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return <Navigate to={fallbackPath} replace />;
};

export default PermissionGuard;