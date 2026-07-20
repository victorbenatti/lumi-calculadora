import { DollarSign, Info, RefreshCcw } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { formatCurrency } from '../utils/parsing';

interface ExchangeRateCardProps {
  rate: number | null;
  rateLoading: boolean;
  rateError: string | null;
  lastUpdated: Date | null;
  isManualFallback: boolean;
  manualRateInput: string;
  onManualRateChange: (value: string) => void;
  onRefetch: () => void;
}

export function ExchangeRateCard({
  rate,
  rateLoading,
  rateError,
  lastUpdated,
  isManualFallback,
  manualRateInput,
  onManualRateChange,
  onRefetch,
}: ExchangeRateCardProps) {
  const formattedRate = rate ? formatCurrency(rate) : '---';
  const timeString = lastUpdated ? lastUpdated.toLocaleTimeString('pt-BR') : '---';

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-brand-sand/60 p-3 text-brand-brown">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-brown/45">Cotação USD → BRL</p>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-brand-brown">
                {rateLoading && !rate ? "Calculando..." : formattedRate}
              </h2>
              {!rateLoading && (
                <span className="text-xs font-medium text-brand-brown/55">
                  Atualizado às {timeString}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {rateError && (
            <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
              <Info className="h-3 w-3" />
              API Falhou
            </div>
          )}

          <div className="flex items-center gap-2">
            {isManualFallback || rateError ? (
              <Input
                type="text"
                inputMode="decimal"
                className="h-9 w-24 border-brand-brown/30 bg-white text-brand-brown"
                placeholder="Manual"
                value={manualRateInput}
                onChange={(e) => onManualRateChange(e.target.value)}
              />
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={onRefetch}
              disabled={rateLoading}
              className="bg-brand-bg hover:bg-brand-brown/10 text-brand-brown border-brand-brown/20 lg:hidden"
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${rateLoading ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
