import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { RestaurantTable, TableSale, TableSaleItem, TableCartItem } from '../../types/table-sales';
import { 
  Users, 
  Plus, 
  Minus, 
  Trash2, 
  Save, 
  X, 
  DollarSign, 
  User, 
  Phone, 
  CreditCard, 
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Edit3,
  Calculator,
  Printer,
  RefreshCw
} from 'lucide-react';

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [currentSale, setCurrentSale] = useState<TableSale | null>(null);
  const [cartItems, setCartItems] = useState<TableCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<TableCartItem>>({
    product_code: '',
    product_name: '',
    quantity: 1,
    unit_price: 0,
    subtotal: 0
  });
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    count: 1
  });
  const [paymentInfo, setPaymentInfo] = useState<{
    type: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto';
    changeAmount: number;
  }>({
    type: 'dinheiro',
    changeAmount: 0
  });
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  const { addCashEntry, isOpen: isCashRegisterOpen } = usePDVCashRegister();

  // Check Supabase configuration
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
  }, []);

  const tableName = storeId === 1 ? 'store1_tables' : 'store2_tables';
  const salesTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  const itemsTableName = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabaseConfigured) {
        console.warn(`⚠️ Supabase não configurado - usando dados de demonstração para Loja ${storeId}`);
        
        // Dados de demonstração
        const demoTables: RestaurantTable[] = [
          {
            id: 'demo-table-1',
            number: 1,
            name: `Mesa 1 - Loja ${storeId}`,
            capacity: 4,
            status: 'livre',
            location: 'Área principal',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'demo-table-2',
            number: 2,
            name: `Mesa 2 - Loja ${storeId}`,
            capacity: 2,
            status: 'livre',
            location: 'Área principal',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setTables(demoTables);
        setLoading(false);
        return;
      }

      console.log(`🔄 Carregando mesas da Loja ${storeId}...`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          current_sale:${salesTableName}(*)
        `)
        .eq('is_active', true)
        .order('number');

      if (error) throw error;

      console.log(`✅ ${data?.length || 0} mesas carregadas da Loja ${storeId}`);
      setTables(data || []);
    } catch (err) {
      console.error(`❌ Erro ao carregar mesas da Loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  }, [tableName, salesTableName, storeId, supabaseConfigured]);

  const openTable = async (table: RestaurantTable) => {
    try {
      setSaving(true);
      
      if (!supabaseConfigured) {
        // Modo demonstração
        const demoSale: TableSale = {
          id: `demo-sale-${Date.now()}`,
          table_id: table.id,
          sale_number: Math.floor(Math.random() * 1000) + 1,
          operator_name: operatorName || 'Operador Demo',
          customer_name: customerInfo.name || '',
          customer_count: customerInfo.count,
          subtotal: 0,
          discount_amount: 0,
          total_amount: 0,
          status: 'aberta',
          opened_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setCurrentSale(demoSale);
        setSelectedTable({ ...table, status: 'ocupada', current_sale: demoSale });
        setCartItems([]);
        setSaving(false);
        return;
      }

      console.log(`🍽️ Abrindo mesa ${table.number} da Loja ${storeId}...`);
      
      // Criar nova venda para a mesa
      const { data: sale, error: saleError } = await supabase
        .from(salesTableName)
        .insert([{
          table_id: table.id,
          operator_name: operatorName || 'Operador',
          customer_name: customerInfo.name || '',
          customer_count: customerInfo.count,
          subtotal: 0,
          discount_amount: 0,
          total_amount: 0,
          status: 'aberta',
          opened_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Atualizar status da mesa
      const { error: tableError } = await supabase
        .from(tableName)
        .update({
          status: 'ocupada',
          current_sale_id: sale.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', table.id);

      if (tableError) throw tableError;

      setCurrentSale(sale);
      setSelectedTable({ ...table, status: 'ocupada', current_sale: sale });
      setCartItems([]);
      
      console.log(`✅ Mesa ${table.number} aberta com venda #${sale.sale_number}`);
      
      // Recarregar mesas
      await fetchTables();
    } catch (err) {
      console.error(`❌ Erro ao abrir mesa da Loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao abrir mesa');
    } finally {
      setSaving(false);
    }
  };

  const addItemToCart = () => {
    if (!newItem.product_name || !newItem.product_code || !newItem.quantity || !newItem.unit_price) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const item: TableCartItem = {
      product_code: newItem.product_code,
      product_name: newItem.product_name,
      quantity: newItem.quantity || 1,
      weight: newItem.weight,
      unit_price: newItem.unit_price,
      price_per_gram: newItem.price_per_gram,
      subtotal: calculateItemSubtotal(newItem),
      notes: newItem.notes
    };

    setCartItems(prev => [...prev, item]);
    setNewItem({
      product_code: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      subtotal: 0
    });
    setShowAddItemModal(false);
  };

  const removeItemFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromCart(index);
      return;
    }

    setCartItems(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          quantity,
          subtotal: calculateItemSubtotal({ ...item, quantity })
        };
      }
      return item;
    }));
  };

  const calculateItemSubtotal = (item: Partial<TableCartItem>): number => {
    if (item.weight && item.price_per_gram) {
      return (item.weight * 1000) * item.price_per_gram; // peso em kg * 1000 * preço por grama
    } else if (item.quantity && item.unit_price) {
      return item.quantity * item.unit_price;
    }
    return 0;
  };

  const getCartSubtotal = (): number => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0);
  };

  const getCartTotal = (): number => {
    return getCartSubtotal(); // Por enquanto sem desconto
  };

  const createOrUpdateSale = async () => {
    if (!selectedTable || !currentSale || cartItems.length === 0) {
      throw new Error('Dados insuficientes para criar/atualizar venda');
    }

    try {
      console.log(`💾 Salvando venda da mesa ${selectedTable.number} da Loja ${storeId}...`);
      
      const subtotal = getCartSubtotal();
      const total = getCartTotal();

      // Atualizar venda
      const { error: saleError } = await supabase
        .from(salesTableName)
        .update({
          subtotal,
          total_amount: total,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSale.id);

      if (saleError) throw saleError;

      // Remover itens existentes
      const { error: deleteError } = await supabase
        .from(itemsTableName)
        .delete()
        .eq('sale_id', currentSale.id);

      if (deleteError) throw deleteError;

      // Adicionar novos itens
      const saleItems = cartItems.map(item => ({
        sale_id: currentSale.id,
        product_code: item.product_code,
        product_name: item.product_name,
        quantity: item.quantity,
        weight_kg: item.weight,
        unit_price: item.unit_price,
        price_per_gram: item.price_per_gram,
        discount_amount: 0,
        subtotal: item.subtotal,
        notes: item.notes
      }));

      const { error: itemsError } = await supabase
        .from(itemsTableName)
        .insert(saleItems);

      if (itemsError) throw itemsError;

      console.log(`✅ Venda da mesa ${selectedTable.number} salva com sucesso`);
      
      // Atualizar estado local
      setCurrentSale(prev => prev ? {
        ...prev,
        subtotal,
        total_amount: total,
        updated_at: new Date().toISOString()
      } : null);

    } catch (err) {
      console.error(`❌ Erro ao salvar venda na Loja ${storeId}:`, err);
      throw err;
    }
  };

  const finalizeSale = async () => {
    if (!selectedTable || !currentSale || cartItems.length === 0) {
      alert('Adicione itens antes de finalizar a venda');
      return;
    }

    if (!paymentInfo.type) {
      alert('Selecione a forma de pagamento');
      return;
    }

    try {
      setSaving(true);
      
      // Salvar venda primeiro
      await createOrUpdateSale();
      
      const total = getCartTotal();

      // Fechar venda
      const { error: closeError } = await supabase
        .from(salesTableName)
        .update({
          status: 'fechada',
          payment_type: paymentInfo.type,
          change_amount: paymentInfo.changeAmount,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSale.id);

      if (closeError) throw closeError;

      // Liberar mesa
      const { error: tableError } = await supabase
        .from(tableName)
        .update({
          status: 'livre',
          current_sale_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTable.id);

      if (tableError) throw tableError;

      // Adicionar entrada ao caixa (CORREÇÃO: usar 'income' em vez de 'sale')
      if (isCashRegisterOpen && addCashEntry) {
        try {
          await addCashEntry({
            type: 'income', // CORREÇÃO: Mudado de 'sale' para 'income'
            amount: total,
            description: `Venda Mesa #${selectedTable.number} - Loja ${storeId}`,
            payment_method: paymentInfo.type
          });
          console.log(`✅ Entrada de caixa registrada para mesa ${selectedTable.number}`);
        } catch (cashError) {
          console.error(`⚠️ Erro ao registrar entrada no caixa (não crítico):`, cashError);
          // Não falhar a venda por erro no caixa
        }
      }

      console.log(`✅ Venda da mesa ${selectedTable.number} finalizada com sucesso`);
      
      // Limpar estado
      setSelectedTable(null);
      setCurrentSale(null);
      setCartItems([]);
      setCustomerInfo({ name: '', count: 1 });
      setPaymentInfo({ type: 'dinheiro', changeAmount: 0 });
      
      // Recarregar mesas
      await fetchTables();
      
      // Mostrar mensagem de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3';
      successMessage.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <div>
          <p class="font-semibold">Venda finalizada com sucesso!</p>
          <p class="text-sm opacity-90">Mesa ${selectedTable.number} - Total: ${formatPrice(total)}</p>
        </div>
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 4000);
      
    } catch (err) {
      console.error(`❌ Erro ao finalizar venda na Loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao finalizar venda');
    } finally {
      setSaving(false);
    }
  };

  const cancelSale = async () => {
    if (!selectedTable || !currentSale) return;

    if (!confirm('Tem certeza que deseja cancelar esta venda?')) return;

    try {
      setSaving(true);

      // Cancelar venda
      const { error: cancelError } = await supabase
        .from(salesTableName)
        .update({
          status: 'cancelada',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSale.id);

      if (cancelError) throw cancelError;

      // Liberar mesa
      const { error: tableError } = await supabase
        .from(tableName)
        .update({
          status: 'livre',
          current_sale_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTable.id);

      if (tableError) throw tableError;

      console.log(`✅ Venda da mesa ${selectedTable.number} cancelada`);
      
      // Limpar estado
      setSelectedTable(null);
      setCurrentSale(null);
      setCartItems([]);
      setCustomerInfo({ name: '', count: 1 });
      
      // Recarregar mesas
      await fetchTables();
    } catch (err) {
      console.error(`❌ Erro ao cancelar venda da Loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao cancelar venda');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-green-100 text-green-800';
      case 'ocupada': return 'bg-red-100 text-red-800';
      case 'aguardando_conta': return 'bg-yellow-100 text-yellow-800';
      case 'limpeza': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'livre': return 'Livre';
      case 'ocupada': return 'Ocupada';
      case 'aguardando_conta': return 'Aguardando Conta';
      case 'limpeza': return 'Limpeza';
      default: return status;
    }
  };

  const filteredTables = searchTerm
    ? tables.filter(table => 
        table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.number.toString().includes(searchTerm)
      )
    : tables;

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando mesas da Loja {storeId}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Supabase Configuration Warning */}
      {!supabaseConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800">Modo Demonstração - Loja {storeId}</h3>
              <p className="text-yellow-700 text-sm">
                Supabase não configurado. Funcionalidades limitadas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cash Register Warning */}
      {supabaseConfigured && !isCashRegisterOpen && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800">Caixa Fechado - Loja {storeId}</h3>
              <p className="text-yellow-700 text-sm">
                Vendas de mesa não serão registradas no caixa sem um caixa aberto.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            Vendas de Mesa - Loja {storeId}
          </h2>
          <p className="text-gray-600">Gerencie vendas presenciais por mesa</p>
        </div>
        <button
          onClick={fetchTables}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar mesas..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTables.map((table) => (
          <div
            key={table.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all duration-200 hover:shadow-md ${
              selectedTable?.id === table.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Mesa {table.number}</h3>
                <p className="text-sm text-gray-600">{table.name}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
                {getStatusLabel(table.status)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={16} />
                <span>Capacidade: {table.capacity} pessoas</span>
              </div>
              {table.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package size={16} />
                  <span>{table.location}</span>
                </div>
              )}
              {table.current_sale && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} />
                  <span>Venda #{table.current_sale.sale_number}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {table.status === 'livre' ? (
                <button
                  onClick={() => {
                    setSelectedTable(table);
                    setCustomerInfo({ name: '', count: 1 });
                    // Mostrar modal para informações do cliente
                    const customerName = prompt('Nome do cliente (opcional):') || '';
                    const customerCount = parseInt(prompt('Número de pessoas:') || '1') || 1;
                    setCustomerInfo({ name: customerName, count: customerCount });
                    openTable(table);
                  }}
                  disabled={saving}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Abrir Mesa
                </button>
              ) : table.status === 'ocupada' ? (
                <button
                  onClick={() => {
                    setSelectedTable(table);
                    setCurrentSale(table.current_sale || null);
                    // Carregar itens da venda se existir
                    if (table.current_sale) {
                      // Aqui você carregaria os itens da venda do banco
                      setCartItems([]);
                    }
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Gerenciar Venda
                </button>
              ) : (
                <button
                  onClick={() => {
                    // Liberar mesa para limpeza ou outros status
                    // Implementar conforme necessário
                  }}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Liberar Mesa
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTables.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Nenhuma mesa encontrada
          </h3>
          <p className="text-gray-500">
            {searchTerm ? 'Tente ajustar o termo de busca' : `Nenhuma mesa cadastrada para a Loja ${storeId}`}
          </p>
        </div>
      )}

      {/* Sale Management Modal */}
      {selectedTable && currentSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Mesa {selectedTable.number} - Venda #{currentSale.sale_number}
                  </h2>
                  <p className="text-gray-600">Loja {storeId} - {selectedTable.name}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedTable(null);
                    setCurrentSale(null);
                    setCartItems([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Items Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Itens da Venda</h3>
                    <button
                      onClick={() => setShowAddItemModal(true)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Adicionar Item
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package size={32} className="mx-auto text-gray-300 mb-2" />
                        <p>Nenhum item adicionado</p>
                      </div>
                    ) : (
                      cartItems.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                              <p className="text-sm text-gray-600">Código: {item.product_code}</p>
                              {item.weight && (
                                <p className="text-sm text-gray-600">Peso: {(item.weight * 1000).toFixed(0)}g</p>
                              )}
                              {item.notes && (
                                <p className="text-sm text-gray-500 italic">Obs: {item.notes}</p>
                              )}
                            </div>
                            <button
                              onClick={() => removeItemFromCart(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                className="bg-gray-200 hover:bg-gray-300 rounded-full p-1"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="font-medium w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                className="bg-gray-200 hover:bg-gray-300 rounded-full p-1"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">
                                {formatPrice(item.subtotal)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.weight ? 
                                  `${formatPrice(item.price_per_gram || 0)}/g` : 
                                  `${formatPrice(item.unit_price || 0)} un.`
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Total */}
                  {cartItems.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total:</span>
                        <span className="text-green-600">{formatPrice(getCartTotal())}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Informações da Venda</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cliente
                      </label>
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Nome do cliente (opcional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Pessoas
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={customerInfo.count}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Forma de Pagamento
                      </label>
                      <select
                        value={paymentInfo.type}
                        onChange={(e) => setPaymentInfo(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="dinheiro">Dinheiro</option>
                        <option value="pix">PIX</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="voucher">Voucher</option>
                        <option value="misto">Misto</option>
                      </select>
                    </div>

                    {paymentInfo.type === 'dinheiro' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Troco para:
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={paymentInfo.changeAmount}
                          onChange={(e) => setPaymentInfo(prev => ({ ...prev, changeAmount: parseFloat(e.target.value) || 0 }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Valor para troco"
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <button
                      onClick={finalizeSale}
                      disabled={saving || cartItems.length === 0}
                      className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Finalizando...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Finalizar Venda
                        </>
                      )}
                    </button>

                    <button
                      onClick={cancelSale}
                      disabled={saving}
                      className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Cancelar Venda
                    </button>

                    <button
                      onClick={async () => {
                        if (cartItems.length > 0) {
                          await createOrUpdateSale();
                        }
                      }}
                      disabled={saving || cartItems.length === 0}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      Salvar Rascunho
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Adicionar Item</h2>
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código do Produto *
                </label>
                <input
                  type="text"
                  value={newItem.product_code || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, product_code: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: ACAI500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={newItem.product_name || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, product_name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Açaí 500ml"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity || 1}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço Unitário *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.unit_price || 0}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={newItem.notes || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                  placeholder="Observações sobre o item..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={addItemToCart}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;