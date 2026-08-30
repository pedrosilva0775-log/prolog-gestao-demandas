/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { KanbanCard } from './KanbanCard';
import { IconRenderer } from '../common/IconRenderer';
import { DropdownSelect } from '../common/DropdownSelect';
import { staggerContainer, staggerItem } from '../motion/presets';
import { ActiveView, Demand, StatusConfig } from '../../types';
import { StatusModal } from '../modals/StatusModal';
import { apiClient } from '../../services/apiClient';
import {
  Plus,
  SlidersHorizontal,
  Layers,
  Users,
  UserCheck,
  Tag,
  AlertOctagon,
  CheckCircle2,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Ban
} from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const {
    filteredDemands,
    statuses,
    categories,
    priorities,
    users,
    teams,
    moveDemandStatus,
    setSelectedDemand,
    setIsCreateModalOpen,
    filters,
    setFilters,
    activeView,
    setActiveView,
    hasPermission,
    showToast,
    updateStatus,
    deleteStatus
  } = useApp();

  const [dragOverStatusId, setDragOverStatusId] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusToEdit, setStatusToEdit] = useState<StatusConfig | null>(null);
  const [activeMenuStatusId, setActiveMenuStatusId] = useState<string | null>(null);
  const [pointerDrag, setPointerDrag] = useState<{ demand: Demand; x: number; y: number; targetStatusId: string | null } | null>(null);
  const [droppedDemandId, setDroppedDemandId] = useState<string | null>(null);
  const [clients, setClients] = useState<Array<{ id: string; company: string; name: string; active: boolean }>>([]);
  const boardScrollRef = useRef<HTMLDivElement>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  const latestDragXRef = useRef(0);
  const suppressCardClickUntilRef = useRef(0);

  const scopeViews: { id: ActiveView; label: string; emoji: string }[] = [
    { id: 'kanban', label: 'Todas', emoji: '📋' },
    ...(hasPermission('projects', 'read') ? [{ id: 'projects' as ActiveView, label: 'Projetos', emoji: '👑' }] : []),
    ...(hasPermission('improvements', 'read') ? [{ id: 'improvements' as ActiveView, label: 'Melhorias', emoji: '📖' }] : []),
    ...(hasPermission('tasks', 'read') ? [{ id: 'tasks' as ActiveView, label: 'Tarefas', emoji: '⚙️' }] : []),
    { id: 'my_demands', label: 'Minhas demandas', emoji: '👤' },
    { id: 'created_by_me', label: 'Criadas por mim', emoji: '✍️' },
    { id: 'team_demands', label: 'Minhas equipes', emoji: '👥' },
  ];

  const groupingOptions = [
    { value: 'none', label: 'Status Padrão', description: 'Colunas do Kanban' },
    { value: 'team', label: 'Equipe responsável' },
    { value: 'assignee', label: 'Responsável principal' },
    { value: 'category', label: 'Categoria', description: 'Projeto, melhoria ou tarefa' },
    { value: 'priority', label: 'Prioridade' },
  ] as const;

  const clientOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos os clientes' },
      { value: '__internal__', label: 'Interna / sem cliente' },
      ...clients
        .sort((a, b) => a.company.localeCompare(b.company, 'pt-BR'))
        .map(client => ({
          value: client.id,
          label: client.company,
          description: `${client.name || 'Sem contato'}${client.active ? '' : ' · inativo'}`,
        })),
    ];
  }, [clients]);

  useEffect(() => {
    let active = true;
    const loadClients = () => {
      apiClient.clients()
        .then(data => { if (active) setClients(data); })
        .catch(() => { if (active) setClients([]); });
    };
    loadClients();
    window.addEventListener('prolog:clients-updated', loadClients);
    return () => {
      active = false;
      window.removeEventListener('prolog:clients-updated', loadClients);
    };
  }, []);

  const handleScopeChange = (viewId: ActiveView) => {
    const categoryCode = viewId === 'projects' ? 'PROJETO' : viewId === 'improvements' ? 'MELHORIA' : viewId === 'tasks' ? 'TAREFA' : null;
    setFilters(previous => ({
      ...previous,
      categoryIds: categoryCode ? categories.filter(category => category.code === categoryCode).map(category => category.id) : [],
      onlyMyDemands: viewId === 'my_demands',
      onlyCreatedByMe: viewId === 'created_by_me',
      onlyMyTeam: viewId === 'team_demands',
    }));
    setActiveView(viewId);
  };

  const activeStatuses = useMemo(() => statuses.filter(s => s.active).sort((a, b) => a.order - b.order), [statuses]);
  const isStatusBoard = filters.groupBy === 'none';
  const columns = useMemo(() => {
    if (filters.groupBy === 'team') return [
      ...teams.filter(team => team.active).map(team => ({ id: team.id, name: team.name, color: team.color, demands: filteredDemands.filter(demand => demand.teamId === team.id) })),
      { id: '__unassigned_team__', name: 'Sem equipe', color: '#94A3B8', demands: filteredDemands.filter(demand => !demand.teamId) }
    ].filter(column => column.demands.length > 0);
    if (filters.groupBy === 'assignee') return [
      ...users.filter(user => user.active).map(user => ({ id: user.id, name: user.name, color: '#2563EB', demands: filteredDemands.filter(demand => demand.assigneeId === user.id) })),
      { id: '__unassigned_user__', name: 'Sem responsável', color: '#94A3B8', demands: filteredDemands.filter(demand => !demand.assigneeId) }
    ].filter(column => column.demands.length > 0);
    if (filters.groupBy === 'category') return categories.map(category => ({ id: category.id, name: category.name, color: category.color, demands: filteredDemands.filter(demand => demand.categoryId === category.id) })).filter(column => column.demands.length > 0);
    if (filters.groupBy === 'priority') return priorities.map(priority => ({ id: priority.id, name: priority.name, color: priority.color, demands: filteredDemands.filter(demand => demand.priorityId === priority.id) })).filter(column => column.demands.length > 0);
    return activeStatuses.map(status => ({ id: status.id, name: status.name, color: status.color, demands: filteredDemands.filter(demand => demand.statusId === status.id), status }));
  }, [activeStatuses, categories, filteredDemands, filters.groupBy, priorities, teams, users]);

  useEffect(() => () => {
    if (autoScrollFrameRef.current !== null) cancelAnimationFrame(autoScrollFrameRef.current);
  }, []);

  const startPointerDrag = (demand: Demand, event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    let dragging = false;
    let targetStatusId: string | null = null;
    let pointerFrame: number | null = null;
    let latestX = startX;
    let latestY = startY;

    const findTarget = (x: number, y: number) => {
      const element = document.elementFromPoint(x, y) as HTMLElement | null;
      return element?.closest<HTMLElement>('[data-kanban-column-id]')?.dataset.kanbanColumnId ?? null;
    };

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      if (!dragging && Math.hypot(pointerEvent.clientX - startX, pointerEvent.clientY - startY) < 7) return;
      if (!dragging) {
        dragging = true;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
      }
      pointerEvent.preventDefault();
      latestX = pointerEvent.clientX;
      latestY = pointerEvent.clientY;
      if (pointerFrame !== null) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = null;
        targetStatusId = findTarget(latestX, latestY);
        setDragOverStatusId(previous => previous === targetStatusId ? previous : targetStatusId);
        setPointerDrag({ demand, x: latestX, y: latestY, targetStatusId });
      });
    };

    const finishPointerDrag = (pointerEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishPointerDrag);
      window.removeEventListener('pointercancel', finishPointerDrag);
      if (pointerFrame !== null) cancelAnimationFrame(pointerFrame);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      setPointerDrag(null);
      setDragOverStatusId(null);
      if (!dragging) return;
      suppressCardClickUntilRef.current = Date.now() + 250;
      const finalTarget = findTarget(pointerEvent.clientX, pointerEvent.clientY) ?? targetStatusId;
      if (finalTarget && finalTarget !== demand.statusId) {
        setDroppedDemandId(demand.id);
        window.setTimeout(() => setDroppedDemandId(current => current === demand.id ? null : current), 500);
        void moveDemandStatus(demand.id, finalTarget);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', finishPointerDrag, { once: true });
    window.addEventListener('pointercancel', finishPointerDrag, { once: true });
  };

  const handleDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatusId !== statusId) {
      setDragOverStatusId(statusId);
    }
  };

  const handleBoardAutoScroll = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isStatusBoard || !boardScrollRef.current) return;
    latestDragXRef.current = event.clientX;
    if (autoScrollFrameRef.current !== null) return;
    autoScrollFrameRef.current = requestAnimationFrame(() => {
      autoScrollFrameRef.current = null;
      const board = boardScrollRef.current;
      if (!board) return;
      const bounds = board.getBoundingClientRect();
      const edgeSize = Math.min(110, bounds.width * 0.14);
      const leftDistance = latestDragXRef.current - bounds.left;
      const rightDistance = bounds.right - latestDragXRef.current;
      if (leftDistance >= 0 && leftDistance < edgeSize) {
        board.scrollLeft -= Math.ceil(18 * (1 - leftDistance / edgeSize));
      } else if (rightDistance >= 0 && rightDistance < edgeSize) {
        board.scrollLeft += Math.ceil(18 * (1 - rightDistance / edgeSize));
      }
    });
  };

  const handleDragLeave = (e: React.DragEvent, statusId: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverStatusId === statusId) {
      setDragOverStatusId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault();
    setDragOverStatusId(null);
    const demandId = e.dataTransfer.getData('text/plain');
    if (!demandId) return;

    void moveDemandStatus(demandId, targetStatusId);
  };

  const handleEditStatus = (status: StatusConfig) => {
    setStatusToEdit(status);
    setIsStatusModalOpen(true);
    setActiveMenuStatusId(null);
  };

  const handleToggleStatusActive = (status: StatusConfig) => {
    const nextActive = !status.active;
    updateStatus(status.id, { active: nextActive });
    showToast({
      type: 'info',
      title: nextActive ? 'Status Reativado' : 'Status Cancelado / Ocultado',
      message: `A coluna "${status.name}" foi ${nextActive ? 'reativada' : 'desativada no quadro'}.`
    });
    setActiveMenuStatusId(null);
  };

  return (
    <div className="space-y-4">
      {/* Kanban Sub-Header & Controls */}
      <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs font-sans">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="mr-1 flex shrink-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Filtrar por:</span>
          </div>

          {scopeViews.map(view => {
            const selected = view.id === activeView || (view.id === 'kanban' && !scopeViews.some(option => option.id === activeView));
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => handleScopeChange(view.id)}
                aria-pressed={selected}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                  selected
                    ? 'border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-300'
                }`}
              >
                <span aria-hidden="true">{view.emoji}</span>
                <span>{view.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex items-center gap-3">
          <DropdownSelect
            value={filters.clientIds[0] ?? ''}
            options={clientOptions}
            onChange={(clientId) => setFilters(previous => ({
              ...previous,
              clientIds: clientId ? [clientId] : [],
            }))}
            ariaLabel="Filtrar por cliente solicitante"
            className="w-[220px]"
          />

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Agrupar quadro por:</span>
          </div>

          <DropdownSelect
            value={filters.groupBy}
            options={[...groupingOptions]}
            onChange={(groupBy) => setFilters(previous => ({ ...previous, groupBy }))}
            ariaLabel="Agrupar quadro"
            className="w-[220px]"
          />

          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mr-1">
            {filteredDemands.length} {filteredDemands.length === 1 ? 'demanda' : 'demandas'}
          </span>
        </div>
      </div>

      {/* Printable / Capturable Board Area */}
      <motion.div
        ref={boardScrollRef}
        id="kanban-board-export-container"
        variants={reduceMotion ? undefined : staggerContainer(0.03, 0.055)}
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        className="flex gap-3 overflow-x-auto pb-3 pt-1 items-start min-h-[calc(100dvh-210px)] scroll-smooth snap-x snap-proximity"
      >
        {columns.map((column) => {
          const columnDemands = column.demands;
          const status = 'status' in column ? column.status : undefined;
          const isOverWip = status?.wipLimit && columnDemands.length > status.wipLimit;
          const isDragTarget = isStatusBoard && pointerDrag?.targetStatusId === column.id;
          const isMenuOpen = isStatusBoard && activeMenuStatusId === column.id;

          return (
            <motion.div
              key={column.id}
              variants={reduceMotion ? undefined : staggerItem}
              data-kanban-column-id={column.id}
              className={`w-[clamp(280px,22vw,340px)] shrink-0 snap-start flex flex-col bg-slate-100/90 dark:bg-slate-900/90 rounded-2xl border transition-all duration-200 ${
                isDragTarget
                  ? 'border-blue-500 ring-2 ring-blue-400/40 bg-blue-50/40 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between relative">
                <div className="flex items-center space-x-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider truncate">
                    {column.name}
                  </h3>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {/* WIP Limit Badge */}
                  {status?.wipLimit && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isOverWip
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-extrabold animate-bounce'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                      title={`Limite WIP: ${columnDemands.length}/${status.wipLimit}`}
                    >
                      {columnDemands.length}/{status.wipLimit}
                    </span>
                  )}

                  {/* Total Count Badge */}
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
                    {columnDemands.length}
                  </span>

                  {/* Add Card to Column */}
                  {isStatusBoard && <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    title={`Adicionar demanda em "${column.name}"`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>}

                  {/* Column Settings / Edit Menu */}
                  {status && <div className="relative">
                    <button
                      onClick={() => setActiveMenuStatusId(isMenuOpen ? null : status.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                      title="Configurações da Coluna"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs">
                        <button
                          onClick={() => handleEditStatus(status)}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>Editar Coluna</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatusActive(status)}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Desativar / Cancelar</span>
                        </button>
                      </div>
                    )}
                  </div>}
                </div>
              </div>

              {/* Column Cards List */}
              <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100dvh-270px)] min-h-[180px]">
                <AnimatePresence initial={false}>
                {columnDemands.map((demand) => (
                  <KanbanCard
                    key={demand.id}
                    demand={demand}
                    users={users}
                    teams={teams}
                    categories={categories}
                    priorities={priorities}
                    statuses={statuses}
                    allowDrag={isStatusBoard}
                    isDragging={pointerDrag?.demand.id === demand.id}
                    isDropping={droppedDemandId === demand.id}
                    onPointerDragStart={(event) => startPointerDrag(demand, event)}
                    onClick={() => { if (Date.now() >= suppressCardClickUntilRef.current) setSelectedDemand(demand); }}
                    onStatusChange={(newStatusId) => moveDemandStatus(demand.id, newStatusId)}
                  />
                ))}
                </AnimatePresence>

                {columnDemands.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-xs select-none">
                    <p className="font-medium">Nenhuma demanda</p>
                    <p className="text-[10px] mt-0.5">{isStatusBoard ? 'Arraste um cartão para cá' : 'Nenhum item neste agrupamento'}</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

      </motion.div>

      <AnimatePresence>
      {pointerDrag && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1.02, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none fixed z-[140] w-72 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-blue-400 bg-white/95 p-3 shadow-2xl shadow-blue-950/30 backdrop-blur-sm dark:bg-slate-900/95"
          style={{ left: pointerDrag.x, top: pointerDrag.y }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Movendo demanda</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">{pointerDrag.demand.title}</p>
          <p className="mt-1 text-[10px] text-slate-500">Solte sobre a coluna de destino</p>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Reusable Status Modal */}
      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusToEdit(null);
        }}
        statusToEdit={statusToEdit}
      />
    </div>
  );
};
