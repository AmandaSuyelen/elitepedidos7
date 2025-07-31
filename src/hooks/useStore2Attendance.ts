import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Store2AttendanceSession {
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
      can_view_expected_balance: boolean;
    };
  };
}

export const useStore2Attendance = () => {
  const [session, setSession] = useState<Store2AttendanceSession>(() => {
    // Tentar recuperar sessão do localStorage
    try {
      const savedSession = localStorage.getItem('store2_attendance_session');
      if (savedSession) {
        return JSON.parse(savedSession);
      }
    } catch (error) {
      console.error('Erro ao recuperar sessão da Loja 2:', error);
    }
    return { isAuthenticated: false };
  });

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    console.log('🔐 Tentativa de login na Loja 2:', username);
    
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - usando localStorage para login da Loja 2');
        return loginFromLocalStorage(username, password);
      }

      console.log('🔍 Buscando usuário no banco de dados...');
      
      // Buscar usuário no banco
      const { data: user, error } = await supabase
        .from('store2_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        console.log('❌ Usuário não encontrado no banco:', error?.message);
        return false;
      }

      // Verificar senha (simples comparação - em produção usar hash)
      if (user.password_hash !== password) {
        console.log('❌ Senha incorreta para usuário:', username);
        return false;
      }

      console.log('✅ Login da Loja 2 bem-sucedido para:', user.name);

      // Atualizar último login
      await supabase
        .from('store2_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Salvar sessão no localStorage
      const sessionData = {
        isAuthenticated: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          permissions: user.permissions || {
            can_view_orders: false,
            can_update_status: false,
            can_chat: false,
            can_create_manual_orders: false,
            can_print_orders: true,
            can_view_expected_balance: false
          }
        }
      };
      
      localStorage.setItem('store2_attendance_session', JSON.stringify(sessionData));
      
      setSession({
        isAuthenticated: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          permissions: user.permissions || {
            can_view_orders: false,
            can_update_status: false,
            can_chat: false,
            can_create_manual_orders: false,
            can_print_orders: true,
            can_view_expected_balance: false
          }
        }
      });
      return true;
    } catch (error) {
      console.error('❌ Erro no login da Loja 2:', error);
      // Fallback para localStorage em caso de erro
      return loginFromLocalStorage(username, password);
    }
  }, []);

  const loginFromLocalStorage = (username: string, password: string): boolean => {
    try {
      console.log('🔄 Tentando login via localStorage...');
      
      const savedUsers = localStorage.getItem('store2_users');
      let users = [];
      
      if (savedUsers) {
        users = JSON.parse(savedUsers);
        console.log('👥 Usuários carregados do localStorage:', users.length);
      } else {
        console.log('⚠️ Nenhum usuário encontrado no localStorage, criando usuário padrão');
        users = [{
          id: '1',
          username: 'loja2',
          password: 'elite2024',
          password_hash: 'elite2024',
          name: 'Administrador Loja 2',
          role: 'admin',
          isActive: true,
          is_active: true,
          permissions: {
            can_view_orders: false,
            can_update_status: false,
            can_chat: false,
            can_create_manual_orders: false,
            can_print_orders: true,
            can_view_expected_balance: true
          },
          created_at: new Date().toISOString()
        }];
        localStorage.setItem('store2_users', JSON.stringify(users));
      }
      
      // Verificar credenciais
      const user = users.find(u => 
        u.username === username && 
        (u.password === password || u.password_hash === password) && 
        (u.isActive !== false && u.is_active !== false)
      );
      
      if (user) {
        console.log('✅ Login da Loja 2 bem-sucedido para:', user.name);
        
        // Atualizar último login
        const updatedUsers = users.map(u => 
          u.id === user.id ? { ...u, last_login: new Date().toISOString() } : u
        );
        localStorage.setItem('store2_users', JSON.stringify(updatedUsers));
        
        // Salvar sessão no localStorage
        const sessionData = {
          isAuthenticated: true,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            permissions: user.permissions || {
              can_view_orders: false,
              can_update_status: false,
              can_chat: false,
              can_create_manual_orders: false,
              can_print_orders: true,
              can_view_expected_balance: false
            }
          }
        };
        
        localStorage.setItem('store2_attendance_session', JSON.stringify(sessionData));
        
        setSession({
          isAuthenticated: true,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            permissions: user.permissions || {
              can_view_orders: false,
              can_update_status: false,
              can_chat: false,
              can_create_manual_orders: false,
              can_print_orders: true,
              can_view_expected_balance: false
            }
          }
        });
        return true;
      } else {
        console.log('❌ Login da Loja 2 falhou - credenciais inválidas ou usuário inativo');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no login via localStorage:', error);
      return false;
    }
  };

  const logout = useCallback(() => {
    console.log('🚪 Logout da Loja 2');
    localStorage.removeItem('store2_attendance_session');
    setSession({
      isAuthenticated: false
    });
  }, []);

  const getCurrentUser = useCallback(() => {
    return session.user || null;
  }, [session.user]);

  return {
    session,
    login,
    logout,
    getCurrentUser,
    currentUser: session.user
  };
};