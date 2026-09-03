import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, X } from 'lucide-react';
import type { ClientDto } from '../../contracts';
import { useClients } from '../../context/ClientsContext';

export type ClientRecord = ClientDto;
type Props = { isOpen: boolean; onClose: () => void; onCreated?: (client: ClientRecord) => void; onSaved?: (client: ClientRecord) => void; clientToEdit?: ClientRecord | null };

export const ClientModal: React.FC<Props> = ({ isOpen, onClose, onCreated, onSaved, clientToEdit }) => {
  const { createClient, updateClient } = useClients();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    setName(clientToEdit?.name || ''); setCompany(clientToEdit?.company || ''); setEmail(clientToEdit?.email || ''); setPhone(clientToEdit?.phone || ''); setError('');
  }, [clientToEdit, isOpen]);
  if (!isOpen) return null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { name: name.trim(), company: company.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), active: clientToEdit?.active ?? true };
      const client = clientToEdit ? await updateClient(clientToEdit.id, payload) : await createClient(payload);
      clientToEdit ? onSaved?.(client) : onCreated?.(client); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o cliente.'); }
    finally { setSaving(false); }
  };
  const field = 'mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100';
  return createPortal(<div data-modal-overlay="true" className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/60 backdrop-blur-sm"><div className="min-h-full flex justify-center p-4 pt-5 sm:pt-8"><div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
    <header className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 grid place-items-center"><Building2 className="w-5 h-5" /></span><div><h2 className="font-black text-slate-900 dark:text-white">{clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}</h2><p className="text-sm text-slate-500">{clientToEdit ? 'Atualize os dados do solicitante' : 'Cadastre o solicitante externo das demandas'}</p></div></div><button type="button" onClick={onClose} aria-label="Fechar" className="p-2 text-slate-400"><X className="w-5 h-5" /></button></header>
    <form onSubmit={submit} className="p-6 space-y-4"><div className="grid sm:grid-cols-2 gap-3"><label className="text-sm font-bold">Nome do contato *<input required value={name} onChange={event => setName(event.target.value)} className={field} /></label><label className="text-sm font-bold">Empresa / Cliente *<input required value={company} onChange={event => setCompany(event.target.value)} className={field} /></label><label className="text-sm font-bold">E-mail *<input required type="email" value={email} onChange={event => setEmail(event.target.value)} className={field} /></label><label className="text-sm font-bold">Telefone / WhatsApp<input value={phone} onChange={event => setPhone(event.target.value)} className={field} /></label></div>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-slate-500">Cancelar</button><button disabled={saving} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-60">{saving ? 'Salvando...' : clientToEdit ? 'Salvar alterações' : 'Cadastrar Cliente'}</button></div></form>
  </div></div></div>, document.body);
};
