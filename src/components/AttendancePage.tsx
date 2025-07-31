import React from 'react';
import { useNavigate } from 'react-router-dom';
import AttendanceLogin from './Orders/AttendanceLogin';
import UnifiedAttendancePage from './UnifiedAttendancePage';
import { useAttendance } from '../hooks/useAttendance';

const AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { session, login, logout } = useAttendance();

  // Se o atendente está logado, mostrar painel de atendimento
  if (session.isAuthenticated) {
    return (
      <UnifiedAttendancePage 
        operator={session.user ? {
          id: session.user.id,
          name: session.user.username,
          code: session.user.username.toUpperCase(),
          permissions: {
            can_discount: true,
            can_cancel: true,
            can_manage_products: true,
            can_view_sales: true,
            can_view_cash_register: true,
            can_view_products: true,
            can_view_orders: true,
            can_view_reports: true,
            can_view_sales_report: true,
            can_view_cash_report: true,
            can_view_operators: true
          },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          password_hash: '',
          last_login: null
        } : undefined}
        onLogout={logout}
      />
    );
  }

  // Se não está logado, mostrar tela de login
  return (
    <AttendanceLogin 
      onLogin={(username, password) => {
        const success = login(username, password);
        return success;
      }} 
    />
  );
};

export default AttendancePage;