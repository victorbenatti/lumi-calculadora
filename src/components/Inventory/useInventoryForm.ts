import { useMemo, useState, type ChangeEvent } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import { enrichPerfumeData } from '../../lib/gemini';
import { parseDecimalInput } from '../../utils/parsing';

type Trip = Database['public']['Tables']['viagens']['Row'];
type Product = Database['public']['Tables']['produtos']['Row'];

export type SaveFeedback = {
  mode: 'created' | 'updated';
  productName: string;
};

interface UseInventoryFormParams {
  trips: Trip[];
  refetch: () => void;
}

export function useInventoryForm({ trips, refetch }: UseInventoryFormParams) {
  const [selectedTrip, setSelectedTrip] = useState<string>(
    trips.find(t => t.status === 'ativa')?.id || ''
  );
  const [name, setName] = useState('');
  const [priceUSD, setPriceUSD] = useState('');
  const [margin, setMargin] = useState('30');
  const [extraCost, setExtraCost] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [promotionPrice, setPromotionPrice] = useState('');
  const [promotionActive, setPromotionActive] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('Unissex');
  const [tipo, setTipo] = useState('Importado');
  const [volume, setVolume] = useState('100ml');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [notasTopo, setNotasTopo] = useState('');
  const [notasCoracao, setNotasCoracao] = useState('');
  const [notasFundo, setNotasFundo] = useState('');
  const [familiaOlfativa, setFamiliaOlfativa] = useState('');
  const [ocasiao, setOcasiao] = useState('');
  const [descricaoIa, setDescricaoIa] = useState('');
  const [inspiradoEm, setInspiradoEm] = useState('');
  const [maisVendido, setMaisVendido] = useState(false);

  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null);

  const activeTrip = trips.find(t => t.id === selectedTrip);

  const results = useMemo(() => {
    const costU = parseDecimalInput(priceUSD);
    const marg = parseDecimalInput(margin);
    const extra = parseDecimalInput(extraCost);

    if (!activeTrip || costU <= 0) {
      return { costBRL: 0, suggestedPrice: 0, grossProfit: 0 };
    }

    const costBRLFinal = (costU * activeTrip.cotacao_dolar) + extra;
    const suggestedPrice = costBRLFinal * (1 + (marg / 100));

    return {
      costBRL: costBRLFinal,
      suggestedPrice,
      grossProfit: suggestedPrice - costBRLFinal
    };
  }, [priceUSD, margin, extraCost, activeTrip]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerateAI = async () => {
    if (!name) return alert('Digite o nome do perfume primeiro para a IA buscar os detalhes.');
    const hasManualAIData = [
      notasTopo,
      notasCoracao,
      notasFundo,
      familiaOlfativa,
      ocasiao,
      descricaoIa,
      inspiradoEm,
    ].some(value => value.trim() !== '') || tipo !== 'Importado';

    if (hasManualAIData && !confirm('Gerar IA vai sobrescrever os detalhes da fragrância já preenchidos. Deseja continuar?')) {
      return;
    }

    setGeneratingAI(true);
    try {
      const data = await enrichPerfumeData(name);
      setNotasTopo(data.notas_topo);
      setNotasCoracao(data.notas_coracao);
      setNotasFundo(data.notas_fundo);
      setFamiliaOlfativa(data.familia_olfativa);
      setOcasiao(data.ocasiao);
      setDescricaoIa(data.descricao_ia);
      setInspiradoEm(data.inspirado_em || '');
      setTipo(data.tipo);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Erro ao gerar dados via IA.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setName('');
    setPriceUSD('');
    setExtraCost('');
    setCustomPrice('');
    setPromotionPrice('');
    setPromotionActive(false);
    setQuantity('1');
    setImageFile(null);
    setImagePreview('');
    setCategory('Unissex');
    setVolume('100ml');

    setNotasTopo('');
    setNotasCoracao('');
    setNotasFundo('');
    setFamiliaOlfativa('');
    setOcasiao('');
    setDescricaoIa('');
    setInspiradoEm('');
    setMaisVendido(false);
    setTipo('Importado');
  };

  const handleSaveProduct = async () => {
    if (!selectedTrip || !name || !priceUSD) return alert('Preencha os campos obrigatórios');

    const productName = name.trim();
    const saveMode = editingProduct ? 'updated' : 'created';
    const parsedPromotionPrice = promotionPrice ? parseDecimalInput(promotionPrice) : null;
    if (promotionActive && (!parsedPromotionPrice || parsedPromotionPrice <= 0)) {
      return alert('Informe um preço promocional válido ou desative a promoção.');
    }

    setLoading(true);

    const costU = parseDecimalInput(priceUSD);
    const qty = parseInt(quantity, 10);

    let imageUrl = editingProduct ? editingProduct.imagem_url : null;
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('perfumes')
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error(uploadError);
        alert('Erro no upload da imagem, salvando sem imagem.');
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('perfumes')
          .getPublicUrl(filePath);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    const payload = {
      viagem_id: selectedTrip,
      nome: name,
      preco_usd: costU,
      custo_final_brl: results.costBRL,
      estoque: qty,
      categoria: category,
      imagem_url: imageUrl,
      preco_venda_brl: customPrice ? parseDecimalInput(customPrice) : null,
      preco_promocao_brl: parsedPromotionPrice,
      promocao_ativa: promotionActive,
      notas_topo: notasTopo,
      notas_coracao: notasCoracao,
      notas_fundo: notasFundo,
      familia_olfativa: familiaOlfativa,
      ocasiao: ocasiao,
      descricao_ia: descricaoIa,
      volume: volume,
      inspirado_em: inspiradoEm || null,
      mais_vendido: maisVendido,
      tipo: tipo,
    };

    let error;
    if (editingProduct) {
      const { error: updateError } = await supabase.from('produtos').update(payload).eq('id', editingProduct.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('produtos').insert(payload);
      error = insertError;
    }

    setLoading(false);
    if (error) {
      console.error(error);
      alert('Erro ao salvar produto');
    } else {
      handleCancelEdit();
      refetch();
      setSaveFeedback({ mode: saveMode, productName });
      window.setTimeout(() => setSaveFeedback(null), 4500);
    }
  };

  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setSelectedTrip(p.viagem_id);
    setName(p.nome);
    setPriceUSD(p.preco_usd.toString());
    setQuantity(p.estoque.toString());
    setCategory(p.categoria || 'Unissex');
    setVolume(p.volume || '100ml');
    setExtraCost('0');
    setCustomPrice(p.preco_venda_brl ? p.preco_venda_brl.toString() : '');
    setPromotionPrice(p.preco_promocao_brl ? p.preco_promocao_brl.toString() : '');
    setPromotionActive(p.promocao_ativa || false);
    setImagePreview(p.imagem_url || '');

    setNotasTopo(p.notas_topo || '');
    setNotasCoracao(p.notas_coracao || '');
    setNotasFundo(p.notas_fundo || '');
    setFamiliaOlfativa(p.familia_olfativa || '');
    setOcasiao(p.ocasiao || '');
    setDescricaoIa(p.descricao_ia || '');
    setInspiradoEm(p.inspirado_em || '');
    setMaisVendido(p.mais_vendido || false);
    setTipo(p.tipo || 'Importado');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto? Essa ação não pode ser desfeita.')) return;
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) {
      console.error(error);
      alert('Erro ao excluir produto');
    } else {
      refetch();
    }
  };

  return {
    selectedTrip, setSelectedTrip, activeTrip,
    name, setName,
    priceUSD, setPriceUSD,
    margin, setMargin,
    extraCost, setExtraCost,
    customPrice, setCustomPrice,
    promotionPrice, setPromotionPrice,
    promotionActive, setPromotionActive,
    quantity, setQuantity,
    category, setCategory,
    tipo, setTipo,
    volume, setVolume,
    maisVendido, setMaisVendido,

    imagePreview, handleImageChange,

    notasTopo, setNotasTopo,
    notasCoracao, setNotasCoracao,
    notasFundo, setNotasFundo,
    familiaOlfativa, setFamiliaOlfativa,
    ocasiao, setOcasiao,
    descricaoIa, setDescricaoIa,
    inspiradoEm, setInspiradoEm,

    results,
    loading, generatingAI, editingProduct, saveFeedback,

    handleGenerateAI, handleSaveProduct, handleEditProduct, handleDeleteProduct, handleCancelEdit,
  };
}

export type InventoryFormState = ReturnType<typeof useInventoryForm>;
