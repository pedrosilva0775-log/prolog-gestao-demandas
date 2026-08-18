import React, { useEffect, useState } from 'react';
import { Camera, Check, KeyRound, Laptop, LoaderCircle, Moon, Sun, UserRound, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ProfileSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentUser, updateUser, theme, setTheme, showToast } = useApp();
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => { if (isOpen) setAvatar(currentUser.avatar || ''); }, [isOpen, currentUser.avatar]);
  if (!isOpen) return null;

  const initials = currentUser.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  const uploadAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      showToast({ type: 'warning', title: 'Imagem inválida', message: 'Use JPG, PNG ou WebP com até 2 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result);
      setAvatar(image);
      updateUser(currentUser.id, { avatar: image });
      showToast({ type: 'success', title: 'Foto atualizada', message: 'Sua nova imagem de perfil foi salva.' });
    };
    reader.readAsDataURL(file);
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast({ type: 'warning', title: 'Senhas diferentes', message: 'A confirmação deve ser igual à nova senha.' });
      return;
    }
    setSavingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="profile-settings-title">
      <div className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <header className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div><h2 id="profile-settings-title" className="font-black text-slate-900 dark:text-white">Meu perfil</h2><p className="text-xs text-slate-500">Foto, aparência e segurança da conta</p></div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fechar"><X className="w-5 h-5" /></button>
        </header>

        <div className="p-5 sm:p-6 space-y-6">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {avatar ? <img src={avatar} alt="Foto do perfil" className="w-20 h-20 rounded-2xl object-cover" /> : <div className="w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 grid place-items-center text-xl font-black">{initials || <UserRound />}</div>}
              <div className="flex-1"><h3 className="font-bold text-slate-900 dark:text-white">{currentUser.name}</h3><p className="text-xs text-slate-500 mb-3">{currentUser.roleTitle || currentUser.role}</p><div className="flex flex-wrap gap-2"><label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"><Camera className="w-4 h-4" />Trocar foto<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} className="sr-only" /></label>{avatar && <button onClick={() => { setAvatar(''); updateUser(currentUser.id, { avatar: '' }); }} className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">Remover foto</button>}</div></div>
            </div>
          </section>

          <section><h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">Tema visual</h3><div className="grid sm:grid-cols-3 gap-3">{themes.map(option => { const Icon = option.icon; const selected = theme === option.id; return <button key={option.id} onClick={() => setTheme(option.id)} className={`relative text-left p-4 rounded-2xl border transition-all ${selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}><Icon className={`w-5 h-5 mb-3 ${selected ? 'text-blue-600' : 'text-slate-500'}`} /><p className="text-xs font-bold text-slate-900 dark:text-white">{option.label}</p><p className="text-[10px] text-slate-500 mt-1">{option.description}</p>{selected && <Check className="absolute top-3 right-3 w-4 h-4 text-blue-600" />}</button>; })}</div></section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4"><KeyRound className="w-5 h-5 text-blue-600" /><div><h3 className="text-sm font-black text-slate-900 dark:text-white">Alterar senha</h3><p className="text-[11px] text-slate-500">Disponível para contas que entram com e-mail e senha</p></div></div>
            <form onSubmit={changePassword} className="grid sm:grid-cols-2 gap-3">
              <input required type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Senha atual" className="sm:col-span-2 h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm" />
              <input required minLength={8} type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha" className="h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm" />
              <input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar nova senha" className="h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm" />
              <p className="sm:col-span-2 text-[10px] text-slate-500">Mínimo de 8 caracteres, contendo letras e números.</p>
              <button disabled={savingPassword} className="sm:col-span-2 sm:justify-self-end px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60">{savingPassword && <LoaderCircle className="w-4 h-4 animate-spin" />}Atualizar senha</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};
