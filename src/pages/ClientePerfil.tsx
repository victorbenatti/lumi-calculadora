import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { ArrowLeft, CheckCircle2, LogOut, MapPin, Save, UserRound } from 'lucide-react';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useCustomer, type ClienteProfile, type ClienteProfileInput } from '../contexts/customer';
import { formatBrazilianWhatsApp } from '../lib/customer';

type ProfileForm = {
  nome: string;
  whatsapp: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

const emptyToNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

type ClientePerfilContentProps = {
  user: User;
  profile: ClienteProfile | null;
  profileLoading: boolean;
  saveProfile: (profile: ClienteProfileInput) => Promise<ClienteProfile | null>;
  signOut: () => Promise<void>;
};

function ClientePerfilContent({
  user,
  profile,
  profileLoading,
  saveProfile,
  signOut,
}: ClientePerfilContentProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileForm>({
    nome: profile?.nome ?? user.user_metadata?.nome ?? '',
    whatsapp: formatBrazilianWhatsApp(profile?.whatsapp ?? user.user_metadata?.whatsapp ?? ''),
    email: profile?.email ?? user.email ?? '',
    cep: profile?.cep ?? '',
    logradouro: profile?.logradouro ?? '',
    numero: profile?.numero ?? '',
    complemento: profile?.complemento ?? '',
    bairro: profile?.bairro ?? '',
    cidade: profile?.cidade ?? '',
    estado: profile?.estado ?? '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const profileSummary = useMemo(() => {
    const city = [form.cidade, form.estado].filter(Boolean).join(' / ');
    return [form.nome, form.whatsapp, city].filter(Boolean).join(' - ');
  }, [form.cidade, form.estado, form.nome, form.whatsapp]);

  const updateField = (field: keyof ProfileForm, value: string) => {
    setSaved(false);
    setForm((currentForm) => ({
      ...currentForm,
      [field]: field === 'whatsapp' ? formatBrazilianWhatsApp(value) : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSaved(false);

    try {
      await saveProfile({
        nome: emptyToNull(form.nome),
        whatsapp: emptyToNull(form.whatsapp),
        email: form.email.trim() || user.email || '',
        cep: emptyToNull(form.cep),
        logradouro: emptyToNull(form.logradouro),
        numero: emptyToNull(form.numero),
        complemento: emptyToNull(form.complemento),
        bairro: emptyToNull(form.bairro),
        cidade: emptyToNull(form.cidade),
        estado: emptyToNull(form.estado.toUpperCase()),
      });
      setSaved(true);
    } catch (saveError) {
      console.error('Erro ao salvar dados do cliente:', saveError);
      setError('Não foi possível salvar agora. Tente novamente em instantes.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/catalogo', { replace: true });
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/catalogo')}
            className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-brand-brown/55 transition-colors hover:text-brand-brown"
          >
            <ArrowLeft className="h-4 w-4" />
            Catálogo
          </button>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-brown/40">
            Perfil opcional
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-brown">
            Seus dados Lumi
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-brown/60">
            Dados salvos para próximas compras. O carrinho e a finalização pelo WhatsApp continuam livres.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          className="h-11 rounded-full border-brand-brown/15 bg-white px-4 text-brand-brown hover:bg-stone-50"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="h-max rounded-[1.5rem] border-brand-brown/10 bg-white shadow-[0_14px_40px_rgba(61,43,31,0.05)]">
          <CardHeader className="pb-4">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-brown text-white">
              <UserRound className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl tracking-tight">
              {form.nome || 'Cliente Lumi'}
            </CardTitle>
            <p className="text-sm leading-5 text-brand-brown/55">
              {profileSummary || 'Complete o básico para agilizar o atendimento.'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-brand-brown/10 bg-[#fcfbf9] p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-brand-brown/45" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-brown/40">
                    Próximo checkout
                  </p>
                  <p className="mt-1 text-sm leading-5 text-brand-brown/65">
                    Essas informações já ficam preparadas para entrega futura, sem criar uma etapa obrigatória hoje.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-brand-brown/10 bg-white shadow-[0_14px_40px_rgba(61,43,31,0.05)]">
          <CardHeader className="border-b border-brand-brown/10 bg-[#fdfbf9]">
            <CardTitle className="text-xl tracking-tight">Dados básicos</CardTitle>
            <p className="text-sm leading-5 text-brand-brown/55">
              Ajuste seus contatos e endereço quando quiser.
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="perfil-nome">Nome</Label>
                  <Input
                    id="perfil-nome"
                    value={form.nome}
                    onChange={(event) => updateField('nome', event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perfil-whatsapp">WhatsApp</Label>
                  <Input
                    id="perfil-whatsapp"
                    value={form.whatsapp}
                    onChange={(event) => updateField('whatsapp', event.target.value)}
                    placeholder="(00) 00000-0000"
                    inputMode="tel"
                    autoComplete="tel"
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perfil-email">E-mail</Label>
                  <Input
                    id="perfil-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="h-px bg-brand-brown/10" />

              <div className="grid gap-4 sm:grid-cols-6">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="perfil-cep">CEP</Label>
                  <Input
                    id="perfil-cep"
                    value={form.cep}
                    onChange={(event) => updateField('cep', event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2 sm:col-span-4">
                  <Label htmlFor="perfil-logradouro">Logradouro</Label>
                  <Input
                    id="perfil-logradouro"
                    value={form.logradouro}
                    onChange={(event) => updateField('logradouro', event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="perfil-numero">Número</Label>
                  <Input
                    id="perfil-numero"
                    value={form.numero}
                    onChange={(event) => updateField('numero', event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2 sm:col-span-4">
                  <Label htmlFor="perfil-complemento">Complemento</Label>
                  <Input
                    id="perfil-complemento"
                    value={form.complemento}
                    onChange={(event) => updateField('complemento', event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="perfil-bairro">Bairro</Label>
                  <Input
                    id="perfil-bairro"
                    value={form.bairro}
                    onChange={(event) => updateField('bairro', event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2 sm:col-span-3">
                  <Label htmlFor="perfil-cidade">Cidade</Label>
                  <Input
                    id="perfil-cidade"
                    value={form.cidade}
                    onChange={(event) => updateField('cidade', event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="perfil-estado">UF</Label>
                  <Input
                    id="perfil-estado"
                    value={form.estado}
                    maxLength={2}
                    onChange={(event) => updateField('estado', event.target.value)}
                    className="h-11 rounded-xl uppercase"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                  {error}
                </div>
              )}

              {saved && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Dados salvos para próximas compras.
                </div>
              )}

              <Button
                type="submit"
                disabled={profileLoading}
                className="h-12 w-full rounded-xl bg-brand-brown text-sm font-bold text-white shadow-lg shadow-brand-brown/15 hover:bg-[#2A1D15] sm:w-auto sm:px-6"
              >
                <Save className="h-4 w-4" />
                {profileLoading ? 'Salvando...' : 'Salvar dados'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function ClientePerfil() {
  const navigate = useNavigate();
  const { user, profile, loading, profileLoading, saveProfile, signOut } = useCustomer();

  useEffect(() => {
    if (!loading && !user) navigate('/entrar', { replace: true });
  }, [loading, navigate, user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-brand-bg">
        <Header />
        <div className="flex min-h-screen items-center justify-center pt-[121px] md:pt-[72px]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-brown/10 border-t-brand-brown" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-brown selection:bg-brand-brown selection:text-brand-bg">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-14 pt-[145px] sm:px-6 md:pt-28 lg:px-8">
        <ClientePerfilContent
          key={profile?.updated_at ?? user.id}
          user={user}
          profile={profile}
          profileLoading={profileLoading}
          saveProfile={saveProfile}
          signOut={signOut}
        />
      </main>
    </div>
  );
}
