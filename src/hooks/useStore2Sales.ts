import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Store2Sale {
  id: string;
  sale_number: number;
  operator_id?: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  total_amount: number;
  payment_type: string;
  payment_details?: any;
  change_amount: number;
  notes?: string;
  is_cancelled: boolean;
  cancelled_at?: string;
  cancelled_by?: string;
  cancel_reason?: string;
  created_at: string;
  updated_at: string;
  channel?: string;
  cash_register_id?: string;
}

export interface Store2SaleItem {
  id: string;
  sale_id: string;
  product_id?: string;
  product_code: string;
  product_name: string;
  quantity: number;
  weight_kg?: number;
  unit_price?: number;
  price_per_gram?: number;
  discount_amount: number;
  subtotal: number;
  created_at: string;
}

export interface Store2CartItem {
  product: any;
  quantity: number;
  weight?: number;
  discount: number;
  subtotal: number;
}

export const useStore2Sales = () => {
  const [sales, setSales] = useState<Store2Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSale = useCallback(async (
    saleData: Omit<Store2Sale, 'id' | 'sale_number' | 'created_at' | 'updated_at'>,
    items: Omit<Store2SaleItem, 'id' | 'sale_id' | 'created_at'>[],
    cashRegisterId: string
  ) => {
    try {
      setLoading(true);
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.');
      }
      
      const saleWithCashRegister = {
        ...saleData,
        cash_register_id: cashRegisterId,
        channel: 'loja2'
      };
      
      const { data: sale, error: saleError } = await supabase
        .from('store2_sales')
        .insert([saleWithCashRegister])
        .select()
        .single();

      if (saleError) throw saleError;

      // Criar itens da venda
      const saleItems = items.map(item => ({
        ...item,
        sale_id: sale.id
      }));

      const { error: itemsError } = await supabase
        .from('store2_sale_items')
        .insert(saleItems);

      if (itemsError) {
        // Tentar deletar a venda se falhou criar itens
        await supabase.from('store2_sales').delete().eq('id', sale.id);
        throw itemsError;
      }

      // Adicionar entrada ao caixa
      await supabase
        .from('pdv2_cash_entries')
        .insert([{
          register_id: cashRegisterId,
          type: 'income',
          amount: sale.total_amount,
          description: `Venda #${sale.sale_number}`,
          payment_method: sale.payment_type
        }]);

      setSales(prev => [sale, ...prev]);
      return sale;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar venda');
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSale = useCallback(async (saleId: string, reason: string, operatorId: string) => {
    try {
      const { data, error } = await supabase
        .from('store2_sales')
        .update({
          is_cancelled: true,
          cancelled_at: new Date().toISOString(),
          cancelled_by: operatorId,
          cancel_reason: reason
        })
        .eq('id', saleId)
        .select()
        .single();

      if (error) throw error;
      
      setSales(prev => prev.map(s => s.id === saleId ? data : s));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao cancelar venda');
    }
  }, []);

  const fetchSales = useCallback(async (limit = 50) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('store2_sales')
        .select(`
          *,
          store2_sale_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sales,
    loading,
    error,
    createSale,
    cancelSale,
    fetchSales
  };
};

export const useStore2Cart = () => {
  const [items, setItems] = useState<Store2CartItem[]>([]);
  const [discount, setDiscount] = useState({ type: 'none' as 'none' | 'percentage' | 'amount', value: 0 });
  const [paymentInfo, setPaymentInfo] = useState<{
    method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto';
    changeFor?: number;
    customerName?: string;
    customerPhone?: string;
  }>({
    method: 'dinheiro'
  });

  const addItem = useCallback((product: any, quantity: number = 1, weight?: number) => {
    const existingIndex = items.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      setItems(prev => prev.map((item, index) => {
        if (index === existingIndex) {
          const newQuantity = item.quantity + quantity;
          const newWeight = weight ? (item.weight || 0) + weight : item.weight;
          return {
            ...item,
            quantity: newQuantity,
            weight: newWeight,
            subtotal: calculateItemSubtotal(item.product, newQuantity, newWeight, item.discount)
          };
        }
        return item;
      }));
    } else {
      const newItem: Store2CartItem = {
        product,
        quantity,
        weight,
        discount: 0,
        subtotal: calculateItemSubtotal(product, quantity, weight, 0)
      };
      setItems(prev => [...prev, newItem]);
    }
  }, [items]);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateItemQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          quantity,
          subtotal: calculateItemSubtotal(item.product, quantity, item.weight, item.discount)
        };
      }
      return item;
    }));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount({ type: 'none', value: 0 });
    setPaymentInfo({ method: 'dinheiro' });
  }, []);

  const getSubtotal = useCallback(() => {
    return items.reduce((total, item) => total + item.subtotal, 0);
  }, [items]);

  const getDiscountAmount = useCallback(() => {
    const subtotal = getSubtotal();
    if (discount.type === 'percentage') {
      return subtotal * (discount.value / 100);
    } else if (discount.type === 'amount') {
      return Math.min(discount.value, subtotal);
    }
    return 0;
  }, [getSubtotal, discount]);

  const getTotal = useCallback(() => {
    return Math.max(0, getSubtotal() - getDiscountAmount());
  }, [getSubtotal, getDiscountAmount]);

  const updatePaymentInfo = useCallback((info: Partial<typeof paymentInfo>) => {
    setPaymentInfo(prev => ({ ...prev, ...info }));
  }, []);

  return {
    items,
    discount,
    paymentInfo,
    addItem,
    removeItem,
    updateItemQuantity,
    setDiscount,
    updatePaymentInfo,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    itemCount: items.length,
    totalItems: items.reduce((total, item) => total + item.quantity, 0)
  };
};

// Helper function to calculate item subtotal
const calculateItemSubtotal = (
  product: any, 
  quantity: number, 
  weight?: number, 
  discount: number = 0
): number => {
  let basePrice = 0;
  
  if (product.is_weighable && weight && product.price_per_gram) {
    basePrice = weight * 1000 * product.price_per_gram;
  } else if (!product.is_weighable && product.unit_price) {
    basePrice = quantity * product.unit_price;
  }
  
  return Math.max(0, basePrice - discount);
};