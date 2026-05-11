import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import { BadgePercent, CheckCircle2, DollarSign, Flame, Package, Percent, Plus, Sparkles } from 'lucide-react';
import type { Database } from '../../types/supabase';
import { formatCurrency } from '../../utils/parsing';
import { ImageUploader } from './ImageUploader';
import type { InventoryFormState } from './useInventoryForm';

type Trip = Database['public']['Tables']['viagens']['Row'];

const PRODUCT_TYPE_OPTIONS = ['Importado', 'Árabe', 'Brand Collection', 'Contratipo'];

interface ProductFormProps {
  trips: Trip[];
  form: InventoryFormState;
}

export function ProductForm({ trips, form }: ProductFormProps) {
  const {
    selectedTrip, setSelectedTrip,
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
    loading, generatingAI, editingProduct, saveFeedback, activeTrip,
    handleGenerateAI, handleSaveProduct, handleCancelEdit,
  } = form;

  return (
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
        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Lumi AI Enricher</span>
            </div>
            <p className="text-xs text-brand-brown/50">Preencha manualmente ou use Gerar IA para completar estes campos.</p>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-brand-brown">Origem / Linha</Label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="flex h-10 w-full rounded-md border border-brand-brown/20 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown text-brand-brown"
            >
              {PRODUCT_TYPE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
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

        <ImageUploader preview={imagePreview} onChange={handleImageChange} />

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

        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BadgePercent className="h-4 w-4 text-rose-700" />
                <Label htmlFor="promocao_ativa" className="text-sm font-bold text-rose-900">
                  Promoção ativa
                </Label>
              </div>
              <p className="text-xs text-rose-900/60">
                Quando ativo, o catálogo, carrinho e campanhas usam este valor.
              </p>
            </div>
            <input
              type="checkbox"
              id="promocao_ativa"
              checked={promotionActive}
              onChange={(e) => setPromotionActive(e.target.checked)}
              className="h-5 w-5 rounded border-rose-300 text-rose-700 focus:ring-rose-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-rose-950">Preço Promocional (BRL)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-rose-700/60" />
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 249,90"
                className="pl-9 border-rose-200 bg-white text-rose-950 focus-visible:ring-rose-500"
                value={promotionPrice}
                onChange={(e) => setPromotionPrice(e.target.value)}
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

        {saveFeedback && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-sm"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-bold">
                {saveFeedback.mode === 'created' ? 'Produto cadastrado com sucesso' : 'Produto atualizado com sucesso'}
              </p>
              <p className="text-xs text-emerald-900/70">
                {saveFeedback.productName} já está salvo no estoque.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
