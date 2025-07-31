import React, { useState } from 'react';
import { Plus, Search, Package, Scale, ShoppingCart, Trash2, Minus } from 'lucide-react';
import { useStore2Products } from '../../hooks/useStore2Products';
import { useStore2Sales, useStore2Cart } from '../../hooks/useStore2Sales';
import { useStore2PDVCashRegister } from '../../hooks/useStore2PDVCashRegister';
import { PDVOperator } from '../../types/pdv';
import { PesagemModal } from '../PDV/PesagemModal';

interface Store2PDVSalesScreenProps {
  operator?: PDVOperator;
  scaleHook?: any;
}

const Store2PDVSalesScreen: React.FC<Store2PDVSalesScreenProps> = ({ operator, scaleHook }) => {
  const { products, loading: productsLoading, searchProducts } = useStore2Products();
  const { createSale, loading: salesLoading } = useStore2Sales();
  const { isOpen: isCashRegisterOpen, currentRegister } = useStore2PDVCashRegister();
  const {
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
    itemCount,
    totalItems
  } = useStore2Cart();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedWeighableProduct, setSelectedWeighableProduct] = useState<any>(null);

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'acai', label: 'Açaí' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'complementos', label: 'Complementos' },
    { id: 'sobremesas', label: 'Sobremesas' },
    { id: 'sorvetes', label: 'Sorvetes' },
    { id: 'outros', label: 'Outros' }
  ];

  const filteredProducts = React.useMemo(() => {
    let result = searchTerm ? searchProducts(searchTerm) : products;
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    return result.filter(p => p.is_active);
  }, [products, searchProducts, searchTerm, selectedCategory]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleProductClick = (product: any) => {
    if (product.is_weighable) {
      setSelectedWeighableProduct(product);
      setShowWeightModal(true);
    } else {
      addItem(product, 1);
    }
  };

  const handleWeightConfirm = (weightInGrams: number) => {
    if (selectedWeighableProduct && weightInGrams > 0) {
      const weightInKg = weightInGrams / 1000;
      addItem(selectedWeighableProduct, 1, weightInKg);
    }
    setShowWeightModal(false);
    setSelectedWeighableProduct(null);
  };

  const handleFinalizeSale = async () => {
    if (!currentRegister || items.length === 0) return;

    try {
      const saleData = {
        operator_id: operator?.id,
        customer_name: paymentInfo.customerName,
        customer_phone: paymentInfo.customerPhone,
        subtotal: getSubtotal(),
        discount_amount: getDiscountAmount(),
        discount_percentage: discount.type === 'percentage' ? discount.value : 0,
        total_amount: getTotal(),
        payment_type: paymentInfo.method,
        change_amount: paymentInfo.changeFor || 0,
        notes: '',
        is_cancelled: false,
        channel: 'loja2'
      };

      const saleItems = items.map(item => ({
        product_id: item.product.id,
        product_code: item.product.code,
        product_name: item.product.name,
        quantity: item.quantity,
        weight_kg: item.weight,
        unit_price: item.product.unit_price,
        price_per_gram: item.product.price_per_gram,
        discount_amount: item.discount,
        subtotal: item.subtotal
      }));

      await createSale(saleData, saleItems, currentRegister.id);
      clearCart();
    } catch (error) {
      console.error('Erro ao finalizar venda da Loja 2:', error);
      alert('Erro ao finalizar venda. Tente novamente.');
    }
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando produtos da Loja 2...</span>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Products Section */}
      <div className="flex-1 bg-white rounded-xl shadow-sm p-6 mr-4">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar produtos da Loja 2..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[500px]">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-blue-300"
            >
              <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package size={32} className="text-gray-400" />
                )}
              </div>
              
              <h3 className="font-medium text-gray-800 text-sm mb-2 line-clamp-2">
                {product.name}
              </h3>
              
              <div className="flex items-center justify-between">
                <div>
                  {product.is_weighable ? (
                    <div className="flex items-center gap-1 text-blue-600 font-bold text-sm">
                      <Scale size={12} />
                      {formatPrice((product.price_per_gram || 0) * 1000)}/kg
                    </div>
                  ) : (
                    <div className="font-bold text-blue-600 text-sm">
                      {formatPrice(product.unit_price || 0)}
                    </div>
                  )}
                </div>
                
                <button className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum produto encontrado na Loja 2</p>
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart size={24} className="text-blue-600" />
            Carrinho - Loja 2
          </h2>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {totalItems} {totalItems === 1 ? 'item' : 'itens'}
          </div>
        </div>

        {/* Cart Items with Scroll */}
        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">Carrinho vazio</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 text-sm">{item.product.name}</h4>
                    {item.weight && (
                      <p className="text-xs text-gray-600">Peso: {(item.weight * 1000).toFixed(0)}g</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                      className="bg-gray-200 hover:bg-gray-300 rounded-full p-1"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-medium w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                      className="bg-gray-200 hover:bg-gray-300 rounded-full p-1"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="font-bold text-blue-600">
                    {formatPrice(item.subtotal)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary */}
        {items.length > 0 && (
          <>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(getSubtotal())}</span>
              </div>
              {getDiscountAmount() > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto:</span>
                  <span>-{formatPrice(getDiscountAmount())}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-blue-600">{formatPrice(getTotal())}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentInfo.method}
                  onChange={(e) => updatePaymentInfo({ method: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                </select>
              </div>

              {paymentInfo.method === 'dinheiro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Troco para:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentInfo.changeFor || ''}
                    onChange={(e) => updatePaymentInfo({ changeFor: parseFloat(e.target.value) || undefined })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Valor para troco"
                  />
                </div>
              )}

              <button
                onClick={handleFinalizeSale}
                disabled={!isCashRegisterOpen || salesLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {salesLoading ? 'Processando...' : 'Finalizar Venda'}
              </button>

              {!isCashRegisterOpen && (
                <p className="text-red-600 text-sm text-center">
                  Abra o caixa para realizar vendas - Loja 2
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Weight Modal */}
      {showWeightModal && selectedWeighableProduct && (
        <PesagemModal
          produto={selectedWeighableProduct}
          onConfirmar={handleWeightConfirm}
          onFechar={() => {
            setShowWeightModal(false);
            setSelectedWeighableProduct(null);
          }}
          useDirectScale={true}
        />
      )}
    </div>
  );
};

export default Store2PDVSalesScreen;