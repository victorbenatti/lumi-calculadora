import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Trip = Database['public']['Tables']['viagens']['Row'];

interface Props {
  trips: Trip[];
  refetch: () => void;
  exchangeRate: number | null;
}

export function TripManagement({ trips, refetch, exchangeRate }: Props) {
  const [date, setDate] = useState('');
  const [logisticsCost, setLogisticsCost] = useState('1600.00'); // default flight cost
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // NEW

  const handleAddTrip = async () => {
    if (!exchangeRate) return alert('Cotação USD necessária para registrar a viagem');
    setLoading(true);
    setErrorMessage('');
    
    // Tratativa extra de virgula
    const formattedCost = logisticsCost.replace('.', '').replace(',', '.'); // previne 1.600,00 virar 1
    const costNum = parseFloat(formattedCost) || parseFloat(logisticsCost.replace(',', '.')) || 1600;

    const payload = {
      data: date ? date : new Date().toISOString().split('T')[0],
      custo_logistica: costNum,
      cotacao_dolar: exchangeRate,
      status: 'ativa' as const
    };

    const { error } = await supabase.from('viagens').insert(payload);
    
    setLoading(false);
    if (error) {
       console.error("Supabase Insert Error:", error);
       setErrorMessage(error.message + " | Detalhes: " + error.details + " | Hint: " + error.hint);
       alert('Erro ao criar viagem: ' + error.message);
    } else {
      setDate('');
      refetch();
    }
  };

  const handleCloseTrip = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ativa' ? 'finalizada' : 'ativa';
    await supabase.from('viagens').update({ status: newStatus }).eq('id', id);
    refetch();
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border-brand-brown/10">
        <CardHeader>
          <CardTitle className="text-brand-brown">Nova Viagem ao Paraguai</CardTitle>
          <CardDescription className="text-brand-brown/70">Registre os custos de logística para rateio nos produtos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-brand-brown">Data da Viagem</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-brand-brown/20 focus-visible:ring-brand-brown text-brand-brown" />
            </div>
            <div className="space-y-2">
              <Label className="text-brand-brown">Custo de Logística (R$ Voo/Onibus)</Label>
              <Input type="text" inputMode="decimal" value={logisticsCost} onChange={(e) => setLogisticsCost(e.target.value)} className="border-brand-brown/20 focus-visible:ring-brand-brown text-brand-brown" />
            </div>
          </div>
          
          {errorMessage && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <b>Mensagem do Supabase:</b> {errorMessage}
            </div>
          )}

          <Button onClick={handleAddTrip} disabled={loading} className="w-full bg-brand-brown hover:bg-brand-brown/90 text-brand-bg transition-colors">
            {loading ? 'Salvando...' : 'Registrar Viagem'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border-brand-brown/10">
        <CardHeader>
          <CardTitle className="text-brand-brown">Histórico de Viagens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-brand-brown/70 uppercase border-b border-brand-brown/10">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Cotação Dólar</th>
                  <th className="px-4 py-3">Logística BRL</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody className="text-brand-brown divide-y divide-brand-brown/5">
                {trips.map(trip => (
                  <tr key={trip.id}>
                    <td className="px-4 py-3">{new Date(trip.data).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{formatCurrency(trip.cotacao_dolar)}</td>
                    <td className="px-4 py-3">{formatCurrency(trip.custo_logistica)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${trip.status === 'ativa' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                        {trip.status === 'ativa' ? 'Ativa' : 'Fechada'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" onClick={() => handleCloseTrip(trip.id, trip.status)}>
                        {trip.status === 'ativa' ? 'Fechar' : 'Reabrir'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {trips.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-brand-brown/50">Nenhuma viagem registrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
