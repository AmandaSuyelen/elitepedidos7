import { useState, useCallback } from 'react';

interface AttendanceSession {
  isAuthenticated: boolean;
  user?: {
    id: string;
    username: string;
    name: string;
    role: 'attendant' | 'admin';
    permissions: {
      can_view_orders: boolean;
      can_update_status: boolean;
      can_chat: boolean;
      can_create_manual_orders: boolean;
      can_print_orders: boolean;
    };
  };
}

export const useAttendance = () => {
  const [session, setSession] = useState<AttendanceSession>(() => {
    // Tentar recuperar sessão do localStorage
    try {
      const savedSession = localStorage.getItem('attendance_session');
      if (savedSession) {
        return JSON.parse(savedSession);
      }
    } catch (error) {
      console.error('Erro ao recuperar sessão:', error);
    }
    return { isAuthenticated: false };
  });

  const login = useCallback((username: string, password: string): boolean => {
    // Load users from localStorage
    const savedUsers = localStorage.getItem('attendance_users');
    let users = [];
    
    if (savedUsers) {
      try {
        users = JSON.parse(savedUsers);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        return false;
      }
    } else {
      // Default admin user if no users exist
      users = [{
        id: '1',
        username: 'admin',
        password: 'elite2024',
        name: 'Administrador',
        role: 'admin',
        isActive: true,
        permissions: {
          can_view_orders: true,
          can_update_status: true,
          can_chat: true,
          can_create_manual_orders: true,
          can_print_orders: true
        }
      }];
      localStorage.setItem('attendance_users', JSON.stringify(users));
    }
    
    // Find user with matching credentials
    const user = users.find(u => u.username === username && u.password === password && u.isActive);
    
    if (user) {
      console.log('Attendance login successful');
      
      // Update last login
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, last_login: new Date().toISOString() } : u
      );
      localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
      
      // Salvar sessão no localStorage para persistir login
      localStorage.setItem('attendance_session', JSON.stringify({
        isAuthenticated: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          permissions: user.permissions
        }
      }));
      
      setSession({
        isAuthenticated: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          permissions: user.permissions
        }
      });
      return true;
    }
    
    console.log('Attendance login failed');
    return false;
  }, []);

  const logout = useCallback(() => {
    console.log('Attendance logout');
    localStorage.removeItem('attendance_session');
    setSession({
      isAuthenticated: false
    });
  }, []);

  return {
    session,
    login,
    logout
  };
};