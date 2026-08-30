import React, { useState } from 'react';
import { Check, KeyRound, Laptop, LoaderCircle, Moon, ShieldCheck, Sun, X } from 'lucide-react';
import { useSession, useToastActions, useVisualState } from '../../context/domainContexts';
import { csrfHeaders } from '../../services/csrf';
import { UserAvatar } from '../common/UserAvatar';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export const ProfileSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const reduceMotion = useReducedMotion();
  const { currentUser } = useSession();
  const { theme, setTheme } = useVisualState();
  const { showToast } = useToastActions();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(Boolean(currentUser.mfaEnabled));
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaUri, setMfaUri] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaPassword, setMfaPassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [savingMfa, setSavingMfa] = useState(false);

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast({ type: 'warning', title: 'Senhas diferentes', message: 'A confirmação deve ser igual à nova senha.' });
      return;
    }
    setSavingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Não foi possível alterar a senha.');
      }
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      showToast({ type: 'success', title: 'Senha alterada', message: 'Sua credencial foi atualizada com segurança.' });
    } catch (error) {
      showToast({ type: 'error', title: 'Senha não alterada', message: error instanceof Error ? error.message : 'Tente novamente.' });
    } finally { setSavingPassword(false); }
  };

  const themes = [
    { id: 'light' as const, label: 'Claro', description: 'Melhor para ambientes iluminados', icon: Sun },
    { id: 'dark' as const, label: 'Escuro', description: 'Mais conforto em baixa luminosidade', icon: Moon },
    { id: 'system' as const, label: 'Automático', description: 'Segue a configuração do dispositivo', icon: Laptop }
  ];

  const beginMfaSetup=async()=>{setSavingMfa(true);try{const response=await fetch('/api/auth/mfa/setup',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json',...csrfHeaders()},body:'{}'});const data=await response.json();if(!response.ok)throw new Error(data.message);setMfaSecret(data.secret);setMfaUri(data.otpauthUri);}catch(error){showToast({type:'error',title:'MFA não iniciado',message:error instanceof Error?error.message:'Tente novamente.'});}finally{setSavingMfa(false);}};
  const enableMfa=async()=>{setSavingMfa(true);try{const response=await fetch('/api/auth/mfa/enable',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json',...csrfHeaders()},body:JSON.stringify({code:mfaCode})});const data=await response.json();if(!response.ok)throw new Error(data.message);setRecoveryCodes(data.recoveryCodes);setMfaEnabled(true);setMfaCode('');setMfaSecret('');setMfaUri('');showToast({type:'success',title:'MFA habilitado',message:'Guarde os códigos de recuperação em local seguro.'});}catch(error){showToast({type:'error',title:'MFA não habilitado',message:error instanceof Error?error.message:'Código inválido.'});}finally{setSavingMfa(false);}};
  const disableMfa=async()=>{setSavingMfa(true);try{const response=await fetch('/api/auth/mfa/disable',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json',...csrfHeaders()},body:JSON.stringify({password:mfaPassword,code:mfaCode})});const data=response.status===204?null:await response.json();if(!response.ok)throw new Error(data?.message||'Não foi possível desabilitar MFA.');setMfaEnabled(false);setMfaPassword('');setMfaCode('');setRecoveryCodes([]);showToast({type:'warning',title:'MFA desabilitado',message:'A conta voltou a depender apenas da senha.'});}catch(error){showToast({type:'error',title:'MFA não desabilitado',message:error instanceof Error?error.message:'Credenciais inválidas.'});}finally{setSavingMfa(false);}};

  return (
    <AnimatePresence>
    {isOpen && (
    <motion.div initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} data-modal-overlay="true" className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="profile-settings-title">
      <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }} transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <header className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div><h2 id="profile-settings-title" className="font-black text-slate-900 dark:text-white">Meu perfil</h2><p className="text-xs text-slate-500">Foto, aparência e segurança da conta</p></div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fechar"><X className="w-5 h-5" /></button>
        </header>

        <div className="p-5 sm:p-6 space-y-6">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <UserAvatar name={currentUser.name} src={currentUser.avatar} className="w-20 h-20 rounded-2xl text-xl" />
              <div className="flex-1"><h3 className="font-bold text-slate-900 dark:text-white">{currentUser.name}</h3><p className="text-xs text-slate-500">{currentUser.roleTitle || currentUser.role}</p><p className="mt-2 text-[10px] text-slate-500">A edição de foto não integra o escopo v1.0.</p></div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-600"/><div><h3 className="text-sm font-black text-slate-900 dark:text-white">Autenticação em dois fatores</h3><p className="text-[11px] text-slate-500">TOTP compatível com aplicativos autenticadores</p></div><span className={`ml-auto text-[10px] font-black px-2 py-1 rounded-full ${mfaEnabled?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-600'}`}>{mfaEnabled?'ATIVO':'INATIVO'}</span></div>
            {!mfaEnabled&&!mfaSecret&&<button disabled={savingMfa} onClick={beginMfaSetup} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-60">Configurar autenticador</button>}
            {!mfaEnabled&&mfaSecret&&<div className="space-y-3"><p className="text-xs text-slate-600 dark:text-slate-300">Adicione a conta pelo URI ou informe o segredo manualmente e confirme o código gerado.</p><label className="block text-[10px] font-bold text-slate-500">Segredo base32<input readOnly value={mfaSecret} className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-300 bg-slate-50 font-mono text-xs"/></label><label className="block text-[10px] font-bold text-slate-500">URI do autenticador<input readOnly value={mfaUri} className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-300 bg-slate-50 font-mono text-[10px]"/></label><div className="flex gap-2"><input value={mfaCode} onChange={event=>setMfaCode(event.target.value.trim())} inputMode="numeric" autoComplete="one-time-code" placeholder="Código de 6 dígitos" className="min-w-0 flex-1 h-11 px-3 rounded-xl border border-slate-300"/><button disabled={savingMfa||!/^[0-9]{6}$/.test(mfaCode)} onClick={enableMfa} className="px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50">Ativar</button></div></div>}
            {mfaEnabled&&recoveryCodes.length>0&&<div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-bold text-amber-900">Códigos de recuperação — exibidos uma única vez</p><div className="grid grid-cols-2 gap-1 mt-2 font-mono text-xs text-amber-950">{recoveryCodes.map(code=><span key={code}>{code}</span>)}</div></div>}
            {mfaEnabled&&<div className="grid sm:grid-cols-2 gap-2"><input type="password" value={mfaPassword} onChange={event=>setMfaPassword(event.target.value)} placeholder="Senha atual" className="h-11 px-3 rounded-xl border border-slate-300"/><input value={mfaCode} onChange={event=>setMfaCode(event.target.value.trim())} placeholder="TOTP ou recuperação" className="h-11 px-3 rounded-xl border border-slate-300"/><button disabled={savingMfa||!mfaPassword||!mfaCode} onClick={disableMfa} className="sm:col-span-2 justify-self-end px-4 py-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold disabled:opacity-50">Desabilitar MFA</button></div>}
          </section>

          <section>
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">Tema visual</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {themes.map(option => {
                const Icon = option.icon;
                const selected = theme === option.id;
                return (
                  <motion.button
                    key={option.id}
                    type="button"
                    onClick={() => setTheme(option.id)}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    animate={{ scale: selected && !reduceMotion ? 1.015 : 1 }}
                    transition={{ duration: reduceMotion ? 0 : 0.18 }}
                    className={`relative text-left p-4 rounded-2xl border transition-[background-color,border-color,box-shadow] duration-200 ${selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
                  >
                    <Icon className={`w-5 h-5 mb-3 transition-colors duration-200 ${selected ? 'text-blue-600' : 'text-slate-500'}`} />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{option.label}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{option.description}</p>
                    <AnimatePresence>
                      {selected && (
                        <motion.span initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.65 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.65 }} className="absolute top-3 right-3">
                          <Check className="w-4 h-4 text-blue-600" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4"><KeyRound className="w-5 h-5 text-blue-600" /><div><h3 className="text-sm font-black text-slate-900 dark:text-white">Alterar senha</h3><p className="text-[11px] text-slate-500">Disponível para contas que entram com e-mail e senha</p></div></div>
            <form onSubmit={changePassword} className="grid sm:grid-cols-2 gap-3">
              <input required type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Senha atual" className="sm:col-span-2 h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm" />
              <input required minLength={12} type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha" className="h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm" />
              <input required minLength={12} type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar nova senha" className="h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm" />
              <p className="sm:col-span-2 text-[10px] text-slate-500">Mínimo de 12 caracteres, contendo letras e números.</p>
              <button disabled={savingPassword} className="sm:col-span-2 sm:justify-self-end px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60">{savingPassword && <LoaderCircle className="w-4 h-4 animate-spin" />}Atualizar senha</button>
            </form>
          </section>
        </div>
      </motion.div>
    </motion.div>
    )}
    </AnimatePresence>
  );
};
