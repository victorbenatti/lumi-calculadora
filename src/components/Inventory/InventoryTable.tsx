import { useMemo, useState } from 'react';
import { Flame, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Pagination } from '../Pagination';
import type { Database } from '../../types/supabase';
import { formatCurrency } from '../../utils/parsing';

type Product = Database['public']['Tables']['produtos']['Row'];

interface InventoryTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const PRODUCTS_PER_PAGE = 15;

type SortOption = 'nome' | 'maior-estoque' | 'menor-estoque' | 'maior-preco' | 'menor-preco';

const getEffectivePrice = (product: Product) => product.preco_venda_brl || (product.custo_final_brl * 2);

export function InventoryTable({ products, onEdit, onDelete }: InventoryTableProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [tipoFilter, setTipoFilter] = useState('Todos');
  const [sortOption, setSortOption] = useState<SortOption>('nome');
  const [page, setPage] = useState(1);
  const [filterKey, setFilterKey] = useState('|Todas|Todos|nome');

  const categories = useMemo(() => {
    const unique = new Set(
      products
        .map(product => product.categoria?.trim())
        .filter((value): value is string => Boolean(value))
    );

    return ['Todas', ...Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [products]);

  const tipos = useMemo(() => {
    const unique = new Set(
      products
        .map(product => product.tipo?.trim())
        .filter((value): value is string => Boolean(value))
    );

    return ['Todos', ...Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    const filtered = products.filter(product => {
      const matchesName = !searchTerm || product.nome.toLowerCase().includes(searchTerm);
      const matchesCategory = categoryFilter === 'Todas' || product.categoria === categoryFilter;
      const matchesTipo = tipoFilter === 'Todos' || product.tipo === tipoFilter;

      return matchesName && matchesCategory && matchesTipo;
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === 'maior-estoque') return b.estoque - a.estoque;
      if (sortOption === 'menor-estoque') return a.estoque - b.estoque;
      if (sortOption === 'maior-preco') return getEffectivePrice(b) - getEffectivePrice(a);
      if (sortOption === 'menor-preco') return getEffectivePrice(a) - getEffectivePrice(b);
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }, [products, search, categoryFilter, tipoFilter, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));

  // Reseta a página ao trocar filtros/ordenação (ajuste de estado durante a renderização, sem efeito).
  const currentFilterKey = `${search}|${categoryFilter}|${tipoFilter}|${sortOption}`;
  if (currentFilterKey !== filterKey) {
    setFilterKey(currentFilterKey);
    if (page !== 1) setPage(1);
  }

  const currentPage = Math.min(page, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const visiblePageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const startPage = Math.max(1, Math.min(currentPage - Math.floor(maxVisiblePages / 2), totalPages - maxVisiblePages + 1));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }, [currentPage, totalPages]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-brand-brown">Produtos Cadastrados</CardTitle>
        <CardDescription className="text-brand-brown/70">
          Gerencie o estoque, altere preços e atualize fotos. Exibindo {filteredProducts.length} de {products.length} produtos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_200px]">
          <div className="space-y-2">
            <Label className="text-brand-brown">Pesquisar por nome</Label>
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ex: Yara, Asad, Club de Nuit..."
              className="border-brand-brown/20 text-brand-brown"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-brand-brown">Categoria</Label>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-brand-brown">Origem / Linha</Label>
            <Select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
            >
              {tipos.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-brand-brown">Ordenar por</Label>
            <Select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
            >
              <option value="nome">Nome (A-Z)</option>
              <option value="maior-estoque">Maior quantidade</option>
              <option value="menor-estoque">Menor quantidade</option>
              <option value="maior-preco">Maior preço</option>
              <option value="menor-preco">Menor preço</option>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-brand-brown/80">
            <thead className="text-[11px] font-semibold uppercase tracking-[0.08em] bg-brand-sand/50 text-brand-brown/60">
              <tr>
                <th className="px-4 py-3 rounded-tl-md">Foto</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Custo BRL</th>
                <th className="px-4 py-3">Preço Venda</th>
                <th className="px-4 py-3">Promoção</th>
                <th className="px-4 py-3">Estoque</th>
                <th className="px-4 py-3 text-right rounded-tr-md">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-brand-brown/50">
                    Nenhum produto cadastrado no momento.
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-brand-brown/50">
                    Nenhum produto encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(p => (
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
                      {p.tipo || 'Importado'}
                    </td>
                    <td className="px-4 py-3">{p.categoria || '-'}</td>
                    <td className="px-4 py-3 font-medium text-brand-brown/70">{formatCurrency(p.custo_final_brl)}</td>
                    <td className="px-4 py-3 font-bold text-brand-brown">
                      {p.preco_venda_brl ? formatCurrency(p.preco_venda_brl) : formatCurrency(getEffectivePrice(p))}
                    </td>
                    <td className="px-4 py-3">
                      {p.promocao_ativa && p.preco_promocao_brl ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-rose-700">
                            {formatCurrency(p.preco_promocao_brl)}
                          </span>
                          <span className="w-max rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-800">
                            Ativa
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-brand-brown/35">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.estoque > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {p.estoque} un
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => onEdit(p)} className="border-brand-brown/20 text-brand-brown hover:bg-brand-brown hover:text-brand-bg h-8 px-3">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onDelete(p.id)} className="border-red-200 text-red-600 hover:bg-red-600 hover:text-white h-8 px-3">
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          visiblePageNumbers={visiblePageNumbers}
          onPageChange={setPage}
        />
      </CardContent>
    </Card>
  );
}
