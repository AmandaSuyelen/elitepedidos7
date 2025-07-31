import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit3, Trash2, Search, Eye, EyeOff, Lock, Save, User } from 'lucide-react';

interface AttendanceUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'attendant' | 'admin';
  isActive: boolean;
  permissions: {
    can_view_orders: boolean;
    can_update_status: boolean;
    can_chat: boolean;
    can_create_manual_orders: boolean;
    can_print_orders: boolean;
  };
  created_at: string;
  last_login?: string;
}

const AttendanceUsersPanel: React.FC = () => {
  const [users, setUsers] = useState<AttendanceUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<AttendanceUser | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load users from localStorage
  useEffect(() => {
    const savedUsers = localStorage.getItem('attendance_users');
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        // Ensure all users have proper permissions structure
        const usersWithPermissions = parsedUsers.map(user => ({
          ...user,
          permissions: user.permissions || {
            can_view_orders: true,
            can_update_status: true,
            can_chat: true,
            can_create_manual_orders: false,
            can_print_orders: true
          }
        }));
        setUsers(usersWithPermissions);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        initializeDefaultUsers();
      }
    } else {
      initializeDefaultUsers();
    }
  }, []);

  const initializeDefaultUsers = () => {
    const defaultUsers: AttendanceUser[] = [
      {
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
        },
        created_at: new Date().toISOString()
      }
    ];
    setUsers(defaultUsers);
    localStorage.setItem('attendance_users', JSON.stringify(defaultUsers));
  };

  // Save users to localStorage
  const saveUsers = (updatedUsers: AttendanceUser[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
  };

  const filteredUsers = searchTerm
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  const handleCreate = () => {
    setEditingUser({
      id: Date.now().toString(),
      username: '',
      password: '',
      name: '',
      role: 'attendant',
      isActive: true,
      permissions: {
        can_view_orders: true,
        can_update_status: true,
        can_chat: true,
        can_create_manual_orders: false,
        can_print_orders: true
      },
      created_at: new Date().toISOString()
    });
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!editingUser) return;

    if (!editingUser.username.trim() || !editingUser.name.trim()) {
      alert('Nome de usuário e nome são obrigatórios');
      return;
    }

    if (isCreating && !editingUser.password.trim()) {
      alert('Senha é obrigatória para novos usuários');
      return;
    }

    // Check if username already exists (for new users or when changing username)
    const existingUser = users.find(u => u.username === editingUser.username && u.id !== editingUser.id);
    if (existingUser) {
      alert('Nome de usuário já existe');
      return;
    }

    setSaving(true);
    
    try {
      if (isCreating) {
        const newUsers = [...users, editingUser];
        saveUsers(newUsers);
      } else {
        const updatedUsers = users.map(u => u.id === editingUser.id ? editingUser : u);
        saveUsers(updatedUsers);
      }
      
      setEditingUser(null);
      setIsCreating(false);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Usuário ${isCreating ? 'criado' : 'atualizado'} com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (id === '1') {
      alert('Não é possível excluir o usuário administrador padrão');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o usuário "${name}"?`)) {
      const updatedUsers = users.filter(u => u.id !== id);
      saveUsers(updatedUsers);
    }
  };

  const handleToggleActive = (user: AttendanceUser) => {
    if (user.id === '1') {
      alert('Não é possível desativar o usuário administrador padrão');
      return;
    }

    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, isActive: !u.isActive } : u
    );
    saveUsers(updatedUsers);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-blue-600" />
            Usuários de Atendimento
          </h2>
          <p className="text-gray-600">Gerencie usuários que acessam o sistema de atendimento</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Usuário
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar usuários..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Usuário</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Função</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Permissões</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Último Acesso</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-800">{user.username}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-700">{user.name}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? 'Administrador' : 'Atendente'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions?.can_view_orders && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Pedidos
                        </span>
                      )}
                      {user.permissions?.can_chat && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Chat
                        </span>
                      )}
                      {user.permissions?.can_print_orders && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          Imprimir
                        </span>
                      )}
                      {user.role === 'admin' && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={user.id === '1'}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        user.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } ${user.id === '1' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {user.isActive ? (
                        <>
                          <Eye size={12} />
                          Ativo
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} />
                          Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-500">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString('pt-BR')
                        : 'Nunca'
                      }
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setIsCreating(false);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar usuário"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={user.id === '1'}
                        className={`p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors ${
                          user.id === '1' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Excluir usuário"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </p>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {isCreating ? 'Novo Usuário' : 'Editar Usuário'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome de Usuário *
                </label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    username: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: operador1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    name: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome completo do usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha {isCreating ? '*' : '(deixe em branco para manter a atual)'}
                </label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={editingUser.password}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      password: e.target.value
                    })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={isCreating ? "Senha" : "Nova senha (opcional)"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Função
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    role: e.target.value as 'attendant' | 'admin'
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="attendant">Atendente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissões
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingUser.permissions?.can_view_orders || false}
                      onChange={(e) => setEditingUser({
                        ...editingUser,
                        permissions: {
                          ...editingUser.permissions || {},
                          can_view_orders: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      Visualizar pedidos
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingUser.permissions?.can_update_status || false}
                      onChange={(e) => setEditingUser({
                        ...editingUser,
                        permissions: {
                          ...editingUser.permissions || {},
                          can_update_status: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      Atualizar status de pedidos
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingUser.permissions?.can_chat || false}
                      onChange={(e) => setEditingUser({
                        ...editingUser,
                        permissions: {
                          ...editingUser.permissions || {},
                          can_chat: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      Conversar com clientes
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingUser.permissions?.can_create_manual_orders || false}
                      onChange={(e) => setEditingUser({
                        ...editingUser,
                        permissions: {
                          ...editingUser.permissions || {},
                          can_create_manual_orders: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      Criar pedidos manuais
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingUser.permissions?.can_print_orders || false}
                      onChange={(e) => setEditingUser({
                        ...editingUser,
                        permissions: {
                          ...editingUser.permissions || {},
                          can_print_orders: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      Imprimir pedidos
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingUser.isActive}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      isActive: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Usuário ativo
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingUser(null);
                  setIsCreating(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editingUser.username.trim() || !editingUser.name.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {isCreating ? 'Criar Usuário' : 'Salvar Alterações'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceUsersPanel;