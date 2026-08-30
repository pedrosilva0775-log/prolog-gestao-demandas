/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AppSelect } from '../common/AppSelect';
import { useApp } from '../../context/AppContext';
import { Demand } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { ClientModal, ClientRecord } from './ClientModal';
import { apiClient } from '../../services/apiClient';
import { DEFAULT_CHECKLIST_TEXT } from '../../data/defaultChecklist';
import { toLocalDateInput } from '../../utils/date';
import { MotionButton } from '../motion/MotionButton';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  X,
  Plus,
  Calendar,
  Layers,
  Sparkles,
  Clock,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  Loader2,
  Search
} from 'lucide-react';

const todayInput = () => toLocalDateInput();
const defaultDueInput = () => toLocalDateInput(new Date(Date.now() + 7 * 86400000));
const defaultChecklist = DEFAULT_CHECKLIST_TEXT;

export const CreateDemandModal: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    createDemand,
    categories,
    priorities,
    statuses,
    users,
    teams,
    currentUser,
    showToast
  } = useApp();

  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-tarefa');
  const [priorityId, setPriorityId] = useState(priorities[2]?.id || 'prio-alta'); // Alta
  const [teamId, setTeamId] = useState(teams[0]?.id || 'team-dev');
  const [assigneeId, setAssigneeId] = useState(currentUser.id);
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dueDate, setDueDate] = useState(defaultDueInput);
  const [plannedStartDate, setPlannedStartDate] = useState(todayInput);
  const [estimatedHours, setEstimatedHours] = useState(16);

  // 5W2H fields
  const [whatDescription, setWhatDescription] = useState('');
  const [whyReason, setWhyReason] = useState('');
  const [whereLocation, setWhereLocation] = useState('');
  const [howExecutionGuide, setHowExecutionGuide] = useState('');

  // Initial checklist items (separated by line)
  const [checklistRaw, setChecklistRaw] = useState(defaultChecklist);


  // Web Speech API State
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechField, setActiveSpeechField] = useState<'whatDescription' | 'title' | 'whyReason' | 'howExecutionGuide' | null>(null);
  const [interimText, setInterimText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Check speech recognition support on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    const loadClients = () => { apiClient.clients().then(setClients).catch(() => setClients([])); };
    if (isCreateModalOpen) {
      loadClients();
    }
    window.addEventListener('prolog:clients-updated', loadClients);
    return () => window.removeEventListener('prolog:clients-updated', loadClients);
  }, [isCreateModalOpen]);

  // Stop speech recognition when modal closes or unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleSpeechRecognition = (field: 'whatDescription' | 'title' | 'whyReason' | 'howExecutionGuide' = 'whatDescription') => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast({
        type: 'error',
        title: 'Recurso Não Suportado',
        message: 'A API de Reconhecimento de Voz (Web Speech) não é suportada ou está desativada no seu navegador.'
      });
      return;
    }

    // If already listening to this field, stop
    if (isListening && activeSpeechField === field) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      setActiveSpeechField(null);
      setInterimText('');
      showToast({
        type: 'info',
        title: 'Ditado Finalizado',
        message: 'Gravação de voz encerrada com sucesso.'
      });
      return;
    }

    // If listening to another field, stop previous first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setActiveSpeechField(field);
        setInterimText('');
        showToast({
          type: 'info',
          title: 'Gravando Voz (Web Speech)',
          message: 'Fale claramente no microfone os requisitos da demanda...'
        });
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }

        setInterimText(currentInterim);

        if (finalTranscript) {
          if (field === 'whatDescription') {
            setWhatDescription((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
          } else if (field === 'title') {
            setTitle((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
          } else if (field === 'whyReason') {
            setWhyReason((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
          } else if (field === 'howExecutionGuide') {
            setHowExecutionGuide((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          showToast({
            type: 'error',
            title: 'Permissão Negada',
            message: 'O acesso ao microfone foi bloqueado pelo navegador. Conceda a permissão nas configurações.'
          });
        } else if (event.error !== 'no-speech') {
          showToast({
            type: 'error',
            title: 'Erro de Áudio',
            message: `Falha no reconhecimento de voz: ${event.error}`
          });
        }
        setIsListening(false);
        setActiveSpeechField(null);
        setInterimText('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setActiveSpeechField(null);
        setInterimText('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      showToast({
        type: 'error',
        title: 'Erro ao Iniciar Microfone',
        message: 'Não foi possível acessar o microfone no momento.'
      });
      setIsListening(false);
      setActiveSpeechField(null);
    }
  };

  const resetForm = () => {
    setTitle('');setCategoryId(categories[0]?.id || 'cat-tarefa');setPriorityId(priorities[2]?.id || priorities[0]?.id || 'prio-alta');setTeamId(teams[0]?.id || '');setAssigneeId(currentUser.id);setClientId('');setClientSearch('');setDueDate(defaultDueInput());setPlannedStartDate(todayInput());setEstimatedHours(16);setWhatDescription('');setWhyReason('');setWhereLocation('');setHowExecutionGuide('');setChecklistRaw(defaultChecklist);setInterimText('');
  };
  const closeModal = () => { resetForm(); setIsCreateModalOpen(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast({
        type: 'error',
        title: 'Campo Obrigatório',
        message: 'Por favor, informe o título da demanda.'
      });
      return;
    }

    const checklistItems = checklistRaw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, idx) => ({
        id: `chk-init-${idx}-${Date.now()}`,
        title: line,
        completed: false
      }));

    setIsSaving(true);
    try { await createDemand({
      title: title.trim(),
      categoryId,
      priorityId,
      teamId,
      assigneeId,
      requesterId: currentUser.id,
      clientId: clientId || undefined,
      clientName: clients.find(client => client.id === clientId)?.company,
      dueDate,
      plannedStartDate,
      whatDescription: whatDescription.trim() || title.trim(),
      whyReason: whyReason.trim(),
      whereLocation: whereLocation.trim() || 'Ambiente Corporativo Geral',
      howExecutionGuide: howExecutionGuide.trim() || 'Seguir diretrizes técnicas padrão da equipe.',
      statusId: statuses[0]?.id || 'st-nova',
      progressPercent: 0,
      tags: ['Nova', categories.find((c) => c.id === categoryId)?.name || 'Demanda'],
      checklist: checklistItems,
      comments: [],
      attachments: []
    } as any); resetForm(); setIsCreateModalOpen(false); }
    catch (error) { showToast({type:'error',title:'Demanda não criada',message:error instanceof Error?error.message:'Não foi possível salvar a demanda.'}); }
    finally { setIsSaving(false); }
  };

  const visibleClients = clients.filter(client => client.active && `${String(client.company||'')} ${String(client.name||'')} ${String(client.email||'')}`.toLowerCase().includes(clientSearch.trim().toLowerCase()));
  const selectedCategoryName = categories.find(category => category.id === categoryId)?.name.trim().toLocaleLowerCase('pt-BR') || '';
  const isDetailedCategory = selectedCategoryName === 'projeto' || selectedCategoryName === 'melhoria';

  return <>
    <AnimatePresence>
    {isCreateModalOpen && (
    <motion.div initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} data-modal-overlay="true" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }} transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }} className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Cadastrar Nova Demanda (Metodologia 5W2H)
                </h3>
              </div>
              <p className="text-sm text-slate-500 truncate">
                Defina o que, por que, onde, como, quem e os prazos de entrega
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-sm">
          {/* Title with Voice Dictation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                Título da Demanda (O que é?): *
              </label>
              {speechSupported && (
                <button
                  type="button"
                  onClick={() => toggleSpeechRecognition('title')}
                  title={isListening && activeSpeechField === 'title' ? 'Parar gravação' : 'Ditar título por voz'}
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-all ${
                    isListening && activeSpeechField === 'title'
                      ? 'bg-red-600 text-white animate-pulse shadow-xs shadow-red-500/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {isListening && activeSpeechField === 'title' ? (
                    <>
                      <MicOff className="w-3 h-3" />
                      <span>Ouvindo...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3" />
                      <span>Ditar</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="Ex: Implementação da autenticação biométrica no App Mobile"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 dark:[color-scheme:dark]"
            />
          </div>

          {/* Description & Task Requirements with Web Speech API Microphone */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Descrição e Requisitos da Demanda (What / Detalhamento):
                </label>
                <span className="text-xs text-slate-500 font-normal">
                  (O que precisa ser feito)
                </span>
              </div>

              {/* Microphone Dictation Button */}
              {speechSupported ? (
                <button
                  type="button"
                  onClick={() => toggleSpeechRecognition('whatDescription')}
                  title={
                    isListening && activeSpeechField === 'whatDescription'
                      ? 'Clique para finalizar o ditado por voz'
                      : 'Clique para ditar os requisitos da tarefa usando sua voz (Web Speech API)'
                  }
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl transition-all shadow-xs ${
                    isListening && activeSpeechField === 'whatDescription'
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-500/40 ring-2 ring-red-400/50'
                      : 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80'
                  }`}
                >
                  {isListening && activeSpeechField === 'whatDescription' ? (
                    <>
                      <div className="flex items-center gap-0.5">
                        <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Gravando voz... (Parar)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Ditar Requisitos por Voz</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="text-xs text-slate-500 italic">
                  (Microfone não suportado no navegador)
                </span>
              )}
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={whatDescription}
                onChange={(e) => setWhatDescription(e.target.value)}
                placeholder="Descreva detalhadamente os requisitos, regras de negócio e entregáveis desta demanda. Você também pode clicar no botão acima 'Ditar Requisitos por Voz' para falar..."
                className={`w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all ${
                  isListening && activeSpeechField === 'whatDescription'
                    ? 'border-red-400 dark:border-red-500 ring-2 ring-red-400/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />

              {/* Active voice dictation live feedback banner */}
              {isListening && activeSpeechField === 'whatDescription' && (
                <div className="mt-1.5 p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg flex items-center justify-between gap-2 text-xs text-red-700 dark:text-red-300 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <Volume2 className="w-4 h-4 text-red-600 animate-pulse shrink-0" />
                    <span className="truncate">
                      <strong>Escutando em tempo real:</strong> {interimText ? `"${interimText}"` : 'Fale claramente agora...'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSpeechRecognition('whatDescription')}
                    className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded shrink-0 transition-colors"
                  >
                    Concluir
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Category & Priority & Team Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Category */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Categoria:
              </label>
              <AppSelect
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </AppSelect>
            </div>

            {/* Priority */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Prioridade:
              </label>
              <AppSelect
                value={priorityId}
                onChange={(e) => setPriorityId(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
              >
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </AppSelect>
            </div>

            {/* Team */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Equipe Envolvida:
              </label>
              <AppSelect
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </AppSelect>
            </div>
          </div>

          {/* Assignee & Dates Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="demand-client" className="block font-bold text-slate-700 dark:text-slate-300">Cliente solicitante:</label>
              <button type="button" onClick={() => setIsClientModalOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"><Plus className="w-4 h-4" />Cadastrar cliente</button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input value={clientSearch} onChange={event => setClientSearch(event.target.value)} placeholder="Buscar por empresa, contato ou e-mail" className="w-full py-2 pl-9 pr-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100" />
            </div>
            <AppSelect id="demand-client" value={clientId} onChange={event => setClientId(event.target.value)} className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold">
              <option value="">Solicitação interna / sem cliente</option>
              {visibleClients.map(client => <option key={client.id} value={client.id}>{client.company} — {client.name}</option>)}
            </AppSelect>
            {clientSearch && visibleClients.length === 0 && <p className="text-xs text-amber-600">Nenhum cliente encontrado. Use “Cadastrar cliente”.</p>}
          </div>

          {/* Assignee & Dates Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Assignee */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Responsável Principal:
              </label>
              <AppSelect
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.roleTitle})
                  </option>
                ))}
              </AppSelect>
            </div>

            {/* Planned Start */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data Início:
              </label>
              <input
                type="date"
                value={plannedStartDate}
                onChange={(e) => setPlannedStartDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Prazo Final de Entrega: *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-red-600 dark:text-red-400"
              />
            </div>
          </div>

          {/* 5W2H: Why, Where, How */}
          {isDetailedCategory && <>
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <p className="font-bold text-slate-500 uppercase tracking-wider text-xs">
              Detalhamento 5W2H
            </p>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Por que essa atividade é necessária? (Why):
                </label>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={() => toggleSpeechRecognition('whyReason')}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-all ${
                      isListening && activeSpeechField === 'whyReason'
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600'
                    }`}
                  >
                    {isListening && activeSpeechField === 'whyReason' ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
                    <span>{isListening && activeSpeechField === 'whyReason' ? 'Gravando...' : 'Ditar'}</span>
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                value={whyReason}
                onChange={(e) => setWhyReason(e.target.value)}
                placeholder="Ex: Garantir segurança de acesso dos usuários e cumprir exigências de conformidade LGPD..."
                className={`w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 ${
                  isListening && activeSpeechField === 'whyReason' ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Onde será executada? (Where):
                </label>
                <input
                  type="text"
                  value={whereLocation}
                  onChange={(e) => setWhereLocation(e.target.value)}
                  placeholder="Ex: Módulo Mobile Android/iOS e API Gateway"
                  className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Como deverá ser realizada? (How):
                  </label>
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={() => toggleSpeechRecognition('howExecutionGuide')}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-all ${
                        isListening && activeSpeechField === 'howExecutionGuide'
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600'
                      }`}
                    >
                      {isListening && activeSpeechField === 'howExecutionGuide' ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
                      <span>{isListening && activeSpeechField === 'howExecutionGuide' ? 'Gravando...' : 'Ditar'}</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={howExecutionGuide}
                  onChange={(e) => setHowExecutionGuide(e.target.value)}
                  placeholder="Ex: Utilizar biblioteca BiometricPrompt com fallback para PIN seguro"
                  className={`w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 ${
                    isListening && activeSpeechField === 'howExecutionGuide' ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Checklist / Sub-tarefas (uma por linha):
              </label>
              <textarea
                rows={3}
                value={checklistRaw}
                onChange={(e) => setChecklistRaw(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm"
              />
            </div>
          </div>
          </>}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-colors hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>

              <MotionButton
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/30 transition-colors duration-150 flex items-center space-x-1.5 disabled:cursor-wait disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>{isSaving?'Salvando...':'Salvar e Criar Demanda'}</span>
              </MotionButton>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
    )}
    </AnimatePresence>
    <ClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onCreated={client => { setClients(previous => [...previous.filter(item => item.id !== client.id), client]); setClientId(client.id); setClientSearch(client.company); showToast({type:'success',title:'Cliente cadastrado',message:`${client.company} foi selecionado nesta demanda.`}); }} />
  </>;
};
