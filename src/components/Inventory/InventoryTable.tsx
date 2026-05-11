import { useMemo, useState } from 'react';
import { Flame, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import type { Database } from '../../types/supabase';
import { formatCurrency } from '../../utils/parsing';

type Product = Database['public']['Tables']['produtos']['Row'];

interface InventoryTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function InventoryTable({ products, onEdit, onDelete }: InventoryTableProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');

  const categories = useMemo(() => {
    const unique = new Set(
      products
        .map(product => product.categoria?.trim())
        .filter((value): value is string => Boolean(value))
    );

    return ['Todas', ...Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return products.filter(product => {
      const matchesName = !searchTerm || product.nome.toLowerCase().includes(searchTerm);
      const matchesCategory = categoryFilter === 'Todas' || product.categoria === categoryFilter;

      return matchesName && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  return (
    <Card className="bg-white border-brand-brown/10 shadow-sm">
      <CardHeader>
        <CardTitle className="text-brand-brown">Produtos Cadastrados</CardTitle>
        <CardDescription className="text-brand-brown/70">
          Gerencie o estoque, altere preços e atualize fotos. Exibindo {filteredProducts.length} de {products.length} produtos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
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
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-brand-brown/20 bg-background px-3 py-2 text-sm text-brand-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

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
                filteredProducts.map(p => (
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
                      {p.preco_venda_brl ? formatCurrency(p.preco_venda_brl) : formatCurrency(p.custo_final_brl * 1.30)}
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
      </CardContent>
    </Card>
  );
}
