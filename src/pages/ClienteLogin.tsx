import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, LogIn, ShoppingBag, Sparkles, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useCustomer } from '../contexts/customer';
import {
  CUSTOMER_PASSWORD_REQUIREMENTS,
  formatBrazilianWhatsApp,
  validateCustomerPassword,
} from '../lib/customer';
import { getAuthRedirectUrl, supabase } from '../lib/supabase';

type AuthMode = 'login' | 'signup' | 'recovery';

const getAuthErrorMessage = (authError: unknown, mode: AuthMode) => {
  const errorText = authError instanceof Error ? authError.message.toLowerCase() : '';
  const status = typeof authError === 'object' && authError !== null && 'status' in authError
    ? Number(authError.status)
    : null;

  if (status === 429 || errorText.includes('rate limit')) {
    return 'Muitos e-mails foram enviados em pouco tempo. Aguarde alguns minutos antes de tentar novamente.';
  }

  if (mode === 'signup') {
    return 'Não foi possível criar sua conta agora. Verifique os dados e tente novamente.';
  }

  if (mode === 'recovery') {
    return 'Não foi possível enviar o e-mail de recuperação agora. Verifique o endereço e tente novamente.';
  }

  return 'Não foi possível entrar. Verifique seu e-mail e senha.';
};

export default function ClienteLogin() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useCustomer();
  const [mode, setMode] = useState<AuthMode>('login');
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) navigate('/perfil', { replace: true });
  }, [navigate, profile]);

  const createClienteProfile = async (userId: string, fallbackEmail: string) => {
    const { error: profileError } = await supabase
      .from('clientes')
      .upsert({
        id: userId,
        nome: nome.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: fallbackEmail,
      });

    if (profileError) throw profileError;
    await refreshProfile();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        const passwordError = validateCustomerPassword(password);

        if (passwordError) {
          setError(passwordError);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              account_type: 'cliente',
              nome: nome.trim(),
              whatsapp: whatsapp.trim(),
            },
            emailRedirectTo: getAuthRedirectUrl('/perfil'),
          },
        });

        if (signUpError) throw signUpError;

        if (data.session && data.user) {
          await createClienteProfile(data.user.id, data.user.email ?? email);
          navigate('/perfil', { replace: true });
          return;
        }

        setMessage('Quase lá. Confirme seu e-mail para ativar sua conta Lumi.');
        return;
      }

      if (mode === 'recovery') {
        const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getAuthRedirectUrl('/redefinir-senha'),
        });

        if (recoveryError) throw recoveryError;

        setMessage('Enviamos um link para redefinir sua senha. Confira seu e-mail.');
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const { data: existingProfile, error: profileError } = await supabase
        .from('clientes')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!existingProfile && data.user.user_metadata?.account_type !== 'cliente') {
        await supabase.auth.signOut();
        setError('Use o acesso administrativo em /login. Esta entrada é apenas para clientes.');
        return;
      }

      if (!existingProfile) {
        await createClienteProfile(data.user.id, data.user.email ?? email);
      } else {
        await refreshProfile();
      }

      navigate('/perfil', { replace: true });
    } catch (authError) {
      console.error('Erro no login de cliente:', authError);
      setError(getAuthErrorMessage(authError, mode));
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === 'signup';
  const isRecovery = mode === 'recovery';

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-6 text-brand-brown selection:bg-brand-brown selection:text-brand-bg sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/catalogo')}
            className="h-10 rounded-full border-brand-brown/15 bg-white px-4 text-brand-brown hover:bg-stone-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden text-xs font-bold sm:inline">Catálogo</span>
          </Button>

          <img
            src="/logo-lumi-importadora.svg"
            alt="Lumi Imports"
            className="h-20 w-auto object-contain drop-shadow-sm"
          />
        </div>

        <main className="grid flex-1 items-center gap-6 md:grid-cols-[0.9fr_1.1fr]">
          <section className="hidden rounded-[1.75rem] border border-brand-brown/10 bg-white p-7 shadow-[0_18px_50px_rgba(61,43,31,0.06)] md:block">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-brown text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-brown/40">
              Conta opcional
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-brown">
              Salve seus dados sem travar sua compra.
            </h1>
            <p className="mt-4 text-sm leading-6 text-brand-brown/60">
              Entre para agilizar próximas compras. Você ainda pode navegar, montar carrinho e finalizar pelo WhatsApp sem login.
            </p>
            <Link
              to="/catalogo"
              className="mt-7 inline-flex h-10 items-center gap-2 rounded-full border border-brand-brown/15 px-4 text-xs font-bold uppercase tracking-[0.16em] text-brand-brown transition-colors hover:bg-stone-50"
            >
              Continuar sem login
              <ShoppingBag className="h-4 w-4" />
            </Link>
          </section>

          <Card className="overflow-hidden rounded-[1.75rem] border-brand-brown/10 bg-white shadow-[0_18px_50px_rgba(61,43,31,0.08)]">
            <CardHeader className="border-b border-brand-brown/10 bg-[#fdfbf9] px-5 py-5 sm:px-7">
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-full border border-brand-brown/10 bg-white p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setMessage('');
                  }}
                  className={`h-10 rounded-full text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
                    !isSignup && !isRecovery ? 'bg-brand-brown text-white shadow-sm' : 'text-brand-brown/55 hover:bg-stone-50'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                    setMessage('');
                  }}
                  className={`h-10 rounded-full text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
                    isSignup ? 'bg-brand-brown text-white shadow-sm' : 'text-brand-brown/55 hover:bg-stone-50'
                  }`}
                >
                  Criar conta
                </button>
              </div>

              <CardTitle className="text-2xl font-semibold tracking-tight">
                {isRecovery ? 'Redefinir senha' : isSignup ? 'Sua conta Lumi' : 'Entrar como cliente'}
              </CardTitle>
              <p className="text-sm leading-5 text-brand-brown/55">
                {isRecovery
                  ? 'Informe seu e-mail e enviaremos um link seguro.'
                  : isSignup
                  ? 'Preencha só o essencial para salvar seus dados.'
                  : 'Entre para salvar seus dados e agilizar próximas compras.'}
              </p>
            </CardHeader>

            <CardContent className="px-5 py-6 sm:px-7">
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && !isRecovery && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        value={nome}
                        onChange={(event) => setNome(event.target.value)}
                        placeholder="Como podemos te chamar?"
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={whatsapp}
                        onChange={(event) => setWhatsapp(formatBrazilianWhatsApp(event.target.value))}
                        placeholder="(00) 00000-0000"
                        inputMode="tel"
                        autoComplete="tel"
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="cliente-email">E-mail</Label>
                  <Input
                    id="cliente-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@email.com"
                    required
                    className="h-11 rounded-xl"
                  />
                </div>

                {!isRecovery && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="cliente-password">Senha</Label>
                      {!isSignup && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('recovery');
                            setPassword('');
                            setError('');
                            setMessage('');
                          }}
                          className="text-xs font-semibold text-brand-brown/55 transition-colors hover:text-brand-brown"
                        >
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
                    <Input
                      id="cliente-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={isSignup ? '8+ caracteres, numero e especial' : 'Sua senha'}
                      required
                      minLength={isSignup ? 8 : 6}
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      className="h-11 rounded-xl"
                    />
                    {isSignup && (
                      <p className="text-xs leading-5 text-brand-brown/45">
                        {CUSTOMER_PASSWORD_REQUIREMENTS}
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                    {message}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl bg-brand-brown text-sm font-bold text-white shadow-lg shadow-brand-brown/15 hover:bg-[#2A1D15]"
                >
                  {isRecovery ? <KeyRound className="h-4 w-4" /> : isSignup ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  {loading ? 'Aguarde...' : isRecovery ? 'Enviar link de recuperação' : isSignup ? 'Criar conta Lumi' : 'Entrar'}
                </Button>

                {isRecovery && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setMessage('');
                    }}
                    className="h-11 w-full rounded-xl text-brand-brown/60 hover:bg-stone-50 hover:text-brand-brown"
                  >
                    Voltar para entrar
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/catalogo')}
                  className="h-11 w-full rounded-xl text-brand-brown/60 hover:bg-stone-50 hover:text-brand-brown md:hidden"
                >
                  Continuar sem login
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
