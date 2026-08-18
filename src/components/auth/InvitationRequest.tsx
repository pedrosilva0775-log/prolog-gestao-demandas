import React, { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, UserRoundPlus } from 'lucide-react';

export const InvitationRequest: React.FC<{ token: string }> = ({ token }) => {
  const [invitation, setInvitation] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ roleTitle: '', department: '', branch: '', teamName: '', password: '', confirmPassword: '' });

  useEffect(() => {
    fetch(`/api/invitations/${encodeURIComponent(token)}`).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.message); setInvitation(data);
    }).catch(reason => setError(reason instanceof Error ? reason.message : 'Convite inválido.'));
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) return setError('A confirmação da senha não confere.');
    setLoading(true);
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(token)}/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message); setSent(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível enviar sua solicitação.'); }
    finally { setLoading(false); }
  };

  if (sent) return <main className="min-h-dvh bg-slate-50 grid place-items-center p-5"><div className="max-w-md text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-xl"><CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" /><h1 className="text-xl font-black">Solicitação enviada</h1><p className="text-sm text-slate-500 mt-2">O administrador definirá seu perfil de acesso. Você poderá entrar depois da aprovação.</p></div></main>;

  return <main className="min-h-dvh bg-slate-50 flex items-center justify-center p-4"><div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden"><header className="p-6 bg-slate-950 text-white"><div className="w-11 h-11 rounded-xl bg-blue-600 grid place-items-center font-black mb-4">P</div><p className="text-xs font-bold uppercase tracking-widest text-blue-300">Convite PROLOG</p><h1 className="text-2xl font-black mt-1">Solicite seu acesso</h1><p className="text-sm text-slate-400 mt-2">Complete seus dados. O perfil de permissão será definido pelo administrador.</p></header>{!invitation && !error ? <div className="p-10 grid place-items-center"><LoaderCircle className="animate-spin" /></div> : error && !invitation ? <div className="p-8 text-center text-red-600 text-sm">{error}</div> : <form onSubmit={submit} className="p-6 space-y-4"><div className="grid sm:grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-600">Nome completo<input value={invitation?.name || ''} disabled className="mt-1.5 w-full h-11 px-3 rounded-xl bg-slate-100 border border-slate-200" /></label><label className="text-xs font-bold text-slate-600">E-mail<input value={invitation?.email || ''} disabled className="mt-1.5 w-full h-11 px-3 rounded-xl bg-slate-100 border border-slate-200" /></label></div><div className="grid sm:grid-cols-2 gap-3">{[['roleTitle','Cargo / Função'],['department','Setor / Departamento'],['branch','Filial'],['teamName','Equipe']].map(([key,label]) => <label key={key} className="text-xs font-bold text-slate-600">{label}<input required value={form[key as keyof typeof form]} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500" /></label>)}</div><div className="grid sm:grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-600">Criar senha<input required minLength={8} type="password" value={form.password} onChange={event => setForm(previous => ({ ...previous, password: event.target.value }))} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-300" /></label><label className="text-xs font-bold text-slate-600">Confirmar senha<input required minLength={8} type="password" value={form.confirmPassword} onChange={event => setForm(previous => ({ ...previous, confirmPassword: event.target.value }))} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-300" /></label></div><p className="text-[11px] text-slate-500">Use ao menos 8 caracteres, incluindo letras e números.</p>{error && <p className="text-xs text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}<button disabled={loading} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60">{loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <UserRoundPlus className="w-4 h-4" />}Enviar solicitação</button></form>}</div></main>;
};
