import { CheckCircle2, DollarSign, Flame, Globe, Package, Wind, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';

export type SortOption = 'Mais Vendidos' | 'Menor Preço' | 'Maior Preço';

export type CatalogFilters = {
  search: string;
  categoria: string;
  tipo: string;
  precoFaixa: string;
  ordenacao: SortOption;
  familiaOlfativa: string;
  ocasiao: string;
  apenasDisponiveis: boolean;
};

export const POCKET_COLLECTION_FILTER = 'Brand Collection 30ml';

const SORT_OPTIONS: SortOption[] = ['Mais Vendidos', 'Menor Preço', 'Maior Preço'];
const CATEGORIA_OPTIONS = ['Todos', 'Masculino', 'Feminino', 'Unissex'];
const TIPO_OPTIONS = ['Todos', 'Árabe', 'Importado', POCKET_COLLECTION_FILTER];
const PRECO_OPTIONS = ['Todos', 'Até R$300', 'R$300 - R$600', 'Acima de R$600'];
const FAMILIA_OPTIONS = [
  'Todos',
  'Amadeirado',
  'Oriental',
  'Floral',
  'Cítrico',
  'Gourmand',
  'Especiado',
  'Aromático',
  'Aquático',
];

interface FilterPanelProps {
  filters: CatalogFilters;
  onChange: <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => void;
  onClear: () => void;
}

export function FilterPanel({ filters, onChange, onClear }: FilterPanelProps) {
  const hasActiveFilters =
    filters.categoria !== 'Todos' ||
    filters.tipo !== 'Todos' ||
    filters.precoFaixa !== 'Todos' ||
    filters.familiaOlfativa !== 'Todos' ||
    filters.ocasiao !== 'Todos' ||
    filters.apenasDisponiveis;

  return (
    <div className="space-y-6">
      {/* Disponibilidade - Pronta Entrega */}
      <label
        htmlFor="filter-apenas-disponiveis"
        className="flex items-center justify-between p-3 rounded-xl bg-brand-surface border border-brand-brown/10 shadow-sm cursor-pointer hover:border-brand-brown/25 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className={`w-4 h-4 transition-colors ${filters.apenasDisponiveis ? 'text-emerald-700' : 'text-brand-brown/40'}`} />
          <span className="text-xs font-semibold text-brand-brown">Apenas Pronta Entrega</span>
        </div>
        <input
          id="filter-apenas-disponiveis"
          type="checkbox"
          checked={filters.apenasDisponiveis}
          onChange={(event) => onChange('apenasDisponiveis', event.target.checked)}
          className="h-4 w-4 rounded border-brand-brown/30 text-brand-brown focus:ring-brand-brown cursor-pointer"
        />
      </label>

      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={onClear}
          className="w-full border-brand-brown/20 text-brand-brown/70 hover:bg-brand-surface text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 rounded-xl h-10"
        >
          <X className="w-3 h-3" /> Limpar Filtros
        </Button>
      )}

      {/* Ordenação */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-brown/50 flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-amber-700" /> Ordenar
        </h3>
        <Select
          value={filters.ordenacao}
          onChange={(event) => onChange('ordenacao', event.target.value as SortOption)}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>
      </div>

      <div className="h-px bg-brand-brown/5 w-full" />

      {/* Família Olfativa */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-brown/50 flex items-center gap-2">
          <Wind className="w-3.5 h-3.5 text-brand-brown/60" /> Família Olfativa
        </h3>
        <Select
          value={filters.familiaOlfativa}
          onChange={(event) => onChange('familiaOlfativa', event.target.value)}
        >
          {FAMILIA_OPTIONS.map(familia => (
            <option key={familia} value={familia}>
              {familia === 'Todos' ? 'Todas as famílias' : familia}
            </option>
          ))}
        </Select>
      </div>

      <div className="h-px bg-brand-brown/5 w-full" />

      {/* Origem e Linha */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-brown/50 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-brand-brown/60" /> Origem e Linha
        </h3>
        <div className="flex flex-col gap-2.5">
          {TIPO_OPTIONS.map(tipo => (
            <button
              key={tipo}
              onClick={() => onChange('tipo', tipo)}
              className="flex items-center gap-2.5 cursor-pointer group text-left"
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.tipo === tipo ? 'border-brand-brown bg-brand-brown' : 'border-brand-brown/30 group-hover:border-brand-brown/60'}`}>
                {filters.tipo === tipo && <div className="w-1.5 h-1.5 bg-brand-bg rounded-full" />}
              </div>
              <span className={`text-xs ${filters.tipo === tipo ? 'font-semibold text-brand-brown' : 'text-brand-brown/70 group-hover:text-brand-brown'}`}>{tipo}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-brand-brown/5 w-full" />

      {/* Categoria / Gênero */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-brown/50 flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-brand-brown/60" /> Categoria
        </h3>
        <div className="flex flex-col gap-2.5">
          {CATEGORIA_OPTIONS.map(cat => (
            <button
              key={cat}
              onClick={() => onChange('categoria', cat)}
              className="flex items-center gap-2.5 cursor-pointer group text-left"
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.categoria === cat ? 'border-brand-brown bg-brand-brown' : 'border-brand-brown/30 group-hover:border-brand-brown/60'}`}>
                {filters.categoria === cat && <div className="w-1.5 h-1.5 bg-brand-bg rounded-full" />}
              </div>
              <span className={`text-xs ${filters.categoria === cat ? 'font-semibold text-brand-brown' : 'text-brand-brown/70 group-hover:text-brand-brown'}`}>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-brand-brown/5 w-full" />

      {/* Faixa de Preço */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-brown/50 flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-brand-brown/60" /> Faixa de Preço
        </h3>
        <div className="flex flex-col gap-2.5">
          {PRECO_OPTIONS.map(faixa => (
            <button
              key={faixa}
              onClick={() => onChange('precoFaixa', faixa)}
              className="flex items-center gap-2.5 cursor-pointer group text-left"
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.precoFaixa === faixa ? 'border-brand-brown bg-brand-brown' : 'border-brand-brown/30 group-hover:border-brand-brown/60'}`}>
                {filters.precoFaixa === faixa && <div className="w-1.5 h-1.5 bg-brand-bg rounded-full" />}
              </div>
              <span className={`text-xs ${filters.precoFaixa === faixa ? 'font-semibold text-brand-brown' : 'text-brand-brown/70 group-hover:text-brand-brown'}`}>{faixa}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
