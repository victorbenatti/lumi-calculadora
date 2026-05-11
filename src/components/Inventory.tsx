import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import type { Database } from '../types/supabase';
import { formatCurrency, parseDecimalInput } from '../utils/parsing';
import { ProductForm } from './Inventory/ProductForm';
import { InventoryTable } from './Inventory/InventoryTable';
import { useInventoryForm } from './Inventory/useInventoryForm';

type Trip = Database['public']['Tables']['viagens']['Row'];
type Product = Database['public']['Tables']['produtos']['Row'];

interface Props {
  trips: Trip[];
  products: Product[];
  refetch: () => void;
}

export function Inventory({ trips, products, refetch }: Props) {
  const form = useInventoryForm({ trips, refetch });
  const { results, customPrice, promotionActive, promotionPrice } = form;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <ProductForm trips={trips} form={form} />

        {/* Simulação Rápida */}
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
                    {customPrice ? formatCurrency(parseDecimalInput(customPrice)) : formatCurrency(results.suggestedPrice)}
                  </div>
                </div>
              </div>

              {promotionActive && promotionPrice && (
                <div className="rounded-xl bg-rose-700 border border-rose-700 p-6 shadow-sm relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-rose-50/80 mb-1">Preço Promocional Ativo</p>
                    <div className="text-4xl font-extrabold tracking-tight text-white">
                      {formatCurrency(parseDecimalInput(promotionPrice))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <InventoryTable
        products={products}
        onEdit={form.handleEditProduct}
        onDelete={form.handleDeleteProduct}
      />
    </div>
  );
}
