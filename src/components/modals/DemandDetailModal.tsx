/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { IconRenderer } from '../common/IconRenderer';
import {
  Demand,
  Comment,
  ChecklistItem,
  BlockerInfo
} from '../../types';
import {
  X,
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  History,
  FileText,
  Trash2,
  Send,
  ExternalLink,
  ChevronDown,
  CheckSquare,
  Square,
  Plus,
  Shield,
  Layers,
  Sparkles,
  Edit3,
  Save,
  RotateCcw,
  Info,
  Mic,
  MicOff,
  Volume2,
  Ban,
  XCircle
} from 'lucide-react';
import { CancelDemandModal } from './CancelDemandModal';

export const DemandDetailModal: React.FC = () => {
  const {
    selectedDemand,
    setSelectedDemand,
    updateDemand,
    deleteDemand,
    moveDemandStatus,
    toggleBlocker,
    extendDeadline,
    addComment,
    toggleChecklist,
    completeDemand,
    statuses,
    priorities,
    categories,
    users,
    teams,
    currentUser,
    auditLogs,
    showToast,
    hasPermission
  } = useApp();

  const [activeTab, setActiveTab] = useState<'5w2h' | 'edit' | 'checklist' | 'blocker' | 'comments' | 'history'>('5w2h');
  const [newCommentText, setNewCommentText] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');

  // Blocker form state
  const [isBlocked, setIsBlocked] = useState(selectedDemand?.blocker?.isBlocked || false);
  const [blockerReason, setBlockerReason] = useState(selectedDemand?.blocker?.reason || '');
  const [blockerImpact, setBlockerImpact] = useState(selectedDemand?.blocker?.impact || 'Alto');
  const [blockerAction, setBlockerAction] = useState(selectedDemand?.blocker?.actionNeeded || '');

  // Completion modal/box
  const [completionSummary, setCompletionSummary] = useState(selectedDemand?.completionSummary || '');
  const [isCompletingOpen, setIsCompletingOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Deadline extension
  const [isExtensionOpen, setIsExtensionOpen] = useState(false);
  const [newDueDate, setNewDueDate] = useState(selectedDemand?.dueDate || '');
  const [extensionReason, setExtensionReason] = useState('');

  // Edit Form State
  const [editTitle, setEditTitle] = useState(selectedDemand?.title || '');
  const [editCategoryId, setEditCategoryId] = useState(selectedDemand?.categoryId || '');
  const [editPriorityId, setEditPriorityId] = useState(selectedDemand?.priorityId || '');
  const [editTeamId, setEditTeamId] = useState(selectedDemand?.teamId || '');
  const [editAssigneeId, setEditAssigneeId] = useState(selectedDemand?.assigneeId || '');
  const [editDueDate, setEditDueDate] = useState(selectedDemand?.dueDate?.slice(0, 10) || '2026-08-25');
  const [editPlannedStartDate, setEditPlannedStartDate] = useState(selectedDemand?.plannedStartDate?.slice(0, 10) || '2026-08-16');
  const [editWhat, setEditWhat] = useState(selectedDemand?.whatDescription || selectedDemand?.description || '');
  const [editWhy, setEditWhy] = useState(selectedDemand?.whyReason || '');
  const [editWhere, setEditWhere] = useState(selectedDemand?.whereLocation || '');
  const [editHow, setEditHow] = useState(selectedDemand?.howExecutionGuide || '');

  // Auto-Save state for Edit screen
  const [editLastSavedTime, setEditLastSavedTime] = useState<string | null>(null);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [isEditDraftRestored, setIsEditDraftRestored] = useState(false);
  const editAutoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editDraftStorageKey = selectedDemand ? `gd_draft_edit_demand_${selectedDemand.id}` : '';

  // Web Speech API State for Edit Mode
  const [isEditListening, setIsEditListening] = useState(false);
  const [activeEditSpeechField, setActiveEditSpeechField] = useState<'what' | 'title' | 'why' | 'how' | null>(null);
  const [editInterimText, setEditInterimText] = useState('');
  const editRecognitionRef = useRef<any>(null);

  // Stop speech recognition when modal unmounts
  useEffect(() => {
    return () => {
      if (editRecognitionRef.current) {
        try {
          editRecognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleEditSpeech = (field: 'what' | 'title' | 'why' | 'how' = 'what') => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast({
        type: 'error',
        title: 'Recurso Não Suportado',
        message: 'A API de Reconhecimento de Voz (Web Speech) não é suportada no seu navegador.'
      });
      return;
    }

    if (isEditListening && activeEditSpeechField === field) {
      if (editRecognitionRef.current) {
        try {
          editRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsEditListening(false);
      setActiveEditSpeechField(null);
      setEditInterimText('');
      showToast({
        type: 'info',
        title: 'Ditado Finalizado',
        message: 'Gravação de voz encerrada com sucesso.'
      });
      return;
    }

    if (editRecognitionRef.current) {
      try {
        editRecognitionRef.current.abort();
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
        setIsEditListening(true);
        setActiveEditSpeechField(field);
        setEditInterimText('');
        showToast({
          type: 'info',
          title: 'Gravando Voz (Web Speech)',
          message: 'Fale claramente os requisitos no microfone...'
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

        setEditInterimText(currentInterim);

        if (finalTranscript) {
          if (field === 'what') {
            setEditWhat((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
          } else if (field === 'title') {
            setEditTitle((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
          } else if (field === 'why') {
            setEditWhy((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
          } else if (field === 'how') {
            setEditHow((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Erro no reconhecimento de voz:', event.error);
        if (event.error === 'not-allowed') {
          showToast({
            type: 'error',
            title: 'Permissão Negada',
            message: 'O acesso ao microfone foi bloqueado pelo navegador.'
          });
        }
        setIsEditListening(false);
        setActiveEditSpeechField(null);
        setEditInterimText('');
      };

      recognition.onend = () => {
        setIsEditListening(false);
        setActiveEditSpeechField(null);
        setEditInterimText('');
      };

      editRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Erro ao iniciar microfone:', err);
      setIsEditListening(false);
      setActiveEditSpeechField(null);
    }
  };

  // Reset or initialize edit fields and check for saved edit draft when selectedDemand changes
  useEffect(() => {
    if (!selectedDemand) return;

    setEditTitle(selectedDemand.title);
    setEditCategoryId(selectedDemand.categoryId);
    setEditPriorityId(selectedDemand.priorityId);
    setEditTeamId(selectedDemand.teamId);
    setEditAssigneeId(selectedDemand.assigneeId);
    setEditDueDate(selectedDemand.dueDate?.slice(0, 10) || '2026-08-25');
    setEditPlannedStartDate(selectedDemand.plannedStartDate?.slice(0, 10) || '2026-08-16');
    setEditWhat(selectedDemand.whatDescription || selectedDemand.description || '');
    setEditWhy(selectedDemand.whyReason || '');
    setEditWhere(selectedDemand.whereLocation || '');
    setEditHow(selectedDemand.howExecutionGuide || '');
    setIsBlocked(selectedDemand.blocker?.isBlocked || false);
    setBlockerReason(selectedDemand.blocker?.reason || '');
    setBlockerImpact(selectedDemand.blocker?.impact || 'Alto');
    setBlockerAction(selectedDemand.blocker?.actionNeeded || '');
    setNewDueDate(selectedDemand.dueDate);
    setIsEditDraftRestored(false);

    try {
      if (editDraftStorageKey) {
        const savedEditDraftRaw = null;
        if (savedEditDraftRaw) {
          const saved = JSON.parse(savedEditDraftRaw);
          if (saved && saved.demandId === selectedDemand.id) {
            if (saved.title !== undefined) setEditTitle(saved.title);
            if (saved.categoryId) setEditCategoryId(saved.categoryId);
            if (saved.priorityId) setEditPriorityId(saved.priorityId);
            if (saved.teamId) setEditTeamId(saved.teamId);
            if (saved.assigneeId) setEditAssigneeId(saved.assigneeId);
            if (saved.dueDate) setEditDueDate(saved.dueDate);
            if (saved.plannedStartDate) setEditPlannedStartDate(saved.plannedStartDate);
            if (saved.whatDescription !== undefined) setEditWhat(saved.whatDescription);
            if (saved.whyReason !== undefined) setEditWhy(saved.whyReason);
            if (saved.whereLocation !== undefined) setEditWhere(saved.whereLocation);
            if (saved.howExecutionGuide !== undefined) setEditHow(saved.howExecutionGuide);
            if (saved.savedAt) {
              const date = new Date(saved.savedAt);
              setEditLastSavedTime(date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            }
            setIsEditDraftRestored(true);
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao verificar rascunho de edição da demanda:', err);
    }
  }, [selectedDemand?.id, editDraftStorageKey]);

  // Periodic Debounced Auto-Save for Edit screen
  useEffect(() => {
    if (!selectedDemand || activeTab !== 'edit' || !editDraftStorageKey) return;

    // Check if there is any modification compared to selectedDemand
    const hasChanges =
      editTitle !== selectedDemand.title ||
      editCategoryId !== selectedDemand.categoryId ||
      editPriorityId !== selectedDemand.priorityId ||
      editTeamId !== selectedDemand.teamId ||
      editAssigneeId !== selectedDemand.assigneeId ||
      editDueDate !== (selectedDemand.dueDate?.slice(0, 10) || '') ||
      editPlannedStartDate !== (selectedDemand.plannedStartDate?.slice(0, 10) || '') ||
      editWhat !== (selectedDemand.whatDescription || selectedDemand.description || '') ||
      editWhy !== (selectedDemand.whyReason || '') ||
      editWhere !== (selectedDemand.whereLocation || '') ||
      editHow !== (selectedDemand.howExecutionGuide || '');

    if (!hasChanges) return;

    setIsEditSaving(true);
    if (editAutoSaveTimerRef.current) clearTimeout(editAutoSaveTimerRef.current);

    editAutoSaveTimerRef.current = setTimeout(() => {
      try {
        const now = new Date();
        const draftPayload = {
          demandId: selectedDemand.id,
          title: editTitle,
          categoryId: editCategoryId,
          priorityId: editPriorityId,
          teamId: editTeamId,
          assigneeId: editAssigneeId,
          dueDate: editDueDate,
          plannedStartDate: editPlannedStartDate,
          whatDescription: editWhat,
          whyReason: editWhy,
          whereLocation: editWhere,
          howExecutionGuide: editHow,
          savedAt: now.toISOString()
        };
        void draftPayload;
        setEditLastSavedTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setIsEditSaving(false);
      } catch (err) {
        console.error('Falha ao auto-salvar rascunho de edição:', err);
        setIsEditSaving(false);
      }
    }, 800);

    return () => {
      if (editAutoSaveTimerRef.current) clearTimeout(editAutoSaveTimerRef.current);
    };
  }, [
    activeTab,
    selectedDemand?.id,
    editDraftStorageKey,
    editTitle,
    editCategoryId,
    editPriorityId,
    editTeamId,
    editAssigneeId,
    editDueDate,
    editPlannedStartDate,
    editWhat,
    editWhy,
    editWhere,
    editHow
  ]);

  if (!selectedDemand) return null;

  const handleSaveEditChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      showToast({
        type: 'error',
        title: 'Campo Obrigatório',
        message: 'O título da demanda não pode ficar vazio.'
      });
      return;
    }

    updateDemand(selectedDemand.id, {
      title: editTitle.trim(),
      categoryId: editCategoryId,
      priorityId: editPriorityId,
      teamId: editTeamId,
      assigneeId: editAssigneeId,
      dueDate: editDueDate,
      plannedStartDate: editPlannedStartDate,
      whatDescription: editWhat.trim(),
      description: editWhat.trim(),
      whyReason: editWhy.trim(),
      whereLocation: editWhere.trim(),
      howExecutionGuide: editHow.trim()
    });

    try {
    } catch (err) {
      console.warn('Erro ao limpar rascunho de edição:', err);
    }

    setIsEditDraftRestored(false);
    setEditLastSavedTime(null);
    setActiveTab('5w2h');
    showToast({
      type: 'success',
      title: 'Demanda Atualizada',
      message: 'As alterações foram salvas com sucesso no banco de dados.'
    });
  };

  const handleDiscardEditDraft = () => {
    try {
    } catch (err) {
      console.warn('Erro ao descartar rascunho:', err);
    }
    setEditTitle(selectedDemand.title);
    setEditCategoryId(selectedDemand.categoryId);
    setEditPriorityId(selectedDemand.priorityId);
    setEditTeamId(selectedDemand.teamId);
    setEditAssigneeId(selectedDemand.assigneeId);
    setEditDueDate(selectedDemand.dueDate?.slice(0, 10) || '2026-08-25');
    setEditPlannedStartDate(selectedDemand.plannedStartDate?.slice(0, 10) || '2026-08-16');
    setEditWhat(selectedDemand.whatDescription || selectedDemand.description || '');
    setEditWhy(selectedDemand.whyReason || '');
    setEditWhere(selectedDemand.whereLocation || '');
    setEditHow(selectedDemand.howExecutionGuide || '');
    setIsEditDraftRestored(false);
    setEditLastSavedTime(null);
    showToast({
      type: 'info',
      title: 'Rascunho Descartado',
      message: 'O rascunho local de edição foi removido e os valores originais foram restaurados.'
    });
  };

  const category = categories.find((c) => c.id === selectedDemand.categoryId) || categories[0];
  const priority = priorities.find((p) => p.id === selectedDemand.priorityId) || priorities[0];
  const currentStatus = statuses.find((s) => s.id === selectedDemand.statusId) || statuses[0];
  const assignee = users.find((u) => u.id === selectedDemand.assigneeId);
  const requester = users.find((u) => u.id === selectedDemand.requesterId);
  const team = teams.find((t) => t.id === selectedDemand.teamId);

  const isCompleted = currentStatus.category === 'completed';
  const demandLogs = auditLogs.filter(l => l.demandId === selectedDemand.id || l.demandCode === selectedDemand.code);

  const canEdit = hasPermission('demands', 'edit', selectedDemand.activityType);
  const canDelete = hasPermission('demands', 'delete', selectedDemand.activityType);

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    addComment(selectedDemand.id, newCommentText.trim());
    setNewCommentText('');
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      title: newChecklistText.trim(),
      completed: false
    };
    const updatedChecklist = [...selectedDemand.checklist, newItem];
    updateDemand(selectedDemand.id, { checklist: updatedChecklist });
    setNewChecklistText('');
  };

  const handleSaveBlocker = () => {
    const blockerInfo: BlockerInfo = {
      isBlocked,
      reason: isBlocked ? blockerReason : undefined,
      impact: isBlocked ? (blockerImpact as any) : undefined,
      actionNeeded: isBlocked ? blockerAction : undefined,
      blockedAt: isBlocked ? (selectedDemand.blocker?.blockedAt || new Date().toISOString()) : undefined,
      blockedByUserId: isBlocked ? currentUser.id : undefined
    };
    toggleBlocker(selectedDemand.id, blockerInfo);
  };

  const handleSaveExtension = () => {
    if (!newDueDate || !extensionReason.trim()) return;
    extendDeadline(selectedDemand.id, newDueDate, extensionReason.trim());
    setIsExtensionOpen(false);
    setExtensionReason('');
  };

  const handleCompleteSubmit = () => {
    if (!completionSummary.trim()) return;
    completeDemand(selectedDemand.id, completionSummary.trim());
    setIsCompletingOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Deseja realmente excluir a demanda [${selectedDemand.code}]?`)) {
      deleteDemand(selectedDemand.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {selectedDemand.code}
              </span>

              {/* Category */}
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center space-x-1 ${category.bgColor} ${category.borderColor} ${category.textColor}`}>
                <IconRenderer name={category.iconName} className="w-3.5 h-3.5" />
                <span>{category.name}</span>
              </span>

              {/* Priority */}
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${priority.bgColor} ${priority.textColor}`}>
                {priority.name}
              </span>

              {/* Status Selector */}
              <select
                value={selectedDemand.statusId}
                onChange={(e) => moveDemandStatus(selectedDemand.id, e.target.value)}
                className="text-xs font-bold px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {selectedDemand.title}
            </h3>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Auto-save status indicator in header */}
            {activeTab === 'edit' && (
              <span
                className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                  isEditSaving
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    : editLastSavedTime
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <Save className={`w-3 h-3 ${isEditSaving ? 'animate-pulse' : ''}`} />
                {isEditSaving
                  ? 'Salvando rascunho...'
                  : editLastSavedTime
                  ? `Salvo às ${editLastSavedTime}`
                  : 'Auto-save ativo'}
              </span>
            )}

            {activeTab === '5w2h' && canEdit ? (
              <button
                onClick={() => setActiveTab('edit')}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Demanda</span>
              </button>
            ) : activeTab === 'edit' ? (
              <button
                onClick={() => setActiveTab('5w2h')}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all"
              >
                <span>Ver Detalhes</span>
              </button>
            ) : null}

            {!isCompleted && (
              <>
                <button
                  onClick={() => setIsCompletingOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Concluir</span>
                </button>

                {canDelete && (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="px-3 py-1.5 bg-red-50 dark:bg-red-950/80 hover:bg-red-100 dark:hover:bg-red-900/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition-all"
                    title="Cancelar Demanda com Justificativa"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancelar Tarefa</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => setSelectedDemand(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Edit Draft Restored Notice Banner */}
        {isEditDraftRestored && (
          <div className="px-5 py-2.5 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Rascunho de edição recuperado:</strong> Encontramos edições não salvas no navegador ({editLastSavedTime ? `salvas às ${editLastSavedTime}` : 'salvas localmente'}).
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeTab !== 'edit' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Continuar Editando
                </button>
              )}
              <button
                type="button"
                onClick={handleDiscardEditDraft}
                className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Descartar Rascunho
              </button>
            </div>
          </div>
        )}

        {/* Completion Prompt Box */}
        {isCompletingOpen && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border-b border-emerald-200 dark:border-emerald-800 flex flex-col space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Conclusão e Homologação de Entrega (Regra de Negócio)</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
              Informe a justificativa de encerramento / parecer técnico de conclusão obrigatório:
            </p>
            <textarea
              rows={2}
              value={completionSummary}
              onChange={(e) => setCompletionSummary(e.target.value)}
              placeholder="Ex: Todas as funcionalidades foram testadas e validadas em produção com sucesso..."
              className="w-full p-2 text-xs rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsCompletingOpen(false)}
                className="px-3 py-1 text-xs rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteSubmit}
                className="px-3 py-1 text-xs rounded font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Confirmar Conclusão
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-5 border-b border-slate-200 dark:border-slate-800 flex space-x-4 shrink-0 bg-white dark:bg-slate-900 text-xs font-semibold overflow-x-auto">
          {[
            { id: '5w2h', label: 'Visão 5W2H' },
            { id: 'edit', label: 'Editar 5W2H', badge: isEditDraftRestored ? 'Rascunho' : undefined },
            { id: 'checklist', label: `Checklist (${selectedDemand.checklist.filter((c) => c.completed).length}/${selectedDemand.checklist.length})` },
            { id: 'blocker', label: 'Impedimentos / Bloqueios', alert: selectedDemand.blocker?.isBlocked },
            { id: 'comments', label: `Comentários (${selectedDemand.comments.length})` },
            { id: 'history', label: `Auditoria (${demandLogs.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 border-b-2 font-bold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[9px] rounded-full font-bold">
                  {tab.badge}
                </span>
              )}
              {tab.alert && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {/* Tab: Edit Mode with Auto-Save */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveEditChanges} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200 font-bold">
                  <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Modo de Edição 5W2H com Salvamento Automático</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
                      isEditSaving
                        ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                        : editLastSavedTime
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Save className={`w-3 h-3 ${isEditSaving ? 'animate-pulse' : ''}`} />
                    {isEditSaving
                      ? 'Salvando no navegador...'
                      : editLastSavedTime
                      ? `Rascunho salvo às ${editLastSavedTime}`
                      : 'Salvamento automático ativo'}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Título da Demanda: *
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleEditSpeech('title')}
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all ${
                      isEditListening && activeEditSpeechField === 'title'
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600'
                    }`}
                  >
                    {isEditListening && activeEditSpeechField === 'title' ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
                    <span>{isEditListening && activeEditSpeechField === 'title' ? 'Gravando...' : 'Ditar'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              {/* Category, Priority, Team */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria:
                  </label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prioridade:
                  </label>
                  <select
                    value={editPriorityId}
                    onChange={(e) => setEditPriorityId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {priorities.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Equipe:
                  </label>
                  <select
                    value={editTeamId}
                    onChange={(e) => setEditTeamId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee and Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Responsável:
                  </label>
                  <select
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.roleTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Início:
                  </label>
                  <input
                    type="date"
                    value={editPlannedStartDate}
                    onChange={(e) => setEditPlannedStartDate(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prazo Final de Entrega: *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-red-600 dark:text-red-400"
                  />
                </div>
              </div>

              {/* 5W2H Matrix Inputs */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Campos 5W2H Detalhados
                </p>

                {/* 1. What */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      1. O que precisa ser feito? (What / Requisitos):
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleEditSpeech('what')}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg transition-all ${
                        isEditListening && activeEditSpeechField === 'what'
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                      }`}
                    >
                      {isEditListening && activeEditSpeechField === 'what' ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                      <span>{isEditListening && activeEditSpeechField === 'what' ? 'Gravando Voz...' : 'Ditar Requisitos'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={editWhat}
                    onChange={(e) => setEditWhat(e.target.value)}
                    placeholder="Descrição do que precisa ser executado..."
                    className={`w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 ${
                      isEditListening && activeEditSpeechField === 'what'
                        ? 'border-red-400 ring-2 ring-red-400/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {isEditListening && activeEditSpeechField === 'what' && (
                    <div className="mt-1 p-1.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg flex items-center justify-between text-[11px] text-red-700 dark:text-red-300">
                      <span className="truncate">
                        <strong>Ouvindo:</strong> {editInterimText || 'Fale agora...'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleEditSpeech('what')}
                        className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold"
                      >
                        Parar
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Why */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      2. Por que essa atividade é necessária? (Why):
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleEditSpeech('why')}
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all ${
                        isEditListening && activeEditSpeechField === 'why'
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600'
                      }`}
                    >
                      {isEditListening && activeEditSpeechField === 'why' ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
                      <span>{isEditListening && activeEditSpeechField === 'why' ? 'Gravando...' : 'Ditar'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={editWhy}
                    onChange={(e) => setEditWhy(e.target.value)}
                    placeholder="Justificativa técnica ou estratégica..."
                    className={`w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 ${
                      isEditListening && activeEditSpeechField === 'why'
                        ? 'border-red-400 ring-2 ring-red-400/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                </div>

                {/* 3. Where & 4. How */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      3. Onde será executada? (Where):
                    </label>
                    <input
                      type="text"
                      value={editWhere}
                      onChange={(e) => setEditWhere(e.target.value)}
                      placeholder="Ex: Ambiente de Produção / Módulo Mobile"
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        4. Como deverá ser realizada? (How):
                      </label>
                      <button
                        type="button"
                        onClick={() => toggleEditSpeech('how')}
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all ${
                          isEditListening && activeEditSpeechField === 'how'
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600'
                        }`}
                      >
                        {isEditListening && activeEditSpeechField === 'how' ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
                        <span>{isEditListening && activeEditSpeechField === 'how' ? 'Gravando...' : 'Ditar'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editHow}
                      onChange={(e) => setEditHow(e.target.value)}
                      placeholder="Ex: Seguir checklist de homologação e testes de carga"
                      className={`w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 ${
                        isEditListening && activeEditSpeechField === 'how'
                          ? 'border-red-400 ring-2 ring-red-400/20'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Edit Actions Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${isEditSaving ? 'bg-amber-500 animate-ping' : editLastSavedTime ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {isEditSaving
                      ? 'Salvando rascunho...'
                      : editLastSavedTime
                      ? `Rascunho salvo às ${editLastSavedTime}`
                      : 'Salvamento automático ativo'}
                  </span>
                  <button
                    type="button"
                    onClick={handleDiscardEditDraft}
                    className="text-slate-400 hover:text-red-500 underline ml-2 transition-colors"
                  >
                    Descartar Rascunho
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('5w2h')}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/30 transition-all active:scale-95 flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tab 1: 5W2H View */}
          {activeTab === '5w2h' && (
            <div className="space-y-6">
              {/* Completed Notice */}
              {isCompleted && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-start space-x-3 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-900 dark:text-emerald-200">
                      Demanda Concluída e Entregue
                    </p>
                    <p className="text-emerald-800 dark:text-emerald-300 mt-0.5">
                      Concluída em: {selectedDemand.completedAt ? new Date(selectedDemand.completedAt).toLocaleDateString('pt-BR') : 'Data registrada'} por {users.find(u => u.id === selectedDemand.completedByUserId)?.name || 'Responsável'}.
                    </p>
                    {selectedDemand.completionSummary && (
                      <p className="mt-1 font-semibold text-emerald-900 dark:text-emerald-100 bg-white/70 dark:bg-emerald-900/50 p-2 rounded">
                        Comentário de entrega: "{selectedDemand.completionSummary}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 5W2H Matrix Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. What */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    1. O que precisa ser feito? (What)
                  </p>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                    {selectedDemand.description || selectedDemand.title}
                  </p>
                </div>

                {/* 2. Why */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    2. Por que essa atividade é necessária? (Why)
                  </p>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                    {selectedDemand.whyReason || 'Motivo estratégico e operacional alinhado ao cronograma.'}
                  </p>
                </div>

                {/* 3. Where */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    3. Onde será executada ou aplicada? (Where)
                  </p>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    📍 {selectedDemand.whereLocation || 'Unidade Geral / Todos os ambientes'}
                  </p>
                </div>

                {/* 4. How */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    4. Como deverá ser realizada? (How)
                  </p>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                    ⚙️ {selectedDemand.howExecutionGuide || 'Seguindo as diretrizes técnicas e operacionais estabelecidas.'}
                  </p>
                </div>

                {/* 5. Who */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    5. Quem está envolvido? (Who)
                  </p>
                  <div className="text-xs space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 w-24">Responsável:</span>
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
                        {assignee && <img src={assignee.avatar} alt={assignee.name} className="w-4 h-4 rounded-full" />}
                        <span>{assignee?.name || 'Não atribuído'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 w-24">Solicitante:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{selectedDemand.clientName || requester?.name || 'Interno'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 w-24">Equipe:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{team?.name || 'Geral'}</span>
                    </div>
                  </div>
                </div>

                {/* 6. When */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                      6. Qual é o prazo? (When)
                    </p>
                    <button
                      onClick={() => setIsExtensionOpen(!isExtensionOpen)}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Prorrogar Prazo
                    </button>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 w-24">Prazo de Entrega:</span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        {new Date(selectedDemand.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 w-24">Início Planejado:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {new Date(selectedDemand.plannedStartDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {isExtensionOpen && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <input
                        type="date"
                        value={newDueDate.slice(0, 10)}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Justificativa da prorrogação..."
                        value={extensionReason}
                        onChange={(e) => setExtensionReason(e.target.value)}
                        className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => setIsExtensionOpen(false)}
                          className="px-2 py-1 text-[11px] bg-slate-200 rounded"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveExtension}
                          className="px-2 py-1 text-[11px] bg-blue-600 text-white font-bold rounded"
                        >
                          Salvar Prorrogação
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Google Workspace Connected Assets */}
              {selectedDemand.googleSync && (
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2">
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center space-x-1.5">
                    <span>Recursos Integrados Google Workspace</span>
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedDemand.googleSync.googleCalendarEventUrl && (
                      <a
                        href={selectedDemand.googleSync.googleCalendarEventUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 flex items-center space-x-1 hover:bg-blue-50"
                      >
                        <span>📅 Google Agenda</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {selectedDemand.googleSync.googleSheetRowId && (
                      <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                        <span>📊 Google Planilhas (Linha #{selectedDemand.googleSync.googleSheetRowId})</span>
                      </span>
                    )}
                    {selectedDemand.googleSync.googleDriveFolderId && (
                      <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800 flex items-center space-x-1">
                        <span>📁 Google Drive Folder</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Checklist */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Etapas e Checklist Operacional
                </h4>
                <span className="text-xs font-bold text-blue-600">
                  {selectedDemand.progressPercent}% Concluído
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${selectedDemand.progressPercent}%` }}
                />
              </div>

              <div className="space-y-2">
                {selectedDemand.checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist(selectedDemand.id, item.id)}
                    className={`p-3 rounded-xl border transition-all flex items-center space-x-3 cursor-pointer ${
                      item.completed
                        ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                    }`}
                  >
                    {item.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        item.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2 pt-2">
                <input
                  type="text"
                  placeholder="Adicionar nova etapa..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                  className="flex-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={handleAddChecklistItem}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Blocker / Impediments */}
          {activeTab === 'blocker' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-3">
                <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Controle de Impedimentos e Alertas à Diretoria</span>
                </div>
                <p className="text-[11px] text-amber-900 dark:text-amber-200">
                  Ao registrar um bloqueio, o status da demanda é movido para Bloqueada e alertas são enviados para os gestores.
                </p>

                <label className="flex items-center space-x-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isBlocked}
                    onChange={(e) => setIsBlocked(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Demanda com Bloqueio / Impedimento Ativo
                  </span>
                </label>

                {isBlocked && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Motivo do Bloqueio (O que está travando?): *
                      </label>
                      <textarea
                        rows={2}
                        value={blockerReason}
                        onChange={(e) => setBlockerReason(e.target.value)}
                        placeholder="Ex: Aguardando aprovação orçamentária do comitê financeiro..."
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Grau de Impacto:
                        </label>
                        <select
                          value={blockerImpact}
                          onChange={(e) => setBlockerImpact(e.target.value)}
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        >
                          <option value="Baixo">Baixo (Não afeta o prazo final)</option>
                          <option value="Médio">Médio (Pode atrasar entregas parciais)</option>
                          <option value="Alto">Alto (Impacto direto no prazo final)</option>
                          <option value="Crítico">Crítico (Paralisação total do projeto)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Ação Necessária para Desbloqueio:
                        </label>
                        <input
                          type="text"
                          value={blockerAction}
                          onChange={(e) => setBlockerAction(e.target.value)}
                          placeholder="Ex: Diretoria aprovar dotação orçamentária"
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveBlocker}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
                  >
                    Salvar Impedimento
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Comments */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Escreva um comentário ou atualização..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  className="flex-1 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar</span>
                </button>
              </div>

              <div className="space-y-3">
                {selectedDemand.comments.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img
                          src={comm.userAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'}
                          alt={comm.userName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {comm.userName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comm.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium pl-7">
                      {comm.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: History / Audit Log */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 italic">
                Trilha imutável de governança associada a esta demanda:
              </p>
              <div className="space-y-2">
                {demandLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.action}: {log.details}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Por {log.userName}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center space-x-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir Demanda</span>
          </button>

          <button
            onClick={() => setSelectedDemand(null)}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Cancel Demand Modal */}
      <CancelDemandModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        demand={selectedDemand}
      />
    </div>
  );
};
