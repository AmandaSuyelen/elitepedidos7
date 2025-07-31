import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, User, DollarSign, Package, Search, Calendar, Filter, RefreshCw, AlertCircle } from 'lucide-react';

interface SaleItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price?: number;
  price_per_gram?: number;
  weight_kg?: number;
  subtotal: number;
}

interface Sale {
  id: string;
  sale_number: number;
  operator_name?: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_type: string;
  change_amount: number;
  is_cancelled: boolean;
  cancelled_at?: string;
  cancel_reason?: string;
  created_at: string;
  channel: string;
  items?: SaleItem[];
}

interface SalesHistoryProps {
  storeId: number;
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ storeId }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodName = (method: string): string => {
    const methodNames: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher',
      'misto': 'Pagamento Misto'
    };
    return methodNames[method] || method;
  };

  const getDateRange = () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    switch (dateFilter) {
      case 'today':
        return {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString()
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          start: new Date(yesterday.setHours(0, 0, 0, 0)).toISOString(),
          end: new Date(yesterday.setHours(23, 59, 59, 999)).toISOString()
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        return {
          start: new Date(weekStart.setHours(0, 0, 0, 0)).toISOString(),
          end: endOfDay.toISOString()
        };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(monthStart.getDate() - 30);
        return {
          start: new Date(monthStart.setHours(0, 0, 0, 0)).toISOString(),
          end: endOfDay.toISOString()
        };
      default:
        return {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString()
        };
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabaseConfigured) {
        console.warn('⚠️ Supabase não configurado - usando dados de demonstração');
        
        // Dados de demonstração
        const demoSales: Sale[] = [
          {
            id: 'demo-1',
            sale_number: 1001,
            operator_name: 'Administrador',
            customer_name: 'João Silva',
            customer_phone: '(85) 99999-9999',
            subtotal: 25.90,
            discount_amount: 0,
            total_amount: 25.90,
            payment_type: 'dinheiro',
            change_amount: 4.10,
            is_cancelled: false,
            created_at: new Date().toISOString(),
            channel: storeId === 1 ? 'pdv' : 'loja2',
            items: [
              {
                id: 'item-1',
                product_name: 'Açaí 500ml',
                quantity: 1,
                unit_price: 25.90,
                subtotal: 25.90
              }
            ]
          }
        ];
        
        setSales(demoSales);
        setLoading(false);
        return;
      }

      console.log(`🔄 Carregando histórico de vendas da Loja ${storeId}...`);
      
      const { start, end } = getDateRange();
      const tableName = storeId === 1 ? 'pdv_sales' : 'store2_sales';
      const itemsTableName = storeId === 1 ? 'pdv_sale_items' : 'store2_sale_items';
      
      // Buscar vendas com itens
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          ${itemsTableName}(*)
        `)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Processar dados para formato consistente
      const processedSales = (data || []).map(sale => ({
        id: sale.id,
        sale_number: sale.sale_number,
        operator_name: sale.operator_name,
        customer_name: sale.customer_name,
        customer_phone: sale.customer_phone,
        subtotal: sale.subtotal,
        discount_amount: sale.discount_amount || 0,
        total_amount: sale.total_amount,
        payment_type: sale.payment_type,
        change_amount: sale.change_amount || 0,
        is_cancelled: sale.is_cancelled || false,
        cancelled_at: sale.cancelled_at,
        cancel_reason: sale.cancel_reason,
        created_at: sale.created_at,
        channel: sale.channel || (storeId === 1 ? 'pdv' : 'loja2'),
        items: sale[itemsTableName] || []
      }));

      setSales(processedSales);
      console.log(`✅ ${processedSales.length} vendas carregadas da Loja ${storeId}`);
    } catch (err) {
      console.error(`❌ Erro ao carregar vendas da Loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      sale.sale_number.toString().includes(search) ||
      sale.customer_name?.toLowerCase().includes(search) ||
      sale.customer_phone?.includes(search) ||
      sale.operator_name?.toLowerCase().includes(search)
    );
  });

  const toggleExpand = (saleId: string) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
  };

  useEffect(() => {
    fetchSales();
  }, [dateFilter, storeId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Clock size={24} className="text-orange-600" />
            Histórico de Vendas - Loja {storeId}
          </h2>
          <p className="text-gray-600">Consulte o histórico completo de vendas realizadas</p>
        </div>
        <button
          onClick={fetchSales}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Supabase Configuration Warning */}
      {!supabaseConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800">Modo Demonstração</h3>
              <p className="text-yellow-700 text-sm">
                Supabase não configurado. Mostrando dados de demonstração.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por número da venda, cliente ou operador..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="lg:w-64">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Últimos 30 dias</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Sales List */}
      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando histórico de vendas...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhuma venda encontrada
            </h3>
            <p className="text-gray-500">
              {searchTerm || dateFilter !== 'today' 
                ? 'Tente ajustar os filtros de busca'
                : 'Nenhuma venda foi realizada ainda'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSales.map((sale) => (
              <div key={sale.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-orange-100 rounded-full p-2">
                      <Package size={20} className="text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Venda #{sale.sale_number}
                        {sale.is_cancelled && (
                          <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                            Cancelada
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(sale.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      {formatPrice(sale.total_amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getPaymentMethodName(sale.payment_type)}
                    </p>
                  </div>
                </div>

                {/* Sale Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {sale.operator_name && (
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span>Operador: {sale.operator_name}</span>
                    </div>
                  )}
                  
                  {sale.customer_name && (
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span>Cliente: {sale.customer_name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-gray-400" />
                    <span>Loja {storeId} - {sale.channel === 'pdv' ? 'PDV' : sale.channel === 'loja2' ? 'Loja 2' : sale.channel}</span>
                  </div>
                </div>

                {/* Payment Details */}
                {(sale.change_amount > 0 || sale.discount_amount > 0) && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Subtotal: </span>
                        <span className="font-medium">{formatPrice(sale.subtotal)}</span>
                      </div>
                      {sale.discount_amount > 0 && (
                        <div>
                          <span className="text-gray-600">Desconto: </span>
                          <span className="font-medium text-red-600">-{formatPrice(sale.discount_amount)}</span>
                        </div>
                      )}
                      {sale.change_amount > 0 && (
                        <div>
                          <span className="text-gray-600">Troco: </span>
                          <span className="font-medium">{formatPrice(sale.change_amount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Items */}
                {sale.items && sale.items.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => toggleExpand(sale.id)}
                      className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                    >
                      {expandedSales.has(sale.id) ? 'Ocultar' : 'Ver'} itens ({sale.items.length})
                    </button>
                    
                    {expandedSales.has(sale.id) && (
                      <div className="mt-3 space-y-2">
                        {sale.items.map((item, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-800">{item.product_name}</p>
                                <p className="text-sm text-gray-600">
                                  Qtd: {item.quantity}
                                  {item.weight_kg && ` • Peso: ${item.weight_kg}kg`}
                                  {item.unit_price && ` • Preço: ${formatPrice(item.unit_price)}`}
                                  {item.price_per_gram && ` • Preço/g: ${formatPrice(item.price_per_gram)}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  {formatPrice(item.subtotal)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Cancellation Info */}
                {sale.is_cancelled && sale.cancel_reason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      <strong>Motivo do cancelamento:</strong> {sale.cancel_reason}
                    </p>
                    {sale.cancelled_at && (
                      <p className="text-xs text-red-600 mt-1">
                        Cancelada em: {formatDateTime(sale.cancelled_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredSales.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo do Período</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {filteredSales.filter(s => !s.is_cancelled).length}
              </p>
              <p className="text-gray-600">Vendas Realizadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(filteredSales.filter(s => !s.is_cancelled).reduce((sum, s) => sum + s.total_amount, 0))}
              </p>
              <p className="text-gray-600">Total Vendido</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatPrice(filteredSales.filter(s => !s.is_cancelled).reduce((sum, s) => sum + s.total_amount, 0) / Math.max(1, filteredSales.filter(s => !s.is_cancelled).length))}
              </p>
              <p className="text-gray-600">Ticket Médio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {filteredSales.filter(s => s.is_cancelled).length}
              </p>
              <p className="text-gray-600">Vendas Canceladas</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;