import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Route, ShieldCheck, Workflow } from 'lucide-react';

declare global {
  interface Window {
    google?: { accounts: { id: { initialize: (options: object) => void; renderButton: (element: HTMLElement, options: object) => void } } };
  }
}

type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role?: 'admin' | 'gestor' | 'colaborador' | 'diretoria';
  roleTitle?: string;
  department?: string;
  branch?: string;
  forcePasswordChange?: boolean;
};

const syncAuthenticatedUser = (_user: AuthenticatedUser) => undefined;

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<'checking' | 'anonymous' | 'password-change' | 'authenticated'>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/session', { credentials: 'include' }),
      fetch('/api/auth/config').then(response => response.json())
    ]).then(async ([session, config]) => {
      setGoogleClientId(config.googleClientId);
      if (session.ok) {
        const data = await session.json();
        syncAuthenticatedUser(data.user);
        setStatus(data.user.forcePasswordChange ? 'password-change' : 'authenticated');
      } else setStatus('anonymous');
    }).catch(() => {
      setMessage('Não foi possível conectar ao servidor de autenticação.');
      setStatus('anonymous');
    });
  }, []);

  useEffect(() => {
    if (status !== 'anonymous' || !googleClientId || !googleButtonRef.current) return;
    const render = () => {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        use_fedcm_for_prompt: true,
        callback: async ({ credential }: { credential: string }) => {
          setLoading(true);
          setMessage('');
          try {
            const response = await fetch('/api/auth/google', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ credential })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            syncAuthenticatedUser(data.user);
            setStatus('authenticated');
          } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao entrar com Google.'); }
          finally { setLoading(false); }
        }
      });
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 360 });
    };
    if (window.google) return render();
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = render;
    script.onerror = () => setMessage('Não foi possível carregar o login do Google.');
    document.head.appendChild(script);
    return () => { script.onload = null; };
  }, [googleClientId, status]);

  useEffect(() => {
    const logout = async () => {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
      setStatus('anonymous');
      setPassword('');
    };
    window.addEventListener('prolog:logout', logout);
    return () => window.removeEventListener('prolog:logout', logout);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password, remember })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      syncAuthenticatedUser(data.user);
      setCurrentPassword(password);
      setStatus(data.user.forcePasswordChange ? 'password-change' : 'authenticated');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao entrar.'); }
    finally { setLoading(false); }
  };

  const changeInitialPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (newPassword !== confirmPassword) return setMessage('A confirmação da nova senha não confere.');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(data?.message || 'Não foi possível alterar a senha.');
      setPassword(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setStatus('authenticated');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível alterar a senha.'); }
    finally { setLoading(false); }
  };

  if (status === 'checking') return (
    <div className="min-h-dvh bg-slate-950 flex items-center justify-center text-white" role="status">
      <LoaderCircle className="w-7 h-7 animate-spin" /><span className="sr-only">Validando sessão</span>
    </div>
  );
  if (status === 'password-change') return (
    <main className="min-h-dvh bg-slate-100 flex items-center justify-center p-5">
      <form onSubmit={changeInitialPassword} className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-xl p-7 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white grid place-items-center font-black text-xl">P</div>
        <div><p className="text-xs font-extrabold uppercase tracking-widest text-blue-600">Primeiro acesso</p><h1 className="text-2xl font-black text-slate-950 mt-2">Crie sua senha definitiva</h1><p className="text-sm text-slate-500 mt-2">Por segurança, a senha provisória deve ser substituída antes de acessar o PROLOG.</p></div>
        <label className="block text-xs font-bold text-slate-700">Senha provisória<input required type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="mt-1.5 w-full h-12 px-4 rounded-xl border border-slate-300 bg-slate-50" /></label>
        <label className="block text-xs font-bold text-slate-700">Nova senha<input required type="password" minLength={8} autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} className="mt-1.5 w-full h-12 px-4 rounded-xl border border-slate-300 bg-slate-50" /></label>
        <label className="block text-xs font-bold text-slate-700">Confirmar nova senha<input required type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="mt-1.5 w-full h-12 px-4 rounded-xl border border-slate-300 bg-slate-50" /></label>
        <p className="text-xs text-slate-500">Use pelo menos 8 caracteres, incluindo letras e números.</p>
        {message && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{message}</div>}
        <button disabled={loading} className="w-full h-12 rounded-xl bg-blue-600 text-white text-sm font-extrabold disabled:opacity-60">{loading ? 'Alterando...' : 'Alterar senha e continuar'}</button>
      </form>
    </main>
  );
  if (status === 'authenticated') return <>{children}</>;

  return (
    <main className="min-h-dvh bg-white grid lg:grid-cols-[1.05fr_0.95fr] font-sans">
      <section className="hidden lg:flex relative overflow-hidden bg-[#f5f9ff] border-r border-slate-200 p-10 xl:p-14 flex-col" aria-label="Logística, tecnologia e projetos integrados">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white grid place-items-center font-black text-xl shadow-lg shadow-blue-500/20">P</div>
          <div><p className="font-black text-xl tracking-tight text-slate-900">PROLOG</p><p className="text-xs text-slate-500">Projetos que movem operações</p></div>
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center py-5">
          <img src="/assets/branding/prolog-login-logistics.png" alt="Equipe coordenando tecnologia, projetos e operação logística" className="w-full max-h-[68vh] object-contain mix-blend-multiply" />
        </div>
        <div className="grid grid-cols-3 gap-3 relative z-10">
          {[['Logística', Route], ['Tecnologia', Workflow], ['Governança', ShieldCheck]].map(([label, Icon]) => (
            <div key={String(label)} className="rounded-2xl bg-white/85 border border-white px-3 py-2.5 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-700">
              <Icon className="w-4 h-4 text-blue-600" />{String(label)}
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white grid place-items-center font-black text-xl">P</div>
            <div><p className="font-black text-xl text-slate-900">PROLOG</p><p className="text-xs text-slate-500">Gestão de Demandas</p></div>
          </div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600 mb-3">Bem-vindo de volta</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">Acesse sua operação</h1>
          <p className="text-sm text-slate-500 mt-3 mb-8 leading-relaxed">Centralize projetos, demandas e entregas logísticas em um ambiente seguro.</p>

          {googleClientId ? <div ref={googleButtonRef} className="min-h-11 flex justify-center [&>div]:w-full mb-6" /> : (
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 mb-6">Login Google disponível após configurar o Client ID OAuth.</div>
          )}

          <div className="flex items-center gap-4 mb-6"><span className="h-px bg-slate-200 flex-1" /><span className="text-xs text-slate-400">ou continue com e-mail</span><span className="h-px bg-slate-200 flex-1" /></div>

          <form onSubmit={submit} className="space-y-4">
            <div><label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5">E-mail ou usuário</label><div className="relative"><Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" /><input id="login-email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu.email@empresa.com.br" className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 bg-slate-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div></div>
            <div><div className="flex justify-between mb-1.5"><label htmlFor="login-password" className="text-xs font-bold text-slate-700">Senha</label><button type="button" onClick={() => setMessage('Solicite a redefinição ao administrador do PROLOG.')} className="text-xs font-semibold text-blue-600 hover:underline">Esqueci a senha</button></div><div className="relative"><LockKeyhole className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" /><input id="login-password" required type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full h-12 pl-10 pr-11 rounded-xl border border-slate-300 bg-slate-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" /><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer w-fit"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />Lembrar este dispositivo</label>
            {message && <div role="alert" className="flex gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3 text-xs text-amber-900"><AlertCircle className="w-4 h-4 shrink-0" />{message}</div>}
            <button disabled={loading} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-extrabold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2">{loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}{loading ? 'Validando...' : 'Entrar no PROLOG'}</button>
          </form>
          <p className="text-[11px] text-slate-400 text-center mt-8">Acesso protegido por sessão segura e OAuth 2.0.</p>
        </div>
      </section>
    </main>
  );
};
