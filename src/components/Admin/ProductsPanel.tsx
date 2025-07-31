import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Upload, X, Save, Package, Image as ImageIcon, GripVertical } from 'lucide-react';
import { useDeliveryProducts } from '../../hooks/useDeliveryProducts';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useProductScheduling } from '../../hooks/useProductScheduling';
import ImageUploadModal from './ImageUploadModal';
import ProductScheduleModal from './ProductScheduleModal';

interface ComplementOption {
  name: string;
  price: number;
  description: string;
  is_active?: boolean;
}

interface ComplementGroup {
  name: string;
  required: boolean;
  min_items: number;
  max_items: number;
  options: ComplementOption[];
}

interface ProductFormData {
  id?: string;
  name: string;
  category: string;
  price: number;
  original_price?: number;
  description: string;
  image_url?: string;
  is_active: boolean;
  is_weighable: boolean;
  price_per_gram?: number;
  has_complements: boolean;
  complement_groups?: ComplementGroup[];
  sizes?: any[];
}

const DEFAULT_COMPLEMENT_GROUPS: ComplementGroup[] = [
  {
    name: "TIPO DE AÇAÍ (ESCOLHA 1 ITEM)",
    required: true,
    min_items: 1,
    max_items: 1,
    options: [
      { name: "AÇAÍ PREMIUM TRADICIONAL", price: 0, description: "Açaí tradicional premium" },
      { name: "AÇAÍ PREMIUM (0% AÇÚCAR - FIT)", price: 0, description: "Açaí sem açúcar, ideal para dieta" },
      { name: "AÇAÍ PREMIUM COM MORANGO", price: 0, description: "Açaí premium com sabor morango" }
    ]
  },
  {
    name: "COMO DESEJA A QUANTIDADE DE AÇAÍ?",
    required: true,
    min_items: 1,
    max_items: 1,
    options: [
      { name: "MAIS AÇAÍ", price: 0, description: "Quantidade extra de açaí" },
      { name: "NÃO QUERO AÇAÍ", price: 0, description: "Sem açaí" },
      { name: "MENOS AÇAÍ", price: 0, description: "Quantidade reduzida de açaí" },
      { name: "QUANTIDADE NORMAL", price: 0, description: "Quantidade padrão de açaí" }
    ]
  },
  {
    name: "CREMES * OPCIONAL (ATÉ 2 ITEM)",
    required: false,
    min_items: 0,
    max_items: 2,
    options: [
      { name: "CREME DE CUPUAÇU", price: 0, description: "Creme cremoso de cupuaçu" },
      { name: "CREME DE MORANGO", price: 0, description: "Creme doce de morango" },
      { name: "CREME DE NINHO", price: 0, description: "Creme de leite ninho" },
      { name: "CREME DE NUTELA", price: 0, description: "Creme de nutella" },
      { name: "CREME DE MARACUJÁ", price: 0, description: "Creme azedinho de maracujá" },
      { name: "CREME DE PAÇOCA", price: 0, description: "Creme de paçoca" },
      { name: "CREME DE OVOMALTINE", price: 0, description: "Creme de ovomaltine" },
      { name: "CREME DE PISTACHE", price: 0, description: "Creme de pistache" }
    ].map(comp => ({ ...comp, is_active: true }))
  },
  {
    name: "3 ADICIONAIS * OPCIONAL (ATÉ 3 ITENS)",
    required: false,
    min_items: 0,
    max_items: 3,
    options: [
      { name: "CASTANHA EM BANDA", price: 0, description: "Castanha em fatias" },
      { name: "CEREJA", price: 0, description: "Cereja doce" },
      { name: "CHOCOBALL MINE", price: 0, description: "Chocoball pequeno" },
      { name: "CHOCOBALL POWER", price: 0, description: "Chocoball grande" },
      { name: "CREME DE COOKIES BRANCO", price: 0, description: "Creme de cookies branco" },
      { name: "CHOCOLATE COM AVELÃ (NUTELA)", price: 0, description: "Chocolate com avelã" },
      { name: "COBERTURA DE CHOCOLATE", price: 0, description: "Cobertura de chocolate" },
      { name: "COBERTURA DE MORANGO", price: 0, description: "Cobertura de morango" },
      { name: "COBERTURA FINE DENTADURA", price: 0, description: "Cobertura fine dentadura" },
      { name: "COBERTURA FINE BANANINHA", price: 0, description: "Cobertura fine bananinha" },
      { name: "COBERTURA FINE BEIJINHO", price: 0, description: "Cobertura fine beijinho" },
      { name: "GANACHE MEIO AMARGO", price: 0, description: "Ganache meio amargo" },
      { name: "GOTAS DE CHOCOLATE PRETO", price: 0, description: "Gotas de chocolate preto" },
      { name: "GRANULADO DE CHOCOLATE", price: 0, description: "Granulado de chocolate" },
      { name: "GRANOLA", price: 0, description: "Granola crocante" },
      { name: "JUJUBA", price: 0, description: "Jujuba colorida" },
      { name: "KIWI", price: 0, description: "Kiwi fatiado" },
      { name: "LEITE CONDENSADO", price: 0, description: "Leite condensado" },
      { name: "LEITE EM PÓ", price: 0, description: "Leite em pó" },
      { name: "MARSHMALLOWS", price: 0, description: "Marshmallows macios" },
      { name: "MMS", price: 0, description: "Confetes coloridos" },
      { name: "MORANGO", price: 0, description: "Morango fresco" },
      { name: "PAÇOCA", price: 0, description: "Paçoca triturada" },
      { name: "RECHEIO LEITINHO", price: 0, description: "Recheio de leitinho" },
      { name: "SUCRILHOS", price: 0, description: "Sucrilhos crocantes" },
      { name: "UVA", price: 0, description: "Uva fresca" },
      { name: "UVA PASSAS", price: 0, description: "Uva passas" },
      { name: "FLOCOS DE TAPIOCA CARAMELIZADO", price: 0, description: "Flocos de tapioca caramelizado" },
      { name: "CANUDOS", price: 0, description: "Canudos crocantes" },
      { name: "OVOMALTINE", price: 0, description: "Ovomaltine em pó" },
      { name: "FARINHA LÁCTEA", price: 0, description: "Farinha láctea" },
      { name: "ABACAXI AO VINHO", price: 0, description: "Abacaxi ao vinho" },
      { name: "AMENDOIM COLORIDO", price: 0, description: "Amendoim colorido" },
      { name: "FINE BEIJINHO", price: 0, description: "Fine beijinho" },
      { name: "FINE AMORA", price: 0, description: "Fine amora" },
      { name: "FINE DENTADURA", price: 0, description: "Fine dentadura" },
      { name: "NESTON EM FLOCOS", price: 0, description: "Neston em flocos" },
      { name: "RECHEIO FERRERO ROCHÊ", price: 0, description: "Recheio ferrero rochê" },
      { name: "AVEIA EM FLOCOS", price: 0, description: "Aveia em flocos" },
      { name: "GANACHE CHOCOLATE AO LEITE", price: 0, description: "Ganache chocolate ao leite" },
      { name: "CHOCOBOLL BOLA BRANCA", price: 0, description: "Chocoboll bola branca" },
      { name: "MORANGO EM CALDAS", price: 0, description: "Morango em caldas" },
      { name: "DOCE DE LEITE", price: 0, description: "Doce de leite" },
      { name: "CHOCOWAFER BRANCO", price: 0, description: "Chocowafer branco" },
      { name: "CREME DE COOKIES PRETO", price: 0, description: "Creme de cookies preto" },
      { name: "PASTA DE AMENDOIM", price: 0, description: "Pasta de amendoim" },
      { name: "RECHEIO DE LEITINHO", price: 0, description: "Recheio de leitinho" },
      { name: "BEIJINHO", price: 0, description: "Beijinho" },
      { name: "BRIGADEIRO", price: 0, description: "Brigadeiro" },
      { name: "PORÇÕES DE BROWNIE", price: 0, description: "Porções de brownie" },
      { name: "RASPAS DE CHOCOLATE", price: 0, description: "Raspas de chocolate" },
      { name: "RECHEIO DE FERREIRO ROCHÊ", price: 0, description: "Recheio de ferreiro rochê" }
    ].map(comp => ({ ...comp, is_active: true }))
  },
  {
    name: "10 ADICIONAIS * OPCIONAL (ATÉ 10 ITENS)",
    required: false,
    min_items: 0,
    max_items: 10,
    options: [
      { name: "AMENDOIN", price: 2, description: "Amendoim torrado" },
      { name: "CASTANHA EM BANDA", price: 3, description: "Castanha em fatias" },
      { name: "CEREJA", price: 2, description: "Cereja doce" },
      { name: "CHOCOBALL MINE", price: 2, description: "Chocoball pequeno" },
      { name: "CHOCOBALL POWER", price: 2, description: "Chocoball grande" },
      { name: "CREME DE COOKIES", price: 3, description: "Creme de cookies" },
      { name: "CHOCOLATE COM AVELÃ (NUTELA)", price: 3, description: "Chocolate com avelã" },
      { name: "COBERTURA DE CHOCOLATE", price: 2, description: "Cobertura de chocolate" },
      { name: "COBERTURA DE MORANGO", price: 2, description: "Cobertura de morango" },
      { name: "GANACHE MEIO AMARGO", price: 2, description: "Ganache meio amargo" },
      { name: "GRANOLA", price: 2, description: "Granola crocante" },
      { name: "GOTAS DE CHOCOLATE", price: 3, description: "Gotas de chocolate" },
      { name: "GRANULADO DE CHOCOLATE", price: 2, description: "Granulado de chocolate" },
      { name: "JUJUBA", price: 2, description: "Jujuba colorida" },
      { name: "KIWI", price: 3, description: "Kiwi fatiado" },
      { name: "LEITE CONDENSADO", price: 2, description: "Leite condensado" },
      { name: "LEITE EM PÓ", price: 3, description: "Leite em pó" },
      { name: "MARSHMALLOWS", price: 2, description: "Marshmallows macios" },
      { name: "MMS", price: 2, description: "Confetes coloridos" },
      { name: "MORANGO", price: 3, description: "Morango fresco" },
      { name: "PAÇOCA", price: 2, description: "Paçoca triturada" },
      { name: "RECHEIO DE NINHO", price: 2, description: "Recheio de ninho" },
      { name: "UVA", price: 2, description: "Uva fresca" },
      { name: "UVA PASSAS", price: 2, description: "Uva passas" },
      { name: "COBERTURA FINE DENTADURA", price: 2, description: "Cobertura fine dentadura" },
      { name: "COBERTURA FINE BEIJINHO", price: 2, description: "Cobertura fine beijinho" },
      { name: "COBERTURA FINE BANANINHA", price: 2, description: "Cobertura fine bananinha" }
    ].map(comp => ({ ...comp, is_active: true }))
  },
  {
    name: "VOCÊ PREFERE OS OPCIONAIS SEPARADOS OU JUNTO COM O AÇAÍ?",
    required: true,
    min_items: 1,
    max_items: 1,
    options: [
      { name: "SIM, QUERO TUDO JUNTO", price: 0, description: "Misturar tudo com o açaí" },
      { name: "NÃO, QUERO SEPARADOS", price: 0, description: "Servir os complementos separadamente" }
    ]
  },
  {
    name: "CONSUMA MENOS DESCARTÁVEIS.",
    required: true,
    min_items: 1,
    max_items: 1,
    options: [
      { name: "SIM, VOU QUERER A COLHER", price: 0, description: "Incluir colher descartável" },
      { name: "NÃO QUERO COLHER, VOU AJUDAR AO MEIO AMBIENTE", price: 0, description: "Sem colher, ajudando o meio ambiente" }
    ]
  }
];

