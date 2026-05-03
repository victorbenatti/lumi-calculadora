import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useCustomer } from '../contexts/customer';
import { CUSTOMER_PASSWORD_REQUIREMENTS, validateCustomerPassword } from '../lib/customer';
import { supabase } from '../lib/supabase';

export default function ClienteRedefinirSenha() {
  const navigate = useNavigate();
  const { user, loading } = useCustomer();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (success) {
      const timeout = window.setTimeout(() => {
        navigate('/perfil', { replace: true });
      }, 1200);

      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [navigate, success]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess(false);

    const passwordError = validateCustomerPassword(password);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
    } catch (updateError) {
      console.error('Erro ao redefinir senha:', updateError);
      setError('Não foi possível salvar a nova senha. Abra o link mais recente do e-mail e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-6 text-brand-brown selection:bg-brand-brown selection:text-brand-bg sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/entrar')}
            className="h-10 rounded-full border-brand-brown/15 bg-white px-4 text-brand-brown hover:bg-stone-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden text-xs font-bold sm:inline">Entrar</span>
          </Button>

          <img
            src="/logo-lumi-importadora.svg"
            alt="Lumi Imports"
            className="h-20 w-auto object-contain drop-shadow-sm"
          />
        </div>

        <main className="flex flex-1 items-center">
          <Card className="w-full overflow-hidden rounded-[1.75rem] border-brand-brown/10 bg-white shadow-[0_18px_50px_rgba(61,43,31,0.08)]">
            <CardHeader className="border-b border-brand-brown/10 bg-[#fdfbf9] px-5 py-5 sm:px-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-brown text-white">
                <KeyRound className="h-5 w-5" />
              </div>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Nova senha
              </CardTitle>
              <p className="text-sm leading-5 text-brand-brown/55">
                Crie uma nova senha para voltar à sua conta Lumi.
              </p>
            </CardHeader>

            <CardContent className="px-5 py-6 sm:px-7">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-brown/10 border-t-brand-brown" />
                </div>
              ) : !user ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                    Abra esta página pelo link de recuperação enviado ao seu e-mail.
                  </div>
                  <Button
                    type="button"
                    onClick={() => navigate('/entrar')}
                    className="h-12 w-full rounded-xl bg-brand-brown text-sm font-bold text-white shadow-lg shadow-brand-brown/15 hover:bg-[#2A1D15]"
                  >
                    Voltar para entrar
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nova-senha">Nova senha</Label>
                    <Input
                      id="nova-senha"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="8+ caracteres, numero e especial"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="h-11 rounded-xl"
                    />
                    <p className="text-xs leading-5 text-brand-brown/45">
                      {CUSTOMER_PASSWORD_REQUIREMENTS}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmar-senha">Confirmar senha</Label>
                    <Input
                      id="confirmar-senha"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="h-11 rounded-xl"
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" />
                      Senha atualizada com sucesso.
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={saving || success}
                    className="h-12 w-full rounded-xl bg-brand-brown text-sm font-bold text-white shadow-lg shadow-brand-brown/15 hover:bg-[#2A1D15]"
                  >
                    <KeyRound className="h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar nova senha'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
