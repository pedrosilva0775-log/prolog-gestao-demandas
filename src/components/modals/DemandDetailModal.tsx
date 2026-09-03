/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AppSelect } from '../common/AppSelect';
import { features } from '../../config/features';
import { useApp } from '../../context/AppContext';
import { IconRenderer } from '../common/IconRenderer';
import { UserAvatar } from '../common/UserAvatar';
import {
  Demand,
  Comment,
  Attachment,
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
  Info,
  Mic,
  MicOff,
  Volume2,
  Ban,
  XCircle
} from 'lucide-react';
import { CancelDemandModal } from './CancelDemandModal';
import { formatCalendarDate, toLocalDateInput } from '../../utils/date';
import { useClients } from '../../context/ClientsContext';

const todayInput=()=>toLocalDateInput();
const defaultDueInput=()=>toLocalDateInput(new Date(Date.now()+7*86400000));

export const DemandDetailModal: React.FC = () => {
  const { clients } = useClients();
  const {
    selectedDemand,
    setSelectedDemand,
    updateDemand,
    deleteDemand,
    moveDemandStatus,
    toggleBlocker,
    extendDeadline,
    addComment,
    editComment,
    toggleChecklist,
    completeDemand,
    statuses,
    priorities,
    categories,
    users,
    teams,
    demands,
    currentUser,
    auditLogs,
    showToast,
    hasPermission
  } = useApp();

  const [activeTab, setActiveTab] = useState<'5w2h' | 'edit' | 'checklist' | 'blocker' | 'comments' | 'history'>('5w2h');
  const [newCommentText, setNewCommentText] = useState('');
  const [commentImages, setCommentImages] = useState<Attachment[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [isCommentDragActive, setIsCommentDragActive] = useState(false);
  const commentImageInputRef = useRef<HTMLInputElement>(null);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [editingChecklistItemId, setEditingChecklistItemId] = useState<string | null>(null);
  const [editingChecklistText, setEditingChecklistText] = useState('');
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);

  // Blocker form state
  const [isBlocked, setIsBlocked] = useState(selectedDemand?.blocker?.isBlocked || false);
  const [blockerKind, setBlockerKind] = useState<'blocker' | 'impediment'>(selectedDemand?.blocker?.kind || 'blocker');
  const [blockerReason, setBlockerReason] = useState(selectedDemand?.blocker?.reason || '');
  const [blockerImpact, setBlockerImpact] = useState(selectedDemand?.blocker?.impact || 'Alto');
  const [blockerAction, setBlockerAction] = useState(selectedDemand?.blocker?.actionNeeded || '');
  const [createRelatedTask, setCreateRelatedTask] = useState(selectedDemand?.blocker?.createRelatedTask || false);
  const [blockerResponsibleTeamId, setBlockerResponsibleTeamId] = useState(selectedDemand?.blocker?.responsibleTeamId || '');
  const [isSavingBlocker, setIsSavingBlocker] = useState(false);

  // Completion modal/box
  const [completionSummary, setCompletionSummary] = useState(selectedDemand?.completionSummary || '');
  const [isCompletingOpen, setIsCompletingOpen] = useState(false);
  const [completionError, setCompletionError] = useState('');
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
  const [editClientId, setEditClientId] = useState(selectedDemand?.clientId || '');
  const [editDueDate, setEditDueDate] = useState(selectedDemand?.dueDate?.slice(0, 10) || defaultDueInput());
  const [editPlannedStartDate, setEditPlannedStartDate] = useState(selectedDemand?.plannedStartDate?.slice(0, 10) || todayInput());
  const [editWhat, setEditWhat] = useState(selectedDemand?.whatDescription || selectedDemand?.description || '');
  const [editWhy, setEditWhy] = useState(selectedDemand?.whyReason || '');
  const [editWhere, setEditWhere] = useState(selectedDemand?.whereLocation || '');
  const [editHow, setEditHow] = useState(selectedDemand?.howExecutionGuide || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
    } catch {
      setIsEditListening(false);
      setActiveEditSpeechField(null);
    }
  };

  // Reset edit fields when the selected demand changes.
  useEffect(() => {
    if (!selectedDemand) return;

    setEditTitle(selectedDemand.title);
    setEditCategoryId(selectedDemand.categoryId);
    setEditPriorityId(selectedDemand.priorityId);
    setEditTeamId(selectedDemand.teamId);
    setEditAssigneeId(selectedDemand.assigneeId);
    setEditClientId(selectedDemand.clientId || '');
    setEditDueDate(selectedDemand.dueDate?.slice(0, 10) || defaultDueInput());
    setEditPlannedStartDate(selectedDemand.plannedStartDate?.slice(0, 10) || todayInput());
    setEditWhat(selectedDemand.whatDescription || selectedDemand.description || '');
    setEditWhy(selectedDemand.whyReason || '');
    setEditWhere(selectedDemand.whereLocation || '');
    setEditHow(selectedDemand.howExecutionGuide || '');
    setIsBlocked(selectedDemand.blocker?.isBlocked || false);
    setBlockerKind(selectedDemand.blocker?.kind || 'blocker');
    setBlockerReason(selectedDemand.blocker?.reason || '');
    setBlockerImpact(selectedDemand.blocker?.impact || 'Alto');
    setCreateRelatedTask(selectedDemand.blocker?.createRelatedTask || false);
    setBlockerResponsibleTeamId(selectedDemand.blocker?.responsibleTeamId || '');
    setBlockerAction(selectedDemand.blocker?.actionNeeded || '');
    setNewDueDate(selectedDemand.dueDate);
  }, [selectedDemand]);

  if (!selectedDemand) return null;

  const hasPendingEditChanges = Boolean(selectedDemand) && (
    editTitle.trim() !== selectedDemand.title ||
    editCategoryId !== selectedDemand.categoryId ||
    editPriorityId !== selectedDemand.priorityId ||
    editTeamId !== selectedDemand.teamId ||
    editAssigneeId !== selectedDemand.assigneeId ||
    editClientId !== (selectedDemand.clientId || '') ||
    editDueDate !== (selectedDemand.dueDate?.slice(0, 10) || '') ||
    editPlannedStartDate !== (selectedDemand.plannedStartDate?.slice(0, 10) || '') ||
    editWhat.trim() !== (selectedDemand.whatDescription || selectedDemand.description || '') ||
    editWhy.trim() !== (selectedDemand.whyReason || '') ||
    editWhere.trim() !== (selectedDemand.whereLocation || '') ||
    editHow.trim() !== (selectedDemand.howExecutionGuide || '')
  );

  const handleCloseModal = () => {
    if (activeTab === 'edit' && hasPendingEditChanges) {
      setIsDiscardConfirmOpen(true);
      return;
    }
    setSelectedDemand(null);
  };

  const handleSaveEditChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      showToast({
        type: 'error',
        title: 'Campo Obrigatório',
        message: 'O título da demanda não pode ficar vazio.'
      });
      return;
    }

    if (!hasPendingEditChanges || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await updateDemand(selectedDemand.id, {
        title: editTitle.trim(),
        categoryId: editCategoryId,
        priorityId: editPriorityId,
        teamId: editTeamId,
        assigneeId: editAssigneeId,
        clientId: editClientId || null,
        clientName: clients.find(client => client.id === editClientId)?.company || '',
        dueDate: editDueDate,
        plannedStartDate: editPlannedStartDate,
        description: editWhat.trim(),
        whyReason: editWhy.trim(),
        whereLocation: editWhere.trim(),
        howExecutionGuide: editHow.trim()
      });
      setActiveTab('5w2h');
      showToast({
        type: 'success',
        title: 'Demanda Atualizada',
        message: 'Equipe e demais alterações foram confirmadas no banco de dados.'
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Edições não salvas',
        message: error instanceof Error ? error.message : 'Não foi possível salvar as alterações.'
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleResetEditForm = () => {
    setEditTitle(selectedDemand.title);
    setEditCategoryId(selectedDemand.categoryId);
    setEditPriorityId(selectedDemand.priorityId);
    setEditTeamId(selectedDemand.teamId);
    setEditAssigneeId(selectedDemand.assigneeId);
    setEditClientId(selectedDemand.clientId || '');
    setEditDueDate(selectedDemand.dueDate?.slice(0, 10) || defaultDueInput());
    setEditPlannedStartDate(selectedDemand.plannedStartDate?.slice(0, 10) || todayInput());
    setEditWhat(selectedDemand.whatDescription || selectedDemand.description || '');
    setEditWhy(selectedDemand.whyReason || '');
    setEditWhere(selectedDemand.whereLocation || '');
    setEditHow(selectedDemand.howExecutionGuide || '');
    showToast({
      type: 'info',
      title: 'Valores restaurados',
      message: 'O formulário voltou aos dados atualmente persistidos.'
    });
  };

  const category = categories.find((c) => c.id === selectedDemand.categoryId) || categories[0];
  const priority = priorities.find((p) => p.id === selectedDemand.priorityId) || priorities[0];
  const currentStatus = statuses.find((s) => s.id === selectedDemand.statusId) || statuses[0];
  const assignee = users.find((u) => u.id === selectedDemand.assigneeId);
  const team = teams.find((t) => t.id === selectedDemand.teamId);
  const demandClient = clients.find((client) => client.id === selectedDemand.clientId);
  const demandClientLabel = demandClient
    ? `${demandClient.company} — ${demandClient.name}`
    : selectedDemand.clientName || 'Solicitação interna / sem cliente';
  const categoryName = category?.name.trim().toLocaleLowerCase('pt-BR') || '';
  const isDetailedCategory = categoryName === 'projeto' || categoryName === 'melhoria';
  const editCategoryName = categories.find(item => item.id === editCategoryId)?.name.trim().toLocaleLowerCase('pt-BR') || '';
  const isDetailedEditCategory = editCategoryName === 'projeto' || editCategoryName === 'melhoria';

  const isCompleted = currentStatus.category === 'completed';
  const demandLogs = auditLogs.filter(l => l.demandId === selectedDemand.id || l.demandCode === selectedDemand.code);

  const canEdit = hasPermission('demands', 'edit', selectedDemand.activityType);
  const canDelete = hasPermission('demands', 'delete', selectedDemand.activityType);
  const canReadComments = hasPermission('comments', 'read');
  const canCreateComments = hasPermission('comments', 'create');
  const canEditOwnComments = hasPermission('comments', 'edit');
  const canManageComments = hasPermission('comments', 'admin');

  const handleAddComment = async () => {
    if (!newCommentText.trim() && commentImages.length === 0) return;
    setSavingComment(true);
    try {
      await addComment(selectedDemand.id, newCommentText.trim() || 'Imagem anexada.', commentImages);
      setNewCommentText(''); setCommentImages([]);
    } catch (error) {
      showToast({ type: 'error', title: 'Comentário não enviado', message: error instanceof Error ? error.message : 'Falha ao salvar comentário.' });
    } finally { setSavingComment(false); }
  };

  const handleCommentImages = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files).slice(0, Math.max(0, 2 - commentImages.length))) {
      if (!file.type.startsWith('image/')) { showToast({ type: 'warning', title: 'Arquivo ignorado', message: `${file.name} não é uma imagem.` }); continue; }
      if (file.size > 2 * 1024 * 1024) { showToast({ type: 'warning', title: 'Imagem muito grande', message: `${file.name} excede o limite de 2 MB.` }); continue; }
      const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
      setCommentImages(previous => [...previous, { id: `att-${crypto.randomUUID()}`, name: file.name, size: file.size, type: file.type, url, uploadedByUserId: currentUser.id, uploadedAt: new Date().toISOString(), sourceDevice: 'web' }].slice(0, 2));
    }
    if (commentImageInputRef.current) commentImageInputRef.current.value = '';
  };

  const handleCommentDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); event.stopPropagation(); setIsCommentDragActive(false);
    if (!canManageComments) return;
    void handleCommentImages(event.dataTransfer.files);
  };

  const handleSaveCommentEdit = async () => {
    if (!editingCommentId || !editingCommentText.trim()) return;
    setSavingComment(true);
    try { await editComment(selectedDemand.id, editingCommentId, editingCommentText); setEditingCommentId(null); setEditingCommentText(''); }
    catch (error) { showToast({ type: 'error', title: 'Comentário não editado', message: error instanceof Error ? error.message : 'Falha ao editar comentário.' }); }
    finally { setSavingComment(false); }
  };

  const saveChecklist = async (checklist: ChecklistItem[]) => {
    const completedCount = checklist.filter(item => item.completed).length;
    const progressPercent = checklist.length > 0
      ? Math.round((completedCount / checklist.length) * 100)
      : 0;

    setIsSavingChecklist(true);
    try {
      await updateDemand(selectedDemand.id, { checklist, progressPercent });
      return true;
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Checklist não atualizado',
        message: error instanceof Error ? error.message : 'Não foi possível salvar o checklist.'
      });
      return false;
    } finally {
      setIsSavingChecklist(false);
    }
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      title: newChecklistText.trim(),
      completed: false
    };
    const updatedChecklist = [...selectedDemand.checklist, newItem];
    if (await saveChecklist(updatedChecklist)) setNewChecklistText('');
  };

  const handleOpenChecklistEditor = (event: React.MouseEvent, item: ChecklistItem) => {
    event.preventDefault();
    if (!canEdit) return;
    setEditingChecklistItemId(item.id);
    setEditingChecklistText(item.title);
  };

  const handleSaveChecklistItem = async () => {
    if (!editingChecklistItemId || !editingChecklistText.trim()) return;
    const updatedChecklist = selectedDemand.checklist.map(item =>
      item.id === editingChecklistItemId
        ? { ...item, title: editingChecklistText.trim() }
        : item
    );
    if (await saveChecklist(updatedChecklist)) {
      setEditingChecklistItemId(null);
      setEditingChecklistText('');
    }
  };

  const handleDeleteChecklistItem = async () => {
    if (!editingChecklistItemId) return;
    const updatedChecklist = selectedDemand.checklist.filter(item => item.id !== editingChecklistItemId);
    if (await saveChecklist(updatedChecklist)) {
      setEditingChecklistItemId(null);
      setEditingChecklistText('');
    }
  };

  const handleSaveBlocker = async () => {
    if (isBlocked && !blockerReason.trim()) {
      showToast({ type: 'error', title: 'Informe o motivo', message: 'O motivo do bloqueio é obrigatório.' });
      return;
    }
    if (isBlocked && createRelatedTask && !blockerResponsibleTeamId) {
      showToast({ type: 'error', title: 'Selecione a equipe', message: 'A equipe responsável é obrigatória para criar a atividade relacionada.' });
      return;
    }
    const blockerInfo: BlockerInfo = {
      isBlocked,
      kind: blockerKind,
      reason: isBlocked ? blockerReason.trim() : undefined,
      impact: isBlocked ? (blockerImpact as any) : undefined,
      actionNeeded: isBlocked ? blockerAction.trim() : undefined,
      blockedAt: isBlocked ? (selectedDemand.blocker?.blockedAt || new Date().toISOString()) : undefined,
      blockedByUserId: isBlocked ? currentUser.id : undefined
      ,createRelatedTask: isBlocked && createRelatedTask
      ,responsibleTeamId: isBlocked && createRelatedTask ? blockerResponsibleTeamId : undefined
    };
    setIsSavingBlocker(true);
    try {
      await toggleBlocker(selectedDemand.id, blockerInfo);
      showToast({
        type: 'success',
        title: isBlocked ? (blockerKind === 'impediment' ? 'Impedimento registrado' : 'Bloqueio registrado') : 'Registro resolvido',
        message: isBlocked ? (createRelatedTask ? `O ${blockerKind === 'impediment' ? 'impedimento' : 'bloqueio'} foi salvo e uma atividade relacionada foi criada.` : `O ${blockerKind === 'impediment' ? 'impedimento' : 'bloqueio'} foi persistido.`) : 'O registro foi resolvido.'
      });
    } catch (error) {
      showToast({ type: 'error', title: 'Bloqueio não salvo', message: error instanceof Error ? error.message : 'Falha ao persistir o bloqueio.' });
    } finally {
      setIsSavingBlocker(false);
    }
  };

  const handleSaveExtension = () => {
    if (!newDueDate || !extensionReason.trim()) return;
    extendDeadline(selectedDemand.id, newDueDate, extensionReason.trim());
    setIsExtensionOpen(false);
    setExtensionReason('');
  };

  const handleCompleteSubmit = async () => {
    if (!completionSummary.trim()) return;
    setCompletionError('');
    setIsSubmittingCompletion(true);
    try {
      await completeDemand(selectedDemand.id, completionSummary.trim());
      setIsCompletingOpen(false);
      setCompletionSummary('');
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : 'Não foi possível concluir a demanda. Verifique os requisitos e tente novamente.');
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  const handleDelete = () => setIsDeleteConfirmOpen(true);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDemand(selectedDemand.id, deleteReason.trim() || undefined);
      setIsDeleteConfirmOpen(false);
      setDeleteReason('');
    } catch (error) {
      showToast({ type: 'error', title: 'Demanda não excluída', message: error instanceof Error ? error.message : 'Não foi possível excluir a demanda.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div data-modal-overlay="true" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
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
              <AppSelect
                value={selectedDemand.statusId}
                onChange={(e) => moveDemandStatus(selectedDemand.id, e.target.value)}
                disabled={isCompleted || Boolean(selectedDemand.blocker?.isBlocked && selectedDemand.blocker.kind !== 'impediment')}
                title={isCompleted ? 'Demandas concluídas não podem ser reabertas nesta versão.' : selectedDemand.blocker?.isBlocked && selectedDemand.blocker.kind !== 'impediment' ? 'Resolva o bloqueio antes de alterar o status' : undefined}
                className="text-xs font-bold px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {statuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </AppSelect>
              {isCompleted && <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Reabertura indisponível nesta versão.</span>}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {selectedDemand.title}
            </h3>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
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
                  onClick={() => { setCompletionError(''); setIsCompletingOpen(true); }}
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
              data-modal-close="true"
              aria-label="Fechar"
              onClick={handleCloseModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

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
              onChange={(e) => { setCompletionSummary(e.target.value); setCompletionError(''); }}
              placeholder="Ex: Todas as funcionalidades foram testadas e validadas em produção com sucesso..."
              className="w-full p-2 text-xs rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
            {completionError && (
              <div role="alert" aria-live="assertive" className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div><strong className="block">Não foi possível concluir</strong><span>{completionError}</span></div>
              </div>
            )}
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => { setCompletionError(''); setIsCompletingOpen(false); }}
                disabled={isSubmittingCompletion}
                className="px-3 py-1 text-xs rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteSubmit}
                disabled={isSubmittingCompletion || !completionSummary.trim()}
                className="px-3 py-1 text-xs rounded font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingCompletion ? 'Concluindo...' : 'Confirmar Conclusão'}
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-5 border-b border-slate-200 dark:border-slate-800 flex space-x-4 shrink-0 bg-white dark:bg-slate-900 text-xs font-semibold overflow-x-auto">
          {[
            { id: '5w2h', label: isDetailedCategory ? 'Visão 5W2H' : 'Informações Básicas' },
            { id: 'edit', label: isDetailedCategory ? 'Editar 5W2H' : 'Editar Demanda' },
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
              {tab.alert && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {/* Tab: Edit Mode */}
          {activeTab === 'edit' && (
            <form id="demand-edit-form" onSubmit={handleSaveEditChanges} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40 flex items-center gap-2">
                <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200 font-bold">
                  <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{isDetailedEditCategory ? 'Modo de Edição 5W2H' : 'Editar informações básicas'}</span>
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

              {!isDetailedEditCategory && <div><label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">Descrição da demanda:</label><textarea rows={3} value={editWhat} onChange={event => setEditWhat(event.target.value)} placeholder="Descreva objetivamente o que precisa ser realizado..." className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"/></div>}

              {/* Category, Priority, Team */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria:
                  </label>
                  <AppSelect
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </AppSelect>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prioridade:
                  </label>
                  <AppSelect
                    value={editPriorityId}
                    onChange={(e) => setEditPriorityId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {priorities.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </AppSelect>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Equipe:
                  </label>
                  <AppSelect
                    value={editTeamId}
                    onChange={(e) => setEditTeamId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </AppSelect>
                </div>
              </div>

              <div>
                <label htmlFor="edit-demand-client" className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Cliente solicitante:
                </label>
                <AppSelect
                  id="edit-demand-client"
                  value={editClientId}
                  onChange={(event) => setEditClientId(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Solicitação interna / sem cliente</option>
                  {clients.filter((client) => client.active || client.id === editClientId).map((client) => (
                    <option key={client.id} value={client.id}>{client.company} — {client.name}</option>
                  ))}
                </AppSelect>
                {clients.length === 0 && (
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Nenhum cliente cadastrado.</p>
                )}
              </div>

              {/* Assignee and Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Responsável:
                  </label>
                  <AppSelect
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.roleTitle})
                      </option>
                    ))}
                  </AppSelect>
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
              {isDetailedEditCategory && <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
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
              </div>}

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
              {!isDetailedCategory && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 md:col-span-2"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Descrição da demanda</p><p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">{selectedDemand.description || selectedDemand.whatDescription || selectedDemand.title}</p></div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Classificação</p><dl className="mt-2 space-y-2 text-xs"><div className="flex justify-between gap-3"><dt className="text-slate-500">Categoria</dt><dd className="font-bold text-slate-800 dark:text-slate-200">{category?.name || 'Não informada'}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Prioridade</dt><dd className="font-bold text-slate-800 dark:text-slate-200">{priority?.name || 'Não informada'}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Status</dt><dd className="font-bold text-blue-600 dark:text-blue-400">{currentStatus?.name || 'Não informado'}</dd></div></dl></div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Responsáveis</p><dl className="mt-2 space-y-2 text-xs"><div className="flex justify-between gap-3"><dt className="text-slate-500">Responsável</dt><dd className="font-bold text-slate-800 dark:text-slate-200">{assignee?.name || 'Não atribuído'}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Equipe</dt><dd className="font-bold text-blue-600 dark:text-blue-400">{team?.name || 'Não informada'}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Cliente</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{demandClientLabel}</dd></div></dl></div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 md:col-span-2"><div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Período da atividade</p><button onClick={() => setIsExtensionOpen(!isExtensionOpen)} className="text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400">Prorrogar prazo</button></div><div className="mt-3 grid grid-cols-2 gap-4 text-xs"><div><span className="block text-slate-500">Data de início</span><strong className="mt-1 block text-slate-800 dark:text-slate-200">{formatCalendarDate(selectedDemand.plannedStartDate)}</strong></div><div><span className="block text-slate-500">Prazo final</span><strong className="mt-1 block text-red-600 dark:text-red-400">{formatCalendarDate(selectedDemand.dueDate)}</strong></div></div>{isExtensionOpen && <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700"><input type="date" value={newDueDate.slice(0,10)} onChange={event => setNewDueDate(event.target.value)} className="w-full rounded border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"/><input type="text" value={extensionReason} onChange={event => setExtensionReason(event.target.value)} placeholder="Justificativa da prorrogação..." className="w-full rounded border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"/><div className="flex justify-end gap-2"><button onClick={() => setIsExtensionOpen(false)} className="rounded bg-slate-200 px-3 py-1.5 text-xs dark:bg-slate-700">Cancelar</button><button onClick={handleSaveExtension} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">Salvar</button></div></div>}</div>
                </div>
              )}
              {isDetailedCategory && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {assignee && <UserAvatar name={assignee.name} src={assignee.avatar} className="w-4 h-4 rounded-full text-[7px]" />}
                        <span>{assignee?.name || 'Não atribuído'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 w-24">Solicitante:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{demandClientLabel}</span>
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
                        {formatCalendarDate(selectedDemand.dueDate)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 w-24">Início Planejado:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {formatCalendarDate(selectedDemand.plannedStartDate)}
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
              </div>}

              {/* Google Workspace Connected Assets */}
              {isDetailedCategory && features.googleWorkspace && selectedDemand.googleSync && (
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
                    onContextMenu={(event) => handleOpenChecklistEditor(event, item)}
                    title={canEdit ? 'Clique para concluir. Clique com o botão direito para editar ou excluir.' : undefined}
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
                {selectedDemand.checklist.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-center text-xs text-slate-500 dark:text-slate-400">
                    Esta demanda não possui etapas de checklist.
                  </div>
                )}
              </div>

              {editingChecklistItemId && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">Editar etapa do checklist</h5>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Altere o texto ou exclua esta etapa da demanda.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setEditingChecklistItemId(null); setEditingChecklistText(''); }}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-800 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                      aria-label="Fechar edição da etapa"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editingChecklistText}
                    onChange={(event) => setEditingChecklistText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void handleSaveChecklistItem();
                      if (event.key === 'Escape') { setEditingChecklistItemId(null); setEditingChecklistText(''); }
                    }}
                    autoFocus
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDeleteChecklistItem()}
                      disabled={isSavingChecklist}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir etapa
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveChecklistItem()}
                      disabled={isSavingChecklist || !editingChecklistText.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {isSavingChecklist ? 'Salvando...' : 'Salvar alteração'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <input
                  type="text"
                  placeholder="Adicionar nova etapa..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleAddChecklistItem()}
                  disabled={!canEdit || isSavingChecklist}
                  className="flex-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={() => void handleAddChecklistItem()}
                  disabled={!canEdit || isSavingChecklist || !newChecklistText.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1 disabled:opacity-50"
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
                  Bloqueios paralisam o fluxo e movem a demanda para Bloqueada. Impedimentos sinalizam a restrição, mas preservam e permitem alterar o status operacional.
                </p>

                <label className="flex items-center space-x-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isBlocked}
                    onChange={(e) => setIsBlocked(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Demanda com restrição ativa
                  </span>
                </label>

                {isBlocked && (
                  <div className="space-y-3 pt-2">
                    <fieldset>
                      <legend className="mb-1.5 block font-bold text-slate-700 dark:text-slate-300">Tipo da restrição:</legend>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <label className={`cursor-pointer rounded-xl border p-3 ${blockerKind === 'blocker' ? 'border-red-500 bg-red-50 dark:bg-red-950/40' : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'}`}><input type="radio" name="blocker-kind" value="blocker" checked={blockerKind === 'blocker'} onChange={() => setBlockerKind('blocker')} className="mr-2"/><strong>Bloqueio</strong><span className="mt-1 block text-[11px] text-slate-500">Paralisa a atividade e fixa o status como Bloqueada.</span></label>
                        <label className={`cursor-pointer rounded-xl border p-3 ${blockerKind === 'impediment' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'}`}><input type="radio" name="blocker-kind" value="impediment" checked={blockerKind === 'impediment'} onChange={() => setBlockerKind('impediment')} className="mr-2"/><strong>Impedimento</strong><span className="mt-1 block text-[11px] text-slate-500">Sinaliza a restrição, mantendo o status livre no fluxo.</span></label>
                      </div>
                    </fieldset>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Motivo do {blockerKind === 'impediment' ? 'Impedimento' : 'Bloqueio'}: *
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
                        <AppSelect
                          value={blockerImpact}
                          onChange={(e) => setBlockerImpact(e.target.value)}
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        >
                          <option value="Baixo">Baixo (Não afeta o prazo final)</option>
                          <option value="Médio">Médio (Pode atrasar entregas parciais)</option>
                          <option value="Alto">Alto (Impacto direto no prazo final)</option>
                          <option value="Crítico">Crítico (Paralisação total do projeto)</option>
                        </AppSelect>
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
                    <label className="flex items-start gap-2 rounded-lg border border-amber-300 bg-white p-3 dark:border-amber-800 dark:bg-slate-900">
                      <input type="checkbox" checked={createRelatedTask} onChange={event => setCreateRelatedTask(event.target.checked)} className="mt-0.5 h-4 w-4 rounded text-blue-600" />
                      <span><strong className="block text-slate-800 dark:text-slate-100">Criar atividade para a equipe responsável</strong><span className="text-[11px] text-slate-500">Marque somente quando outra equipe precisar executar uma entrega. Esperas simples não geram uma nova tarefa.</span></span>
                    </label>
                    {createRelatedTask && <div><label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">Equipe responsável pela resolução: *</label><AppSelect value={blockerResponsibleTeamId} onChange={event => setBlockerResponsibleTeamId(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><option value="">Selecione uma equipe</option>{teams.filter(team => team.active).map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</AppSelect></div>}
                    {selectedDemand.blocker?.linkedDemandId && <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">Atividade relacionada: {demands.find(item => item.id === selectedDemand.blocker?.linkedDemandId)?.code || selectedDemand.blocker.linkedDemandId}</div>}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => void handleSaveBlocker()}
                    disabled={isSavingBlocker || (isBlocked && (!blockerReason.trim() || (createRelatedTask && !blockerResponsibleTeamId)))}
                    className={`px-4 py-2 text-white rounded-lg font-bold disabled:cursor-not-allowed disabled:opacity-50 ${blockerKind === 'impediment' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {isSavingBlocker ? 'Salvando...' : isBlocked ? (createRelatedTask ? 'Salvar e criar atividade' : `Salvar ${blockerKind === 'impediment' ? 'impedimento' : 'bloqueio'}`) : 'Confirmar resolução'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Comments */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {!canReadComments ? <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Você não possui permissão para visualizar comentários.</p> : canCreateComments && <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex space-x-2"><textarea rows={2} placeholder="Escreva um comentário ou atualização..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} className="flex-1 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100" /><button disabled={savingComment} onClick={() => void handleAddComment()} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center space-x-1 disabled:opacity-60"><Send className="w-4 h-4" /><span>Enviar</span></button></div>
                {canManageComments && <><input ref={commentImageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="hidden" onChange={event => void handleCommentImages(event.target.files)} /><div role="button" tabIndex={0} onClick={() => commentImages.length < 2 && commentImageInputRef.current?.click()} onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && commentImages.length < 2) commentImageInputRef.current?.click(); }} onDragEnter={event => { event.preventDefault(); event.stopPropagation(); setIsCommentDragActive(true); }} onDragOver={event => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'copy'; setIsCommentDragActive(true); }} onDragLeave={event => { event.preventDefault(); event.stopPropagation(); if (event.currentTarget === event.target) setIsCommentDragActive(false); }} onDrop={handleCommentDrop} className={`flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-3 text-center transition-all ${isCommentDragActive ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 dark:bg-blue-950/40' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-900/50'} ${commentImages.length >= 2 ? 'cursor-not-allowed opacity-60' : ''}`}><Plus className={`mb-1 h-6 w-6 ${isCommentDragActive ? 'text-blue-600' : 'text-slate-400'}`}/><p className="text-sm font-bold text-slate-700 dark:text-slate-200">{isCommentDragActive ? 'Solte as imagens aqui' : 'Arraste e solte as evidências'}</p><p className="mt-0.5 text-xs text-slate-500">ou clique para selecionar · {commentImages.length}/2 imagens</p></div></>}
                {commentImages.length > 0 && <div className="grid grid-cols-2 gap-2">{commentImages.map(image => <div key={image.id} className="relative overflow-hidden rounded-xl border border-slate-200"><img src={image.url} alt={image.name} className="h-28 w-full object-cover"/><button type="button" aria-label={`Remover ${image.name}`} onClick={() => setCommentImages(previous => previous.filter(item => item.id !== image.id))} className="absolute right-1 top-1 rounded-full bg-slate-950/75 p-1 text-white"><X className="h-3.5 w-3.5"/></button></div>)}</div>}
                <p className="text-[11px] text-slate-500">Até 2 imagens, com no máximo 2 MB cada.</p>
              </div>}

              {canReadComments && <div className="space-y-3">
                {selectedDemand.comments.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <UserAvatar name={comm.userName} src={comm.userAvatar} className="w-5 h-5 rounded-full text-[8px]" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {comm.userName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2"><span className="text-[10px] text-slate-400">{new Date(comm.createdAt).toLocaleString('pt-BR')}{comm.editedAt ? ' · editado' : ''}</span>{((comm.userId === currentUser.id && canEditOwnComments) || canManageComments) && <button type="button" title="Editar comentário" onClick={() => { setEditingCommentId(comm.id); setEditingCommentText(comm.content); }} className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-blue-600"><Edit3 className="h-3.5 w-3.5"/></button>}</div>
                    </div>
                    {editingCommentId === comm.id ? <div className="flex gap-2 pl-7"><textarea autoFocus rows={2} value={editingCommentText} onChange={event => setEditingCommentText(event.target.value)} className="flex-1 rounded-lg border border-blue-300 bg-white p-2 text-sm dark:bg-slate-900"/><button disabled={savingComment} onClick={() => void handleSaveCommentEdit()} className="rounded-lg bg-blue-600 px-3 text-white"><Save className="h-4 w-4"/></button><button onClick={() => setEditingCommentId(null)} className="rounded-lg border px-3"><X className="h-4 w-4"/></button></div> : <p className="text-slate-700 dark:text-slate-300 font-medium pl-7 whitespace-pre-wrap">{comm.content}</p>}
                    {comm.attachments?.length ? <div className="grid grid-cols-1 gap-2 pl-7 sm:grid-cols-2">{comm.attachments.filter(item => item.type.startsWith('image/')).map(image => <a key={image.id} href={image.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200"><img src={image.url} alt={image.name} className="max-h-64 w-full object-contain bg-slate-100"/><span className="block truncate px-2 py-1 text-[10px] text-slate-500">{image.name}</span></a>)}</div> : null}
                  </div>
                ))}
              </div>}
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

          <div className="flex flex-wrap items-center justify-end gap-2">
            {activeTab === 'edit' && <>
              <button type="button" onClick={handleResetEditForm} disabled={!hasPendingEditChanges || isSavingEdit} className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40">Restaurar valores</button>
              <button form="demand-edit-form" type="submit" disabled={!hasPendingEditChanges || isSavingEdit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"><Save className={`w-3.5 h-3.5 ${isSavingEdit ? 'animate-pulse' : ''}`} /><span>{isSavingEdit ? 'Salvando...' : hasPendingEditChanges ? 'Salvar edições' : 'Sem alterações'}</span></button>
            </>}
            <button data-modal-close="true" onClick={handleCloseModal} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors">Fechar</button>
          </div>
        </div>
      </div>

      {/* Cancel Demand Modal */}
      <CancelDemandModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        demand={selectedDemand}
      />

      {isDiscardConfirmOpen && (
        <div data-modal-overlay="true" data-modal-decision="true" className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="discard-title">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xl dark:border-amber-900 dark:bg-slate-900">
            <div className="flex items-start gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
              <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><AlertTriangle className="h-5 w-5" /></div>
              <div><h3 id="discard-title" className="text-base font-bold text-slate-900 dark:text-slate-100">Descartar alterações?</h3><p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">As edições feitas em <strong>{selectedDemand.code}</strong> ainda não foram salvas. Ao sair, elas serão perdidas.</p></div>
            </div>
            <div className="flex justify-end gap-2 bg-slate-50 p-4 dark:bg-slate-950/40">
              <button type="button" autoFocus onClick={() => setIsDiscardConfirmOpen(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Continuar editando</button>
              <button type="button" onClick={() => { setIsDiscardConfirmOpen(false); setSelectedDemand(null); }} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700">Descartar e fechar</button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div data-modal-overlay="true" data-modal-decision="true" className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-demand-title">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl dark:border-red-900 dark:bg-slate-900">
            <div className="flex items-start gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
              <div className="rounded-xl bg-red-100 p-2.5 text-red-700 dark:bg-red-950 dark:text-red-300"><Trash2 className="h-5 w-5" /></div>
              <div className="min-w-0"><h3 id="delete-demand-title" className="text-base font-bold text-slate-900 dark:text-slate-100">Excluir demanda?</h3><p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">A demanda <strong>{selectedDemand.code}</strong> — {selectedDemand.title} será removida das visões operacionais. O histórico de auditoria será preservado.</p></div>
            </div>
            <div className="space-y-2 p-5"><label htmlFor="delete-demand-reason" className="block text-sm font-bold text-slate-700 dark:text-slate-200">Motivo da exclusão <span className="font-normal text-slate-400">(opcional)</span></label><textarea id="delete-demand-reason" rows={3} value={deleteReason} onChange={event => setDeleteReason(event.target.value)} maxLength={500} placeholder="Informe por que esta demanda está sendo excluída..." className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"/><p className="text-right text-[11px] text-slate-400">{deleteReason.length}/500</p></div>
            <div className="flex justify-end gap-2 bg-slate-50 p-4 dark:bg-slate-950/40"><button type="button" autoFocus disabled={isDeleting} onClick={() => { setIsDeleteConfirmOpen(false); setDeleteReason(''); }} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Manter demanda</button><button type="button" disabled={isDeleting} onClick={() => void handleConfirmDelete()} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"><Trash2 className="h-4 w-4"/>{isDeleting ? 'Excluindo...' : 'Confirmar exclusão'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