const ProductsPanel: React.FC = () => {
  const { products, loading, createProduct, updateProduct, deleteProduct } = useDeliveryProducts();
  const { uploadImage, uploading, getProductImage } = useImageUpload();
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: 'acai',
    price: 0,
    description: '',
    is_active: true,
    is_weighable: false,
    has_complements: false,
    complement_groups: []
  });
  const [draggedGroupIndex, setDraggedGroupIndex] = useState<number | null>(null);
  const [draggedOptionIndex, setDraggedOptionIndex] = useState<{ groupIndex: number; optionIndex: number } | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedProductForSchedule, setSelectedProductForSchedule] = useState<any | null>(null);
  
  const { getProductSchedule, saveProductSchedule } = useProductScheduling();

  // Carregar imagens dos produtos
  useEffect(() => {
    const loadProductImages = async () => {
      // Check if Supabase is configured before attempting to load images
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - pulando carregamento de imagens');
        return;
      }
      
      console.log('🔄 Carregando imagens dos produtos...');
      const images: Record<string, string> = {};
      let successCount = 0;
      let errorCount = 0;
      
      for (const product of products) {
        try {
          const savedImage = await getProductImage(product.id);
          if (savedImage) {
            images[product.id] = savedImage;
            successCount++;
            console.log(`✅ Imagem carregada para produto ${product.name}:`, savedImage.substring(0, 50) + '...');
          }
        } catch (error) {
          errorCount++;
          // Silently handle errors since getProductImage already logs them
          console.warn(`⚠️ Erro ao carregar imagem do produto ${product.name} - continuando sem imagem`);
        }
      }
      
      setProductImages(images);
      if (successCount > 0 || errorCount > 0) {
        console.log(`📊 Carregamento de imagens concluído: ${successCount} sucessos, ${errorCount} erros`);
      }
    };

    // Only load images if we have products and Supabase is configured
    if (products.length > 0) {
      loadProductImages();
    }
  }, [products, getProductImage]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'acai',
      price: 0,
      description: '',
      is_active: true,
      is_weighable: false,
      has_complements: false,
      complement_groups: []
    });
    setEditingProduct(null);
  };

  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (product: any) => {
    const productData: ProductFormData = {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image_url: productImages[product.id] || product.image_url,
      original_price: product.original_price,
      description: product.description,
      is_active: product.is_active,
      is_weighable: product.is_weighable,
      price_per_gram: product.price_per_gram,
      has_complements: product.has_complements,
      complement_groups: Array.isArray(product.complement_groups) 
        ? product.complement_groups.map(group => ({
            ...group,
            options: Array.isArray(group.options) ? group.options : []
          }))
        : []
    };
    
    setFormData(productData);
    setEditingProduct(productData);
    setShowModal(true);
  };

  const handleRefreshProducts = async () => {
    try {
      console.log('🔄 Recarregando produtos...');
      // Force refresh from database
      window.location.reload();
    } catch (error) {
      console.error('Erro ao recarregar produtos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Iniciando salvamento do produto:', {
      editingProduct: !!editingProduct,
      formData,
      productId: editingProduct?.id
    });

    // Validate that we have a valid product ID for updates
    if (editingProduct && (!editingProduct.id || editingProduct.id.startsWith('temp-'))) {
      alert('Erro: ID do produto inválido. Tente recarregar a página e criar o produto novamente.');
      setShowModal(false);
      return;
    }
    
    try {
      let savedProduct;
      
      if (editingProduct) {
        await updateProduct(editingProduct.id!, formData);
      } else {
        const newProduct = await createProduct(formData);
        setEditingProduct(newProduct);
      }
      setShowModal(false);
      resetForm();
      
      // Show success message
      alert(`Produto ${editingProduct ? 'atualizado' : 'criado'} com sucesso!`);
      
      // Refresh products list
      
      // Forçar recarregamento dos produtos após salvar
      console.log('✅ Produto salvo, recarregando lista...');
      try {
        // Tentar recarregar produtos do delivery se o hook estiver disponível
        const deliveryRefresh = (window as any).refreshDeliveryProducts;
        if (deliveryRefresh) {
          console.log('🔄 Atualizando produtos do delivery após alteração...')
          await deliveryRefresh();
          console.log('✅ Produtos do delivery atualizados')
        }
        
        // Mostrar feedback de sucesso
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
        successMessage.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Produto excluído com sucesso!
        `;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 3000);
        
      } catch (error) {
        console.log('Delivery refresh não disponível:', error);
      }
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);

      // Mostrar erro detalhado
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao salvar produto: ${errorMessage}\n\nDetalhes: ${JSON.stringify(error)}`);
      
      // Log completo do erro
      console.error('Erro completo:', {
        error,
        formData,
        editingProduct
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      console.log('🚀 Iniciando upload de imagem...');
      const uploadedImage = await uploadImage(file);
      console.log('✅ Upload concluído:', uploadedImage.url);
      setFormData(prev => ({ ...prev, image_url: uploadedImage.url }));
      
      // Atualizar cache local de imagens
      if (editingProduct?.id) {
        setProductImages(prev => ({
          ...prev,
          [editingProduct.id!]: uploadedImage.url
        }));
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    console.log('🖼️ Imagem selecionada:', imageUrl.substring(0, 50) + '...');
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
    
    // Atualizar cache local de imagens
    if (editingProduct?.id) {
      setProductImages(prev => ({
        ...prev,
        [editingProduct.id!]: imageUrl
      }));
    }
    
    setShowImageModal(false);
  };

  const handleScheduleProduct = (product: any) => {
    setSelectedProductForSchedule(product);
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async (productId: string, scheduledDays: any) => {
    try {
      await saveProductSchedule(productId, scheduledDays);
      setShowScheduleModal(false);
      setSelectedProductForSchedule(null);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Programação do produto salva com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar programação:', error);
      alert('Erro ao salvar programação do produto.');
    }
  };

  const applyDefaultComplementGroups = () => {
    setFormData(prev => ({
      ...prev,
      has_complements: true,
      complement_groups: [...DEFAULT_COMPLEMENT_GROUPS]
    }));
  };

  const handleGroupDragStart = (e: React.DragEvent, groupIndex: number) => {
    setDraggedGroupIndex(groupIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroupIndex: number) => {
    e.preventDefault();
    
    if (draggedGroupIndex === null || draggedGroupIndex === targetGroupIndex) {
      setDraggedGroupIndex(null);
      return;
    }

    const newGroups = [...(formData.complement_groups || [])];
    const draggedGroup = newGroups[draggedGroupIndex];
    
    // Remove o grupo da posição original
    newGroups.splice(draggedGroupIndex, 1);
    
    // Insere na nova posição
    const insertIndex = draggedGroupIndex < targetGroupIndex ? targetGroupIndex - 1 : targetGroupIndex;
    newGroups.splice(insertIndex, 0, draggedGroup);
    
    setFormData(prev => ({
      ...prev,
      complement_groups: newGroups
    }));
    
    setDraggedGroupIndex(null);
  };

  const handleOptionDragStart = (e: React.DragEvent, groupIndex: number, optionIndex: number) => {
    setDraggedOptionIndex({ groupIndex, optionIndex });
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };

  const handleOptionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.stopPropagation();
  };

  const handleOptionDrop = (e: React.DragEvent, targetGroupIndex: number, targetOptionIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedOptionIndex || 
        (draggedOptionIndex.groupIndex === targetGroupIndex && draggedOptionIndex.optionIndex === targetOptionIndex)) {
      setDraggedOptionIndex(null);
      return;
    }

    const newGroups = [...(formData.complement_groups || [])];
    const sourceGroup = newGroups[draggedOptionIndex.groupIndex];
    const targetGroup = newGroups[targetGroupIndex];
    
    // Se for o mesmo grupo, reordenar dentro do grupo
    if (draggedOptionIndex.groupIndex === targetGroupIndex) {
      const draggedOption = sourceGroup.options[draggedOptionIndex.optionIndex];
      sourceGroup.options.splice(draggedOptionIndex.optionIndex, 1);
      
      const insertIndex = draggedOptionIndex.optionIndex < targetOptionIndex ? targetOptionIndex - 1 : targetOptionIndex;
      sourceGroup.options.splice(insertIndex, 0, draggedOption);
    } else {
      // Mover entre grupos diferentes
      const draggedOption = sourceGroup.options[draggedOptionIndex.optionIndex];
      sourceGroup.options.splice(draggedOptionIndex.optionIndex, 1);
      targetGroup.options.splice(targetOptionIndex, 0, draggedOption);
    }
    
    setFormData(prev => ({
      ...prev,
      complement_groups: newGroups
    }));
    
    setDraggedOptionIndex(null);
  };

  const addComplementGroup = () => {
    const newGroup: ComplementGroup = {
      name: "Novo Grupo",
      required: false,
      min_items: 0,
      max_items: 1,
      options: []
    };
    
    setFormData(prev => ({
      ...prev,
      complement_groups: [...(prev.complement_groups || []), newGroup]
    }));
  };

  const updateComplementGroup = (groupIndex: number, updates: Partial<ComplementGroup>) => {
    setFormData(prev => ({
      ...prev,
      complement_groups: prev.complement_groups?.map((group, index) =>
        index === groupIndex ? { ...group, ...updates } : group
      ) || []
    }));
  };

  const removeComplementGroup = (groupIndex: number) => {
    setFormData(prev => ({
      ...prev,
      complement_groups: prev.complement_groups?.filter((_, index) => index !== groupIndex) || []
    }));
  };

  const addComplementOption = (groupIndex: number) => {
    const newOption: ComplementOption = {
      name: "",
      price: 0,
      description: "",
      is_active: true
    };
    
    setFormData(prev => ({
      ...prev,
      complement_groups: prev.complement_groups?.map((group, index) =>
        index === groupIndex 
          ? { ...group, options: [...group.options, newOption] }
          : group
      ) || []
    }));
  };

  const updateComplementOption = (groupIndex: number, optionIndex: number, updates: Partial<ComplementOption>) => {
    setFormData(prev => ({
      ...prev,
      complement_groups: prev.complement_groups?.map((group, gIndex) =>
        gIndex === groupIndex
          ? {
              ...group,
              options: group.options.map((option, oIndex) =>
                oIndex === optionIndex ? { ...option, ...updates } : option
              )
            }
          : group
      ) || []
    }));
  };

  const removeComplementOption = (groupIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      complement_groups: Array.isArray(prev.complement_groups) ? prev.complement_groups.map((group, gIndex) =>
        gIndex === groupIndex
          ? { ...group, options: group.options.filter((_, oIndex) => oIndex !== optionIndex) }
          : group
      ) : []
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>
      
      <div className="flex justify-end mb-4">
        <button
          onClick={handleRefreshProducts}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          🔄 Recarregar Produtos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{product.description}</p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold text-green-600">
                  R$ {product.price.toFixed(2)}
                </span>
                {product.original_price && (
                  <span className="text-sm text-gray-500 line-through">
                    R$ {product.original_price.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className={`px-2 py-1 rounded text-xs ${
                  product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {product.is_active ? 'Ativo' : 'Inativo'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleScheduleProduct(product)}
                    className="text-orange-600 hover:text-orange-800"
                    title="Programar disponibilidade"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Coluna Esquerda - Informações Básicas */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Informações Básicas
                      </h4>
                      
                      {/* Upload de Imagem */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Imagem do Produto
                        </label>
                        <div className="text-xs text-gray-500 mb-2">
                          💡 Dica: Clique em "Gerenciar Imagens" para fazer upload ou selecionar uma imagem<br/>
                          🔄 A imagem será salva automaticamente no banco de dados<br/>
                          📱 Imagens ficam sincronizadas em todos os dispositivos
                        </div>
                        <div className="flex items-center gap-4">
                          {(formData.image_url || (editingProduct?.id && productImages[editingProduct.id])) ? (
                            <img
                              src={formData.image_url || (editingProduct?.id && productImages[editingProduct.id]) || ''}
                              alt="Preview"
                              className="w-20 h-20 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-lg border flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowImageModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Gerenciar Imagens
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome do Produto *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoria *
                          </label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="acai">Açaí</option>
                            <option value="combo">Combo</option>
                            <option value="milkshake">Milkshake</option>
                            <option value="vitamina">Vitamina</option>
                            <option value="sorvetes">Sorvetes</option>
                            <option value="bebidas">Bebidas</option>
                            <option value="complementos">Complementos</option>
                            <option value="sobremesas">Sobremesas</option>
                            <option value="outros">Outros</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Preço (R$) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.price}
                              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Preço Original (R$)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.original_price || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, original_price: parseFloat(e.target.value) || undefined }))}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Para produtos em promoção (preço riscado)"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.is_weighable}
                              onChange={(e) => setFormData(prev => ({ ...prev, is_weighable: e.target.checked }))}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Produto pesável (vendido por peso)
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coluna Direita - Tamanhos */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-4">Tamanhos do Produto</h4>
                      <p className="text-gray-500 text-sm mb-4">Nenhum tamanho configurado</p>
                      <button
                        type="button"
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Tamanho
                      </button>
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>

                {/* Grupos de Complementos */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Grupos de Complementos</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={applyDefaultComplementGroups}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        Aplicar Grupos Padrão
                      </button>
                      <button
                        type="button"
                        onClick={addComplementGroup}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Grupo
                      </button>
                    </div>
                  </div>

                  {formData.complement_groups && formData.complement_groups.length > 0 ? (
                    <div className="space-y-6">
                      {formData.complement_groups.map((group, groupIndex) => (
                        <div 
                          key={groupIndex} 
                          className={`border rounded-lg p-4 bg-gray-50 transition-all ${
                            draggedGroupIndex === groupIndex ? 'opacity-50 scale-95' : ''
                          }`}
                          draggable
                          onDragStart={(e) => handleGroupDragStart(e, groupIndex)}
                          onDragOver={handleGroupDragOver}
                          onDrop={(e) => handleGroupDrop(e, groupIndex)}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <div className="cursor-move text-gray-400 hover:text-gray-600">
                                <GripVertical size={16} />
                              </div>
                              <span className="text-sm font-medium text-gray-600">
                                Grupo {groupIndex + 1}
                              </span>
                            </div>
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Nome do Grupo
                                </label>
                                <input
                                  type="text"
                                  value={group.name}
                                  onChange={(e) => updateComplementGroup(groupIndex, { name: e.target.value })}
                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mín. Itens
                                  </label>
                                  <input
                                    type="number"
                                    value={group.min_items}
                                    onChange={(e) => updateComplementGroup(groupIndex, { min_items: parseInt(e.target.value) || 0 })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Máx. Itens
                                  </label>
                                  <input
                                    type="number"
                                    value={group.max_items}
                                    onChange={(e) => updateComplementGroup(groupIndex, { max_items: parseInt(e.target.value) || 1 })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={group.required}
                                    onChange={(e) => updateComplementGroup(groupIndex, { required: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm font-medium text-gray-700">
                                    Obrigatório
                                  </span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removeComplementGroup(groupIndex)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Complementos */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h5 className="font-medium text-sm">
                                Complementos ({group.options.length})
                              </h5>
                              <button
                                type="button"
                                onClick={() => addComplementOption(groupIndex)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Adicionar Complemento
                              </button>
                            </div>

                            {group.options.length > 0 && (
                              <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-700 bg-gray-100 p-2 rounded">
                                <div>Ordem</div>
                                <div>Nome</div>
                                <div>Preço (R$)</div>
                                <div>Descrição</div>
                                <div>Status</div>
                                <div>Ações</div>
                              </div>
                            )}

                            <div className="max-h-60 overflow-y-auto space-y-2">
                              {group.options.map((option, optionIndex) => (
                                <div 
                                  key={optionIndex} 
                                  className={`grid grid-cols-7 gap-2 items-center bg-white p-2 rounded border transition-all ${
                                    draggedOptionIndex?.groupIndex === groupIndex && draggedOptionIndex?.optionIndex === optionIndex 
                                      ? 'opacity-50 scale-95' : ''
                                  } ${option.is_active === false ? 'bg-red-50 border-red-200' : ''}`}
                                  draggable
                                  onDragStart={(e) => handleOptionDragStart(e, groupIndex, optionIndex)}
                                  onDragOver={handleOptionDragOver}
                                  onDrop={(e) => handleOptionDrop(e, groupIndex, optionIndex)}
                                >
                                  <div className="cursor-move text-gray-400 hover:text-gray-600 flex items-center justify-center">
                                    <GripVertical size={14} />
                                  </div>
                                  <input
                                    type="text"
                                    value={option.name}
                                    onChange={(e) => updateComplementOption(groupIndex, optionIndex, { name: e.target.value })}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    placeholder="Nome"
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={option.price}
                                    onChange={(e) => updateComplementOption(groupIndex, optionIndex, { price: parseFloat(e.target.value) || 0 })}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                  />
                                  <input
                                    type="text"
                                    value={option.description}
                                    onChange={(e) => updateComplementOption(groupIndex, optionIndex, { description: e.target.value })}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    placeholder="Descrição"
                                  />
                                  <div className="flex items-center justify-center">
                                    <label className="flex items-center gap-1">
                                      <input
                                        type="checkbox"
                                        checked={option.is_active !== false}
                                        onChange={(e) => updateComplementOption(groupIndex, optionIndex, { is_active: e.target.checked })}
                                        className="w-3 h-3 text-green-600"
                                      />
                                      <span className="text-xs text-gray-600">Ativo</span>
                                    </label>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeComplementOption(groupIndex, optionIndex)}
                                    className="text-red-600 hover:text-red-800 flex items-center justify-center"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum grupo de complementos configurado</p>
                      <p className="text-sm">Clique em "Aplicar Grupos Padrão" para começar</p>
                      <p className="text-xs mt-2 text-blue-600">
                        💡 Dica: Após criar grupos, você pode arrastá-los para reordenar
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-4 p-6 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingProduct ? 'Atualizar' : 'Criar'} Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageModal && (
        <ImageUploadModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          onSelectImage={handleImageSelect}
          currentImage={formData.image_url || (editingProduct?.id && productImages[editingProduct.id])}
        />
      )}

      {/* Product Schedule Modal */}
      {showScheduleModal && selectedProductForSchedule && (
        <ProductScheduleModal
          product={selectedProductForSchedule}
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedProductForSchedule(null);
          }}
          onSave={handleSaveSchedule}
          currentSchedule={getProductSchedule(selectedProductForSchedule.id)}
        />
      )}
    </div>
  );
};

export default ProductsPanel;