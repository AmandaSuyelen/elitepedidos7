import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGuard from '../PermissionGuard';
import { 
  DollarSign, Calendar, Clock, Printer, Download, 
  ArrowDownCircle, ArrowUpCircle, RefreshCw, 
  ShoppingCart, Truck, Filter, Search, PieChart,
  User, CreditCard, FileText, ChevronDown, ChevronUp
} from 'lucide-react';

interface CashSummary {
  date: string;
  pdv_sales: {
    total: number;
    count: number;
    by_payment: Record<string, { total: number; count: number }>;
  };
  delivery_sales: {
    total: number;
    count: number;
    by_payment: Record<string, { total: number; count: number }>;
  };
  manual_income: {
    total: number;
    count: number;
    by_payment: Record<string, { total: number; count: number }>;
  };
  expenses: {
    total: number;
    count: number;
    by_payment: Record<string, { total: number; count: number }>;
  };
  opening_amount: number;
  closing_amount: number | null;
  expected_balance: number;
  difference: number | null;
}

interface CashEntry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  payment_method: string;
  created_at: string;
  source?: 'pdv' | 'delivery' | 'manual';
}

const PDVDailyCashReport: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    pdvSales: true,
    deliverySales: true,
    manualEntries: true,
    expenses: true,
    paymentMethods: true
  });
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDailyReport();
  }, [date]);

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      // Get active cash register for the selected date
      const { data: registerData, error: registerError } = await supabase
        .from('pdv_cash_registers')
        .select('*')
        .gte('opened_at', `${date}T00:00:00`)
        .lte('opened_at', `${date}T23:59:59`)
        .order('opened_at', { ascending: false })
        .limit(1);

      if (registerError) throw registerError;

      if (!registerData || registerData.length === 0) {
        setLoading(false);
        setSummary(null);
        setEntries([]);
        return;
      }

      const register = registerData[0];

      // Get all entries for this register
      const { data: entriesData, error: entriesError } = await supabase
        .from('pdv_cash_entries')
        .select('*')
        .eq('register_id', register.id)
        .order('created_at', { ascending: true });

      if (entriesError) throw entriesError;

      // Process entries to categorize them
      const processedEntries = (entriesData || []).map(entry => {
        let source: 'pdv' | 'delivery' | 'manual' = 'manual';
        
        if (entry.description.includes('Venda #')) {
          source = 'pdv';
        } else if (entry.description.includes('Delivery #')) {
          source = 'delivery';
        }
        
        return {
          ...entry,
          source
        };
      });

      setEntries(processedEntries);

      // Calculate summary
      const pdvSales = processedEntries.filter(e => e.source === 'pdv' && e.type === 'income');
      const deliverySales = processedEntries.filter(e => e.source === 'delivery' && e.type === 'income');
      const manualIncome = processedEntries.filter(e => e.source === 'manual' && e.type === 'income');
      const expenses = processedEntries.filter(e => e.type === 'expense');

      // Calculate totals by payment method
      const calculateByPayment = (entries: CashEntry[]) => {
        const result: Record<string, { total: number; count: number }> = {};
        
        entries.forEach(entry => {
          if (!result[entry.payment_method]) {
            result[entry.payment_method] = { total: 0, count: 0 };
          }
          
          result[entry.payment_method].total += entry.amount;
          result[entry.payment_method].count += 1;
        });
        
        return result;
      };

      // Calculate expected balance (opening + all cash income - expenses)
      const cashIncome = processedEntries.filter(
        e => e.type === 'income' && e.payment_method === 'dinheiro'
      ).reduce((sum, e) => sum + e.amount, 0);
      
      const cashExpenses = expenses.filter(
        e => e.payment_method === 'dinheiro'
      ).reduce((sum, e) => sum + e.amount, 0);
      
      const expectedBalance = register.opening_amount + cashIncome - cashExpenses;

      const summaryData: CashSummary = {
        date,
        pdv_sales: {
          total: pdvSales.reduce((sum, e) => sum + e.amount, 0),
          count: pdvSales.length,
          by_payment: calculateByPayment(pdvSales)
        },
        delivery_sales: {
          total: deliverySales.reduce((sum, e) => sum + e.amount, 0),
          count: deliverySales.length,
          by_payment: calculateByPayment(deliverySales)
        },
        manual_income: {
          total: manualIncome.reduce((sum, e) => sum + e.amount, 0),
          count: manualIncome.length,
          by_payment: calculateByPayment(manualIncome)
        },
        expenses: {
          total: expenses.reduce((sum, e) => sum + e.amount, 0),
          count: expenses.length,
          by_payment: calculateByPayment(expenses)
        },
        opening_amount: register.opening_amount,
        closing_amount: register.closing_amount,
        expected_balance: expectedBalance,
        difference: register.closing_amount !== null 
          ? register.closing_amount - expectedBalance 
          : null
      };

      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching daily report:', error);
      alert('Erro ao carregar relatório diário');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  const handlePrintThermal = () => {
    // Create a new window for thermal printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get printer settings
    const savedSettings = localStorage.getItem('pdv_settings');
    let printerSettings = {
      paper_width: '80mm',
      font_size: 2,
      scale: 1,
      margin_left: 0,
      margin_top: 1,
      margin_bottom: 1
    };

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.printer_layout) {
          printerSettings = { ...printerSettings, ...settings.printer_layout };
        }
      } catch (e) {
        console.error('Erro ao carregar configurações de impressora:', e);
      }
    }

    // Generate thermal receipt content
    const thermalContent = generateThermalContent(summary, entries, printerSettings);
    
    printWindow.document.write(thermalContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const generateThermalContent = (summary: CashSummary, entries: CashEntry[], settings: any) => {
    if (!summary) return '';

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(price);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString('pt-BR');
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Caixa Diário - Elite Açaí</title>
        <style>
          @page {
            size: ${settings.paper_width} auto;
            margin: 0;
            padding: 0;
          }
          
          body {
            margin: 0;
            padding: ${settings.margin_top}mm ${settings.margin_left}mm ${settings.margin_bottom}mm;
            background: white;
            font-family: 'Courier New', monospace;
            font-size: ${settings.font_size * 4}px;
            line-height: 1.3;
            color: black;
            transform: scale(${settings.scale});
            transform-origin: top left;
          }
          
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .border-b { border-bottom: 1px solid black; margin: 2mm 0; }
          .border-dashed { border-bottom: 1px dashed black; margin: 2mm 0; }
          .flex { display: flex; justify-content: space-between; }
          .mb-1 { margin-bottom: 1mm; }
          .mb-2 { margin-bottom: 2mm; }
          .small { font-size: ${settings.font_size * 3}px; }
        </style>
      </head>
      <body>
        <div class="center mb-2">
          <div class="bold">ELITE AÇAÍ</div>
          <div class="small">Relatório de Caixa Diário</div>
          <div class="small">Rua Dois, 2130-A - Residencial 1</div>
          <div class="small">Tel: (85) 98904-1010</div>
        </div>
        
        <div class="border-dashed"></div>
        
        <div class="center bold mb-2">
          RELATÓRIO DO DIA ${new Date(date).toLocaleDateString('pt-BR')}
        </div>
        
        <div class="mb-2">
          <div class="bold mb-1">RESUMO FINANCEIRO:</div>
          <div class="flex"><span>Vendas PDV:</span><span>${formatPrice(summary.pdv_sales.total)}</span></div>
          <div class="flex"><span>Vendas Delivery:</span><span>${formatPrice(summary.delivery_sales.total)}</span></div>
          <div class="flex"><span>Entradas Manuais:</span><span>${formatPrice(summary.manual_income.total)}</span></div>
          <div class="flex"><span>Saídas:</span><span>${formatPrice(summary.expenses.total)}</span></div>
          <div class="border-b"></div>
          <div class="flex bold"><span>SALDO FINAL:</span><span>${formatPrice(summary.expected_balance)}</span></div>
        </div>
        
        <div class="border-dashed"></div>
        
        <div class="mb-2">
          <div class="bold mb-1">CONTADORES:</div>
          <div class="flex"><span>Vendas PDV:</span><span>${summary.pdv_sales.count}</span></div>
          <div class="flex"><span>Vendas Delivery:</span><span>${summary.delivery_sales.count}</span></div>
          <div class="flex"><span>Entradas Manuais:</span><span>${summary.manual_income.count}</span></div>
          <div class="flex"><span>Saídas:</span><span>${summary.expenses.count}</span></div>
        </div>
        
        ${entries.length > 0 ? `
        <div class="border-dashed"></div>
        
        <div class="mb-2">
          <div class="bold mb-1">MOVIMENTAÇÕES:</div>
          ${entries.slice(0, 20).map((entry, index) => `
            <div class="mb-1 small">
              <div>${index + 1}. ${entry.type === 'income' ? 'ENT' : 'SAI'} - ${formatDate(entry.created_at).split(' ')[1]}</div>
              <div>${entry.description}</div>
              <div class="flex">
                <span>${getPaymentMethodLabel(entry.payment_method)}</span>
                <span>${entry.type === 'income' ? '+' : '-'}${formatPrice(entry.amount)}</span>
              </div>
            </div>
          `).join('')}
          ${entries.length > 20 ? `<div class="small center">... e mais ${entries.length - 20} movimentações</div>` : ''}
        </div>
        ` : ''}
        
        <div class="border-dashed"></div>
        
        <div class="center small">
          <div>Relatório gerado em:</div>
          <div>${new Date().toLocaleString('pt-BR')}</div>
          <div class="mt-2">Elite Açaí - Sistema PDV</div>
          <div>CNPJ: 00.000.000/0001-00</div>
          <div>Este é um relatório interno</div>
        </div>
      </body>
      </html>
    `;
  };

  const handleExport = () => {
    if (!summary) return;

    // Create CSV content
    const headers = ['Data/Hora', 'Tipo', 'Canal', 'Descrição', 'Forma Pgto', 'Valor'];
    const rows = entries
      .filter(filterEntries)
      .map(entry => [
        new Date(entry.created_at).toLocaleString('pt-BR'),
        entry.type === 'income' ? 'Entrada' : 'Saída',
        entry.source || '-',
        entry.description,
        getPaymentMethodLabel(entry.payment_method),
        formatPrice(entry.type === 'income' ? entry.amount : -entry.amount)
      ]);
    
    const summaryRows = [
      ['', '', '', '', '', ''],
      ['RESUMO DO CAIXA', '', '', '', '', ''],
      ['Tipo', '', '', '', '', 'Valor'],
      ['Vendas PDV', '', '', '', '', formatPrice(summary.pdv_sales.total)],
      ['Vendas Delivery', '', '', '', '', formatPrice(summary.delivery_sales.total)],
      ['Entradas manuais', '', '', '', '', formatPrice(summary.manual_income.total)],
      ['Saídas', '', '', '', '', formatPrice(summary.expenses.total)],
      ['Saldo final', '', '', '', '', formatPrice(summary.expected_balance)]
    ];
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      ...summaryRows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-caixa-${date}.csv`;
    link.click();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher',
      'misto': 'Pagamento Misto'
    };
    return labels[method] || method;
  };

  const getEntryTypeIcon = (type: string) => {
    return type === 'income' ? 
      <ArrowDownCircle size={16} className="text-green-500" /> : 
      <ArrowUpCircle size={16} className="text-red-500" />;
  };

  const getEntryTypeLabel = (type: string) => {
    return type === 'income' ? 'Entrada' : 'Saída';
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'pdv':
        return <ShoppingCart size={16} className="text-blue-500" />;
      case 'delivery':
        return <Truck size={16} className="text-purple-500" />;
      default:
        return <DollarSign size={16} className="text-green-500" />;
    }
  };

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case 'pdv':
        return 'PDV';
      case 'delivery':
        return 'Delivery';
      default:
        return 'Manual';
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filterEntries = (entry: CashEntry) => {
    // Filter by type
    if (filterType !== 'all' && entry.type !== filterType) {
      return false;
    }
    
    // Filter by payment method
    if (filterPayment !== 'all' && entry.payment_method !== filterPayment) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !entry.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  };

  const filteredEntries = entries.filter(filterEntries);

  return (
    <PermissionGuard hasPermission={hasPermission('can_view_cash_report') || hasPermission('can_view_cash_register')} showMessage={true}>
      <div className={`space-y-6 ${printMode ? 'print:bg-white print:p-0' : ''}`}>
        {/* Header - Hide in print mode */}
        {!printMode && (
          <div className="flex items-center justify-between print:hidden">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={24} className="text-blue-600" />
                Relatório de Caixa Diário
              </h2>
              <p className="text-gray-600">Resumo completo das movimentações do dia</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Printer size={16} />
                Imprimir
              </button>
              <button
                onClick={handlePrintThermal}
                disabled={!summary}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Printer size={16} />
                Impressão Térmica
              </button>
              <button
                onClick={handleExport}
                disabled={!summary}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Exportar CSV
              </button>
            </div>
          </div>
        )}

      {/* Print Header - Only show in print mode */}
      {printMode && (
        <div className="print-header">
          <h1 className="text-2xl font-bold text-center">Relatório de Caixa Diário - Elite Açaí</h1>
          <p className="text-center text-gray-600">
            Data: {new Date(date).toLocaleDateString('pt-BR')}
          </p>
          <p className="text-center text-gray-500 text-sm">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
          <hr className="my-4" />
        </div>
      )}

      {/* Date Selector - Hide in print mode */}
      {!printMode && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data do Relatório
              </label>
              <div className="relative">
                <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="w-full md:w-auto">
              <button
                onClick={fetchDailyReport}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Carregando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Atualizar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div ref={printRef}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !summary ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhum registro de caixa encontrado
            </h3>
            <p className="text-gray-500">
              Não há registros de caixa para a data selecionada.
            </p>
          </div>
        ) : (
          <>
            {/* Financial Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <DollarSign size={20} className="text-green-600" />
                  Resumo Financeiro do Dia
                </h3>
                <div className="text-sm text-gray-500">
                  {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-100 rounded-full p-2">
                      <ShoppingCart size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800">Vendas PDV</h4>
                      <p className="text-sm text-blue-600">{summary.pdv_sales.count} vendas</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-blue-700 text-right">
                    {formatPrice(summary.pdv_sales.total)}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-purple-100 rounded-full p-2">
                      <Truck size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-800">Vendas Delivery</h4>
                      <p className="text-sm text-purple-600">{summary.delivery_sales.count} vendas</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-purple-700 text-right">
                    {formatPrice(summary.delivery_sales.total)}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-green-100 rounded-full p-2">
                      <ArrowDownCircle size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800">Entradas Manuais</h4>
                      <p className="text-sm text-green-600">{summary.manual_income.count} entradas</p>
                      <p className="text-xs text-green-500 mt-1">Entradas não relacionadas a vendas</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-green-700 text-right">
                    {formatPrice(summary.manual_income.total)}
                  </p>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-red-100 rounded-full p-2">
                      <ArrowUpCircle size={20} className="text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-red-800">Saídas</h4>
                      <p className="text-sm text-red-600">{summary.expenses.count} saídas</p>
                      <p className="text-xs text-red-500 mt-1">Despesas e retiradas</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-red-700 text-right">
                    {formatPrice(summary.expenses.total)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-gray-100 rounded-full p-2">
                      <DollarSign size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Abertura de Caixa</h4>
                      <p className="text-sm text-gray-600">Valor inicial</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-700 text-right">
                    {formatPrice(summary.opening_amount)}
                  </p>
                </div>

                <div className={`rounded-lg p-4 border ${
                  summary.closing_amount === null
                    ? 'bg-yellow-50 border-yellow-100'
                    : summary.difference && summary.difference > 0
                    ? 'bg-green-50 border-green-100'
                    : summary.difference && summary.difference < 0
                    ? 'bg-red-50 border-red-100'
                    : 'bg-blue-50 border-blue-100'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`rounded-full p-2 ${
                      summary.closing_amount === null
                        ? 'bg-yellow-100'
                        : summary.difference && summary.difference > 0
                        ? 'bg-green-100'
                        : summary.difference && summary.difference < 0
                        ? 'bg-red-100'
                        : 'bg-blue-100'
                    }`}>
                      <DollarSign size={20} className={
                        summary.closing_amount === null
                          ? 'text-yellow-600'
                          : summary.difference && summary.difference > 0
                          ? 'text-green-600'
                          : summary.difference && summary.difference < 0
                          ? 'text-red-600'
                          : 'text-blue-600'
                      } />
                    </div>
                    <div>
                      <h4 className={`font-medium ${
                        summary.closing_amount === null
                          ? 'text-yellow-800'
                          : summary.difference && summary.difference > 0
                          ? 'text-green-800'
                          : summary.difference && summary.difference < 0
                          ? 'text-red-800'
                          : 'text-blue-800'
                      }`}>
                        {summary.closing_amount === null ? 'Caixa Aberto' : 'Fechamento de Caixa'}
                      </h4>
                      <p className={`text-sm ${
                        summary.closing_amount === null
                          ? 'text-yellow-600'
                          : summary.difference && summary.difference > 0
                          ? 'text-green-600'
                          : summary.difference && summary.difference < 0
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}>
                        {summary.closing_amount === null 
                          ? 'Saldo esperado' 
                          : summary.difference && summary.difference > 0
                          ? 'Sobra de caixa'
                          : summary.difference && summary.difference < 0
                          ? 'Falta no caixa'
                          : 'Fechamento exato'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className={`text-xl font-bold ${
                      summary.closing_amount === null
                        ? 'text-yellow-700'
                        : summary.difference && summary.difference > 0
                        ? 'text-green-700'
                        : summary.difference && summary.difference < 0
                        ? 'text-red-700'
                        : 'text-blue-700'
                    } text-right`}>
                      {summary.closing_amount === null 
                        ? formatPrice(summary.expected_balance)
                        : formatPrice(summary.closing_amount)}
                    </p>
                    
                    {summary.closing_amount !== null && summary.difference !== null && (
                      <p className={`text-sm font-medium ${
                        summary.difference > 0
                          ? 'text-green-600'
                          : summary.difference < 0
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}>
                        Diferença: {formatPrice(summary.difference)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-2 md:mb-0">
                    <h4 className="text-lg font-semibold text-gray-800">Saldo Final do Caixa</h4>
                    <p className="text-sm text-gray-600">
                      Abertura + Vendas + Entradas - Saídas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {formatPrice(summary.expected_balance)}
                    </p>
                    {summary.closing_amount !== null && (
                      <p className="text-sm text-gray-600">
                        Fechamento: {formatPrice(summary.closing_amount)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4 cursor-pointer" 
                   onClick={() => toggleSection('paymentMethods')}>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <CreditCard size={20} className="text-purple-600" />
                  Resumo por Forma de Pagamento
                </h3>
                {expandedSections.paymentMethods ? 
                  <ChevronUp size={20} className="text-gray-500" /> : 
                  <ChevronDown size={20} className="text-gray-500" />}
              </div>

              {expandedSections.paymentMethods && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Forma de Pagamento</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Vendas PDV</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Vendas Delivery</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Entradas Manuais</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Saídas</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getAllPaymentMethods().map(method => {
                        const pdvTotal = getPaymentMethodTotal(summary.pdv_sales.by_payment, method);
                        const deliveryTotal = getPaymentMethodTotal(summary.delivery_sales.by_payment, method);
                        const manualTotal = getPaymentMethodTotal(summary.manual_income.by_payment, method);
                        const expenseTotal = getPaymentMethodTotal(summary.expenses.by_payment, method);
                        const total = pdvTotal + deliveryTotal + manualTotal - expenseTotal;

                        return (
                          <tr key={method} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <span className="font-medium">{getPaymentMethodLabel(method)}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {pdvTotal > 0 ? (
                                <span className="text-green-600 font-medium">{formatPrice(pdvTotal)}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {deliveryTotal > 0 ? (
                                <span className="text-green-600 font-medium">{formatPrice(deliveryTotal)}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {manualTotal > 0 ? (
                                <span className="text-green-600 font-medium">{formatPrice(manualTotal)}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {expenseTotal > 0 ? (
                                <span className="text-red-600 font-medium">{formatPrice(expenseTotal)}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`font-semibold ${total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPrice(total)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="py-3 px-4">TOTAL</td>
                        <td className="py-3 px-4 text-right text-green-600">
                          {formatPrice(summary.pdv_sales.total)}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600">
                          {formatPrice(summary.delivery_sales.total)}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600">
                          {formatPrice(summary.manual_income.total)}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">
                          {formatPrice(summary.expenses.total)}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600">
                          {formatPrice(summary.pdv_sales.total + summary.delivery_sales.total + 
                                      summary.manual_income.total - summary.expenses.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Detailed Transactions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  Movimentações Detalhadas
                </h3>
                
                {!printMode && (
                  <div className="flex gap-2">
                    <div className="relative">
                      <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                        className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Todos os tipos</option>
                        <option value="income">Apenas entradas</option>
                        <option value="expense">Apenas saídas</option>
                      </select>
                    </div>
                    
                    <div className="relative">
                      <CreditCard size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select
                        value={filterPayment}
                        onChange={(e) => setFilterPayment(e.target.value)}
                        className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Todas as formas</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="pix">PIX</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="voucher">Voucher</option>
                      </select>
                    </div>
                    
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar descrição..."
                        className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Data/Hora</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Canal</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Descrição</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Forma Pgto</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-gray-500">
                          Nenhuma movimentação encontrada com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="text-sm">{formatDate(entry.created_at)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getEntryTypeIcon(entry.type)}
                              <span className={`text-sm font-medium ${
                                entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {getEntryTypeLabel(entry.type)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getSourceIcon(entry.source)}
                              <span className="text-sm">{getSourceLabel(entry.source)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">{entry.description}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">{getPaymentMethodLabel(entry.payment_method)}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-semibold ${
                              entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {entry.type === 'income' ? '+' : '-'}
                              {formatPrice(entry.amount)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chart Section - Hide in print mode */}
            {!printMode && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <PieChart size={20} className="text-indigo-600" />
                    Análise Visual
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sales by Channel */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-3">Vendas por Canal</h4>
                    <div className="flex items-center justify-center h-64">
                      <div className="w-full max-w-xs">
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                PDV
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-blue-600">
                                {formatPrice(summary.pdv_sales.total)}
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                            <div style={{ width: `${(summary.pdv_sales.total / (summary.pdv_sales.total + summary.delivery_sales.total)) * 100}%` }} 
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                          </div>
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                                Delivery
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-purple-600">
                                {formatPrice(summary.delivery_sales.total)}
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                            <div style={{ width: `${(summary.delivery_sales.total / (summary.pdv_sales.total + summary.delivery_sales.total)) * 100}%` }} 
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-3">Formas de Pagamento</h4>
                    <div className="flex items-center justify-center h-64">
                      <div className="w-full max-w-xs">
                        {getAllPaymentMethods().map(method => {
                          const pdvTotal = getPaymentMethodTotal(summary.pdv_sales.by_payment, method);
                          const deliveryTotal = getPaymentMethodTotal(summary.delivery_sales.by_payment, method);
                          const manualTotal = getPaymentMethodTotal(summary.manual_income.by_payment, method);
                          const total = pdvTotal + deliveryTotal + manualTotal;
                          const allTotal = summary.pdv_sales.total + summary.delivery_sales.total + summary.manual_income.total;
                          const percentage = allTotal > 0 ? (total / allTotal) * 100 : 0;

                          if (total <= 0) return null;

                          return (
                            <div key={method} className="relative pt-1 mb-4">
                              <div className="flex mb-2 items-center justify-between">
                                <div>
                                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-600 bg-gray-200">
                                    {getPaymentMethodLabel(method)}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-semibold inline-block text-gray-600">
                                    {formatPrice(total)} ({percentage.toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                                <div style={{ width: `${percentage}%` }} 
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-500"></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: portrait;
            margin: 10mm;
          }
          
          body {
            font-family: Arial, sans-serif;
            color: #000;
            background: #fff;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          
          th {
            background-color: #f2f2f2;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 20px;
          }
          
          .print-header h1 {
            font-size: 24px;
            margin-bottom: 5px;
          }
          
          .print-header p {
            font-size: 14px;
            color: #666;
          }
        }
      `}</style>
    </div>
    </PermissionGuard>
  );

  // Helper function to get all payment methods used
  function getAllPaymentMethods(): string[] {
    if (!summary) return [];
    
    const methods = new Set<string>();
    
    // Add methods from PDV sales
    Object.keys(summary.pdv_sales.by_payment || {}).forEach(method => methods.add(method));
    
    // Add methods from delivery sales
    Object.keys(summary.delivery_sales.by_payment || {}).forEach(method => methods.add(method));
    
    // Add methods from manual income
    Object.keys(summary.manual_income.by_payment || {}).forEach(method => methods.add(method));
    
    // Add methods from expenses
    Object.keys(summary.expenses.by_payment || {}).forEach(method => methods.add(method));
    
    return Array.from(methods);
  }

  // Helper function to get total for a payment method
  function getPaymentMethodTotal(byPayment: Record<string, { total: number; count: number }> | undefined, method: string): number {
    if (!byPayment || !byPayment[method]) return 0;
    return byPayment[method].total;
  }
};

export default PDVDailyCashReport;