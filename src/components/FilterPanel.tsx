import { DollarSign, Flame, Globe, Package, X } from 'lucide-react';
import { Button } from './ui/Button';

export type SortOption = 'Mais Vendidos' | 'Menor Preço' | 'Maior Preço';

export type CatalogFilters = {
  search: string;
  categoria: string;
  tipo: string;
  precoFaixa: string;
  ordenacao: SortOption;
};

export const POCKET_COLLECTION_FILTER = 'Brand Collection 30ml';

const SORT_OPTIONS: SortOption[] = ['Mais Vendidos', 'Menor Preço', 'Maior Preço'];
const CATEGORIA_OPTIONS = ['Todos', 'Masculino', 'Feminino', 'Unissex'];
const TIPO_OPTIONS = ['Todos', 'Importado', 'Árabe', POCKET_COLLECTION_FILTER];
const PRECO_OPTIONS = ['Todos', 'Até R$300', 'R$300 - R$600', 'Acima de R$600'];

interface FilterPanelProps {
  filters: CatalogFilters;
  onChange: <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => void;
  onClear: () => void;
}

export function FilterPanel({ filters, onChange, onClear }: FilterPanelProps) {
  const hasActiveFilters =
    filters.categoria !== 'Todos' ||
    filters.tipo !== 'Todos' ||
    filters.precoFaixa !== 'Todos';

  return (
    <div className="space-y-8">
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={onClear}
          className="w-full border-brand-brown/20 text-brand-brown/70 hover:bg-stone-50 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 rounded-xl h-10"
        >
          <X className="w-3 h-3" /> Limpar Filtros
        </Button>
      )}

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-brown/50 flex items-center gap-2">
          <Flame className="w-3.5 h-3.5" /> Ordenar
        </h3>
        <select
          value={filters.ordenacao}
          onChange={(event) => onChange('ordenacao', event.target.value as SortOption)}
          className="h-11 w-full rounded-xl border border-brand-brown/10 bg-white px-3 text-sm font-semibold text-brand-brown shadow-sm outline-none transition-colors focus:border-brand-brown/30 focus:ring-2 focus:ring-brand-brown/10"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="h-px bg-brand-brown/5 w-full" />

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-brown/50 flex items-center gap-2">
          <Package className="w-3.5 h-3.5" /> Categoria
        </h3>
        <div className="flex flex-col gap-3">
          {CATEGORIA_OPTIONS.map(cat => (
            <button
              key={cat}
              onClick={() => onChange('categoria', cat)}
              className="flex items-center gap-3 cursor-pointer group text-left"
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.categoria === cat ? 'border-brand-brown bg-brand-brown' : 'border-brand-brown/30 group-hover:border-brand-brown/60'}`}>
                {filters.categoria === cat && <div className="w-1.5 h-1.5 bg-brand-bg rounded-full" />}
              </div>
              <span className={`text-sm ${filters.categoria === cat ? 'font-semibold text-brand-brown' : 'text-brand-brown/70 group-hover:text-brand-brown'}`}>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-brand-brown/5 w-full" />

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-brown/50 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" /> Origem e Linha
        </h3>
        <div className="flex flex-col gap-3">
          {TIPO_OPTIONS.map(tipo => (
            <button
              key={tipo}
              onClick={() => onChange('tipo', tipo)}
              className="flex items-center gap-3 cursor-pointer group text-left"
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.tipo === tipo ? 'border-brand-brown bg-brand-brown' : 'border-brand-brown/30 group-hover:border-brand-brown/60'}`}>
                {filters.tipo === tipo && <div className="w-1.5 h-1.5 bg-brand-bg rounded-full" />}
              </div>
              <span className={`text-sm ${filters.tipo === tipo ? 'font-semibold text-brand-brown' : 'text-brand-brown/70 group-hover:text-brand-brown'}`}>{tipo}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-brand-brown/5 w-full" />

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-brown/50 flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5" /> Faixa de Preço
        </h3>
        <div className="flex flex-col gap-3">
          {PRECO_OPTIONS.map(faixa => (
            <button
              key={faixa}
              onClick={() => onChange('precoFaixa', faixa)}
              className="flex items-center gap-3 cursor-pointer group text-left"
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.precoFaixa === faixa ? 'border-brand-brown bg-brand-brown' : 'border-brand-brown/30 group-hover:border-brand-brown/60'}`}>
                {filters.precoFaixa === faixa && <div className="w-1.5 h-1.5 bg-brand-bg rounded-full" />}
              </div>
              <span className={`text-sm ${filters.precoFaixa === faixa ? 'font-semibold text-brand-brown' : 'text-brand-brown/70 group-hover:text-brand-brown'}`}>{faixa}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
