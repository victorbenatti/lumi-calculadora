import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    
    if (error) {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
    } else {
      navigate('/admin', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 selection:bg-brand-brown selection:text-brand-bg">
      <Card className="w-full max-w-md bg-white border-brand-brown/10 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center space-y-4 pt-10 pb-4">
          <div className="mx-auto w-28 h-28 bg-white rounded-2xl shadow-sm border border-brand-brown/10 flex items-center justify-center overflow-hidden">
            <img 
              src="/LOGO-HD.jpeg" 
              alt="Logo Lumi" 
              className="w-full h-full object-contain p-2" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          <div>
            <CardTitle className="text-3xl font-extrabold text-brand-brown tracking-tight">Área Restrita</CardTitle>
            <p className="text-sm font-medium text-brand-brown/60 mt-1">Gestão da Lumi Imports Store</p>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-bold text-brand-brown">E-mail Administrativo</label>
              <Input 
                type="email" 
                placeholder="seu@email.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="border-brand-brown/20 focus-visible:ring-brand-brown h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-brand-brown">Senha</label>
              <Input 
                type="password" 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="border-brand-brown/20 focus-visible:ring-brand-brown h-12 rounded-xl"
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-brand-brown hover:bg-[#2A1D15] text-brand-bg h-12 rounded-xl text-base font-bold shadow-lg shadow-brand-brown/20 transition-all"
            >
              {loading ? 'Validando...' : 'Entrar no Sistema'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
