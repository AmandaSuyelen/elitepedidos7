import React, { useState, useEffect } from 'react';
import { useStore2Hours } from '../../hooks/useStore2Hours';
import { Settings, Save, Printer, Store, Phone, MapPin, FileText } from 'lucide-react';

const Store2Settings: React.FC = () => {
  const { storeSettings, updateStoreSettings, loading } = useStore2Hours();
  
  const [formData, setFormData] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    store_cnpj: '',
    printer_paper_width: '80mm',
    printer_font_size: 14,
    printer_auto_adjust: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (storeSettings) {
      setFormData({
        store_name: storeSettings.store_name || 'Elite Açaí',
        store_address: storeSettings.store_address || 'Rua Um, 1614-C - Residencial 1 - Cágado',
        store_phone: storeSettings.store_phone || '(85) 98904-1010',
        store_cnpj: storeSettings.store_cnpj || '38.130.139/0001-22',
        printer_paper_width: storeSettings.printer_paper_width || '80mm',
        printer_font_size: storeSettings.printer_font_size || 14,
        printer_auto_adjust: storeSettings.printer_auto_adjust !== false
      });
    }
  }, [storeSettings]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await updateStoreSettings(formData);
      setSaveMessage('Configurações salvas com sucesso!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setSaveMessage('Erro ao salvar configurações. Tente novamente.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-800">Configurações da Loja 2</h1>
          </div>
          <p className="text-gray-600">Gerencie as configurações da loja e impressora</p>
        </div>

        {/* Store Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Store className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">Informações da Loja</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Loja
              </label>
              <input
                type="text"
                value={formData.store_name}
                onChange={(e) => handleInputChange('store_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Nome da loja"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Telefone
              </label>
              <input
                type="text"
                value={formData.store_phone}
                onChange={(e) => handleInputChange('store_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="(85) 98904-1010"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Endereço
              </label>
              <input
                type="text"
                value={formData.store_address}
                onChange={(e) => handleInputChange('store_address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Endereço completo da loja"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                CNPJ
              </label>
              <input
                type="text"
                value={formData.store_cnpj}
                onChange={(e) => handleInputChange('store_cnpj', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="00.000.000/0001-00"
              />
            </div>
          </div>
        </div>

        {/* Printer Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Printer className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">Configurações da Impressora</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Largura do Papel
              </label>
              <select
                value={formData.printer_paper_width}
                onChange={(e) => handleInputChange('printer_paper_width', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="58mm">58mm (Pequena)</option>
                <option value="80mm">80mm (Padrão)</option>
                <option value="A4">A4 (Grande)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamanho da Fonte
              </label>
              <input
                type="number"
                min="8"
                max="24"
                value={formData.printer_font_size}
                onChange={(e) => handleInputChange('printer_font_size', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.printer_auto_adjust}
                  onChange={(e) => handleInputChange('printer_auto_adjust', e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative w-11 h-6 rounded-full transition-colors ${
                  formData.printer_auto_adjust ? 'bg-purple-600' : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    formData.printer_auto_adjust ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Ajuste Automático
                </span>
              </label>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Ajuste Automático:</strong> Quando ativado, o tamanho da fonte será ajustado automaticamente 
              baseado na largura do papel selecionada para melhor legibilidade.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              {saveMessage && (
                <p className={`text-sm ${
                  saveMessage.includes('sucesso') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {saveMessage}
                </p>
              )}
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                isSaving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Store2Settings;