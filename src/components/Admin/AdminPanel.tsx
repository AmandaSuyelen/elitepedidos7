import React, { useState } from 'react';
import { Package, MapPin, Clock, Users, LogOut, ShoppingBag, Settings } from 'lucide-react';
import ProductsPanel from './ProductsPanel';
import NeighborhoodsPanel from './NeighborhoodsPanel';
import StoreHoursPanel from './StoreHoursPanel';
import UnifiedAttendancePage from '../UnifiedAttendancePage';
import AttendanceUsersPanel from './AttendanceUsersPanel';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'neighborhoods' | 'hours' | 'pdv' | 'users'>('products');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductsPanel />;
      case 'neighborhoods':
        return <NeighborhoodsPanel />;
      case 'hours':
        return <StoreHoursPanel />; 
      case 'pdv':
        return <UnifiedAttendancePage />;
      case 'users':
        return <AttendanceUsersPanel />;
      default:
        return <ProductsPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-full p-2">
                <ShoppingBag size={24} className="text-purple-600" />
              </div>
              <div>
              <h1 className="text-2xl font-bold text-gray-800">Administrativo</h1>
              <p className="text-gray-600">Elite Açaí - Gestão Completa</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package size={20} />
              Produtos
            </button>
            <button
              onClick={() => setActiveTab('neighborhoods')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'neighborhoods'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MapPin size={20} />
              Bairros
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'hours'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock size={20} />
              Horários
            </button>
            <button
              onClick={() => setActiveTab('pdv')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'pdv'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings size={20} />
              PDV
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users size={20} />
              Usuários
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="transition-all duration-300">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;