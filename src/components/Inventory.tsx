import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Button } from './ui/Button';
import { Package, DollarSign, Percent, Plus, Sparkles, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { enrichPerfumeData } from '../lib/gemini';

type Trip = Database['public']['Tables']['viagens']['Row'];
type Product = Database['public']['Tables']['produtos']['Row'];

interface Props {
  trips: Trip[];
  products: Product[];
  refetch: () => void;
}

export function Inventory({ trips, products, refetch }: Props) {
  const [selectedTrip, setSelectedTrip] = useState<string>(
    trips.find(t => t.status === 'ativa')?.id || ''
  );
  const [name, setName] = useState('');
  const [priceUSD, setPriceUSD] = useState('');
  const [margin, setMargin] = useState('30');
  const [extraCost, setExtraCost] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('Unissex');
  const [tipo, setTipo] = useState('Importado');
  const [volume, setVolume] = useState('100ml');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // AI Enrichment States
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

  const activeTrip = trips.find(t => t.id === selectedTrip);

  const results = useMemo(() => {
    const costU = parseFloat(priceUSD.replace(',', '.')) || 0;
    const marg = parseFloat(margin.replace(',', '.')) || 0;
    const extra = parseFloat(extraCost.replace(',', '.')) || 0;

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerateAI = async () => {
    if (!name) return alert('Digite o nome do perfume primeiro para a IA buscar os detalhes.');
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
    } catch (error: any) {
      alert(error.message || 'Erro ao gerar dados via IA.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!selectedTrip || !name || !priceUSD) return alert('Preencha os campos obrigatórios');
    setLoading(true);

    const costU = parseFloat(priceUSD.replace(',', '.'));
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
      preco_venda_brl: customPrice ? parseFloat(customPrice.replace(',', '.')) : null,
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
    setImagePreview(p.imagem_url || '');
    
    // IA Fields
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

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setName('');
    setPriceUSD('');
    setExtraCost('');
    setCustomPrice('');
    setQuantity('1');
    setImageFile(null);
    setImagePreview('');
    setCategory('Unissex');
    setVolume('100ml');
    
    // IA Fields
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

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulário de Produto */}
        <Card className="bg-white shadow-sm border-brand-brown/10 flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-brand-brown">
              {editingProduct ? 'Editar Produto' : 'Novo Produto (Estoque)'}
            </CardTitle>
            <CardDescription className="text-brand-brown/70">
              {editingProduct ? 'Altere as informações do produto selecionado.' : 'Adicione produtos e defina seu valor de venda personalizado.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            
            {/* Base Fields */}
            <div className="space-y-2">
              <Label className="text-brand-brown">Nome do Produto</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Package className="absolute left-3 top-2.5 h-4 w-4 text-brand-brown/50" />
                  <Input 
                    type="text"
                    placeholder="Ex: Bleu de Chanel" 
                    className="pl-9 border-brand-brown/20 focus-visible:ring-brand-brown text-brand-brown"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleGenerateAI} 
                  disabled={generatingAI || !name} 
                  variant="outline" 
                  className="border-purple-200 text-purple-700 hover:bg-purple-50 transition-all flex items-center gap-2"
                >
                  <Sparkles className={`w-4 h-4 ${generatingAI ? 'animate-spin' : ''}`} />
                  {generatingAI ? 'Mágica em andamento...' : 'Gerar IA'}
                </Button>
              </div>
            </div>

            {/* AI Generated Fields Area */}
            {(notasTopo || familiaOlfativa || generatingAI) && (
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Lumi AI Enricher</span>
                </div>
                
                {generatingAI ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-purple-200/50 rounded w-full"></div>
                    <div className="h-4 bg-purple-200/50 rounded w-3/4"></div>
                    <div className="h-4 bg-purple-200/50 rounded w-5/6"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-brand-brown/60">Família Olfativa</Label>
                        <Input value={familiaOlfativa} onChange={(e) => setFamiliaOlfativa(e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-brand-brown/60">Ocasião</Label>
                        <Input value={ocasiao} onChange={(e) => setOcasiao(e.target.value)} className="h-8 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-brand-brown/60">Notas de Topo</Label>
                      <Input value={notasTopo} onChange={(e) => setNotasTopo(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-brand-brown/60">Notas de Coração</Label>
                      <Input value={notasCoracao} onChange={(e) => setNotasCoracao(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-brand-brown/60">Notas de Fundo</Label>
                      <Input value={notasFundo} onChange={(e) => setNotasFundo(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-brand-brown/60">Descrição Comercial (IA)</Label>
                      <textarea 
                        value={descricaoIa} 
                        onChange={(e) => setDescricaoIa(e.target.value)} 
                        className="w-full text-sm p-2 rounded-md border border-purple-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-brand-brown/60">Inspirado Em (Contratipo/Árabe) - Opcional</Label>
                      <Input value={inspiradoEm} onChange={(e) => setInspiradoEm(e.target.value)} placeholder="Ex: Creed Aventus" className="h-8 text-sm" />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-brand-brown">Origem</Label>
                <select 
                  value={tipo} 
                  onChange={(e) => setTipo(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-brand-brown/20 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown text-brand-brown"
                >
                  <option value="Importado">Importado</option>
                  <option value="Árabe">Árabe</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-brand-brown">Categoria</Label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-brand-brown/20 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown text-brand-brown"
                >
                  <option value="Unissex">Unissex</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-brand-brown">Volume</Label>
                <Input 
                  type="text" 
                  placeholder="Ex: 100ml, 200ml" 
                  className="border-brand-brown/20 focus-visible:ring-brand-brown text-brand-brown h-10"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-brand-brown">Viagem/Cotação</Label>
                <select 
                  value={selectedTrip} 
                  onChange={(e) => setSelectedTrip(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-brand-brown/20 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown text-brand-brown"
                >
                  <option value="">Selecione...</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      {new Date(t.data).toLocaleDateString()} - Cot: {formatCurrency(t.cotacao_dolar)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-brand-brown">Imagem do Produto</Label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-md border border-brand-brown/20" />
                )}
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="border-brand-brown/20 focus-visible:ring-brand-brown text-brand-brown cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 bg-orange-50/50 p-3 rounded-md border border-orange-100">
              <input 
                type="checkbox" 
                id="mais_vendido"
                checked={maisVendido}
                onChange={(e) => setMaisVendido(e.target.checked)}
                className="h-4 w-4 rounded border-orange-200 text-orange-500 focus:ring-orange-500"
              />
              <Label htmlFor="mais_vendido" className="text-orange-700 font-medium flex items-center gap-1.5 cursor-pointer text-sm">
                <Flame className="w-4 h-4 text-orange-500" />
                Destacar como "Mais Vendido"
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-brand-brown">Custo (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-brand-brown/50" />
                  <Input 
                    type="text" 
                    inputMode="decimal"
                    placeholder="0.00" 
                    className="pl-9 border-brand-brown/20 focus-visible:ring-brand-brown text-brand-brown"
                    value={priceUSD}
                    onChange={(e) => setPriceUSD(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-brand-brown">Custo Extra Unit. (BRL)</Label>
                <div className="relative">
                  <Plus className="absolute left-3 top-2.5 h-4 w-4 text-brand-brown/50" />
                  <Input 
                    type="text" 
                    inputMode="decimal"
                    placeholder="0.00" 
                    className="pl-9 border-brand-brown/20 focus-visible:ring-brand-brown text-brand-brown"
                    value={extraCost}
                    onChange={(e) => setExtraCost(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-brand-brown">Margem Ref. (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 h-4 w-4 text-brand-brown/50" />
                  <Input 
                    type="text" 
                    inputMode="decimal"
                    placeholder="30" 
                    className="pl-9 border-brand-brown/20 focus-visible:ring-brand-brown text-brand-brown"
                    value={margin}
                    onChange={(e) => setMargin(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <Label className="text-brand-brown">Preço Final de Venda (BRL)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-brand-brown/50" />
                  <Input 
                    type="text" 
                    inputMode="decimal"
                    placeholder="Seu valor personalizado" 
                    className="pl-9 border-brand-brown/20 focus-visible:ring-brand-brown text-brand-brown"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-brand-brown">Quantidade Comprada</Label>
              <Input 
                type="number" 
                className="border-brand-brown/20 focus-visible:ring-brand-brown text-brand-brown"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleSaveProduct} disabled={loading || !activeTrip} className="flex-1 bg-brand-brown hover:bg-brand-brown/90 text-brand-bg transition-colors">
                {loading ? 'Salvando...' : (editingProduct ? 'Salvar Alterações' : 'Adicionar ao Estoque')}
              </Button>
              {editingProduct && (
                <Button onClick={handleCancelEdit} variant="outline" className="border-brand-brown/20 text-brand-brown hover:bg-brand-brown/10">
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resultado / Lista */}
        <div className="space-y-6 flex flex-col">
          <Card className="flex-1 bg-brand-bg border-brand-brown/10 shadow-sm">
            <CardHeader>
              <CardTitle className="text-brand-brown">Simulação Rápida</CardTitle>
              <CardDescription className="text-brand-brown/70">Valores de referência. Se o Preço Final não for preenchido, usaremos a Margem.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b border-brand-brown/10 pb-4">
                <span className="text-sm font-medium text-brand-brown/80">Custo Total Final (Unit - BRL)</span>
                <span className="text-lg font-semibold text-brand-brown">
                  {formatCurrency(results.costBRL)}
                </span>
              </div>
              
              <div className="flex items-center justify-between border-b border-brand-brown/10 pb-4">
                <span className="text-sm font-medium text-brand-brown/80">Lucro Bruto Sugerido (BRL)</span>
                <span className="text-lg font-semibold text-emerald-700">
                  {formatCurrency(results.grossProfit)}
                </span>
              </div>

              <div className="rounded-xl bg-white border border-brand-brown/20 p-6 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-sm font-medium text-brand-brown/80 mb-1">Preço Sugerido (Pela Margem)</p>
                  <div className="text-4xl font-extrabold tracking-tight text-brand-brown opacity-50">
                    {formatCurrency(results.suggestedPrice)}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-brand-brown border border-brand-brown p-6 shadow-sm relative overflow-hidden mt-4">
                <div className="relative z-10">
                  <p className="text-sm font-medium text-brand-bg/80 mb-1">Seu Preço de Venda Real</p>
                  <div className="text-4xl font-extrabold tracking-tight text-brand-bg">
                    {customPrice ? formatCurrency(parseFloat(customPrice.replace(',', '.'))) : formatCurrency(results.suggestedPrice)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lista de Produtos Cadastrados */}
      <Card className="bg-white border-brand-brown/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-brand-brown">Produtos Cadastrados</CardTitle>
          <CardDescription className="text-brand-brown/70">Gerencie o estoque, altere preços e atualize fotos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-brand-brown/80">
              <thead className="text-xs uppercase bg-brand-bg text-brand-brown/60">
                <tr>
                  <th className="px-4 py-3 rounded-tl-md">Foto</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Custo BRL</th>
                  <th className="px-4 py-3">Preço Venda</th>
                  <th className="px-4 py-3">Estoque</th>
                  <th className="px-4 py-3 text-right rounded-tr-md">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-brand-brown/50">
                      Nenhum produto cadastrado no momento.
                    </td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} className="border-b border-brand-brown/5 hover:bg-brand-bg/50 transition-colors">
                      <td className="px-4 py-3">
                        {p.imagem_url ? (
                          <img src={p.imagem_url} alt={p.nome} className="w-10 h-10 object-cover rounded-md border border-brand-brown/10" />
                        ) : (
                          <div className="w-10 h-10 bg-brand-bg flex items-center justify-center rounded-md border border-brand-brown/10">
                            <Package className="w-5 h-5 text-brand-brown/30" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-brand-brown">
                        <div className="flex items-center gap-2">
                          {p.nome}
                          {p.mais_vendido && <span title="Mais Vendido"><Flame className="w-4 h-4 text-orange-500" /></span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-brown/60">
                        {p.tipo === 'Árabe' ? 'Árabe' : 'Importado'}
                      </td>
                      <td className="px-4 py-3">{p.categoria || '-'}</td>
                      <td className="px-4 py-3 font-medium text-brand-brown/70">{formatCurrency(p.custo_final_brl)}</td>
                      <td className="px-4 py-3 font-bold text-brand-brown">
                        {p.preco_venda_brl ? formatCurrency(p.preco_venda_brl) : formatCurrency(p.custo_final_brl * 1.30)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.estoque > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {p.estoque} un
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditProduct(p)} className="border-brand-brown/20 text-brand-brown hover:bg-brand-brown hover:text-brand-bg h-8 px-3">
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(p.id)} className="border-red-200 text-red-600 hover:bg-red-600 hover:text-white h-8 px-3">
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
