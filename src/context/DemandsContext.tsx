import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { z } from 'zod';
import type { Attachment, Demand } from '../types';
import { demandListQuerySchema, type BlockerInput, type DemandCreateInput, type DemandUpdateInput } from '../contracts';
import { ApiError, apiClient } from '../services/apiClient';
import { useModule } from './ModuleContext';

type DemandQuery = z.input<typeof demandListQuerySchema>;
type DemandPagination = { page: number; pageSize: number; total: number; totalPages: number };
type DemandConflict = { demandId: string; message: string };

type DemandsContextValue = {
  demands: Demand[];
  setDemands: React.Dispatch<React.SetStateAction<Demand[]>>;
  selectedDemand: Demand | null;
  setSelectedDemand: React.Dispatch<React.SetStateAction<Demand | null>>;
  loading: boolean;
  error: string;
  conflict: DemandConflict | null;
  clearConflict: () => void;
  pagination: DemandPagination;
  query: DemandQuery;
  loadDemands: (query?: DemandQuery) => Promise<void>;
  reloadDemands: () => Promise<void>;
  createDemand: (data: DemandCreateInput) => Promise<Demand>;
  updateDemand: (id: string, updates: Omit<DemandUpdateInput,'version'>) => Promise<Demand | null>;
  deleteDemand: (id: string) => Promise<Demand | null>;
  setBlocker: (id: string, input: Omit<BlockerInput, 'version'>) => Promise<{ demand: Demand; createdDemand?: Demand }>;
  addComment: (id: string, content: string, attachments?: Attachment[]) => Promise<Demand | null>;
  editComment: (id: string, commentId: string, content: string) => Promise<Demand | null>;
  completeDemand: (id: string, statusId: string, summary: string) => Promise<{ demand: Demand; autoUnblocked: Demand[] } | null>;
};

const initialQuery: DemandQuery = { page: 1, pageSize: 100, sort: 'updatedAt', direction: 'desc' };
const emptyPagination: DemandPagination = { page: 1, pageSize: 100, total: 0, totalPages: 0 };
const DemandsContext = createContext<DemandsContextValue | null>(null);
export const demandQueryFromSearch = (search: string): DemandQuery => {
  const params = new URLSearchParams(search);
  const supportedKeys = [
    'q', 'statusId', 'statusIds', 'priorityId', 'priorityIds', 'categoryId', 'categoryIds',
    'assigneeId', 'assigneeIds', 'teamId', 'teamIds', 'clientId', 'clientIds',
    'sort', 'direction', 'page', 'pageSize',
  ] as const;
  const query = Object.fromEntries(
    supportedKeys.flatMap(key => {
      const value = params.get(key);
      return value === null ? [] : [[key, value]];
    }),
  );
  return demandListQuerySchema.parse(query);
};

export const demandQueryUrl = (pathname: string, query: DemandQuery) => {
  const parsed=demandListQuerySchema.parse(query);
  const params=new URLSearchParams();
  if(parsed.q)params.set('q',parsed.q);
  for(const key of ['statusIds','priorityIds','categoryIds','assigneeIds','teamIds','clientIds'] as const)if(parsed[key]?.length)params.set(key,parsed[key]!.join(','));
  params.set('sort',parsed.sort);params.set('direction',parsed.direction);params.set('page',String(parsed.page));params.set('pageSize',String(parsed.pageSize));
  return `${pathname}${params.size?`?${params}`:''}`;
};

export const isCurrentDemandRequest = (requestId: number, latestRequestId: number, requestedModuleId: string, currentModuleId: string) =>
  requestId === latestRequestId && requestedModuleId === currentModuleId;
export const replaceDemandInCollection = (items: Demand[], persisted: Demand) => items.map(item => item.id === persisted.id ? persisted : item);
export const reconcileBlockerResponse = (items: Demand[], demand: Demand, createdDemand?: Demand) => {
  const reconciled = replaceDemandInCollection(items, demand);
  return createdDemand && !reconciled.some(item => item.id === createdDemand.id) ? [createdDemand, ...reconciled] : reconciled;
};
export const reconcileCompletionResponse = (items: Demand[], demand: Demand, autoUnblocked: Demand[]) => items.map(item => autoUnblocked.find(unblocked => unblocked.id === item.id) ?? (item.id === demand.id ? demand : item));

export const DemandsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentModule } = useModule();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState<DemandConflict | null>(null);
  const [pagination, setPagination] = useState<DemandPagination>(emptyPagination);
  const [query, setQuery] = useState<DemandQuery>(()=>demandQueryFromSearch(window.location.search));
  const latestRequestId = useRef(0);
  const currentModuleId = useRef(currentModule.id);

  useEffect(() => { currentModuleId.current = currentModule.id; }, [currentModule.id]);

  const loadDemands = useCallback(async (nextQuery: DemandQuery = initialQuery) => {
    const requestId = ++latestRequestId.current;
    const requestedModuleId = currentModule.id;
    const parsedQuery = demandListQuerySchema.parse(nextQuery);
    window.history.replaceState({},'',demandQueryUrl(window.location.pathname,parsedQuery));
    setQuery(parsedQuery);
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.demands(parsedQuery);
      if (!isCurrentDemandRequest(requestId, latestRequestId.current, requestedModuleId, currentModuleId.current)) return;
      setDemands(response.items);
      setPagination(response.pagination);
    } catch (cause) {
      if (!isCurrentDemandRequest(requestId, latestRequestId.current, requestedModuleId, currentModuleId.current)) return;
      setDemands([]);
      setPagination({ ...emptyPagination, page: parsedQuery.page, pageSize: parsedQuery.pageSize });
      setError(cause instanceof ApiError ? cause.message : 'Não foi possível carregar as demandas deste módulo.');
    } finally {
      if (isCurrentDemandRequest(requestId, latestRequestId.current, requestedModuleId, currentModuleId.current)) setLoading(false);
    }
  }, [currentModule.id]);

  useEffect(() => {
    currentModuleId.current = currentModule.id;
    latestRequestId.current += 1;
    setDemands([]);
    setSelectedDemand(null);
    setConflict(null);
    setPagination(emptyPagination);
    void loadDemands(demandQueryFromSearch(window.location.search));
  }, [currentModule.id, loadDemands]);

  const reloadDemands = useCallback(() => loadDemands(query), [loadDemands, query]);
  const executeMutation = useCallback(async <T,>(demandId: string, operation: () => Promise<T>) => {
    try {
      const result = await operation();
      setConflict(previous => previous?.demandId === demandId ? null : previous);
      return result;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409 && cause.message.includes('alterada por outra operação')) {
        setConflict({ demandId, message: cause.message });
      }
      throw cause;
    }
  }, []);
  const createDemand = useCallback(async (data: DemandCreateInput) => {
    const persisted = await apiClient.createDemand(data);
    setDemands(previous => [persisted, ...previous.filter(item => item.id !== persisted.id)]);
    return persisted;
  }, []);
  const updateDemand = useCallback(async (id: string, updates: Omit<DemandUpdateInput,'version'>) => {
    const existing = demands.find(item => item.id === id);
    if (!existing) return null;
    const persisted = await executeMutation(id, () => apiClient.updateDemand(id, { ...updates, version: existing.version }));
    setDemands(previous => replaceDemandInCollection(previous, persisted));
    setSelectedDemand(previous => previous?.id === id ? persisted : previous);
    return persisted;
  }, [demands, executeMutation]);
  const deleteDemand = useCallback(async (id: string) => {
    const existing = demands.find(item => item.id === id);
    if (!existing) return null;
    await executeMutation(id, () => apiClient.deleteDemand(id, existing.version));
    setDemands(previous => previous.filter(item => item.id !== id));
    setSelectedDemand(previous => previous?.id === id ? null : previous);
    return existing;
  }, [demands, executeMutation]);
  const setBlocker = useCallback(async (id: string, input: Omit<BlockerInput, 'version'>) => {
    const existing = demands.find(item => item.id === id);
    if (!existing) throw new Error('Demanda não encontrada no módulo atual.');
    const response = await executeMutation(id, () => apiClient.setBlocker(id, { ...input, version: existing.version }));
    setDemands(previous => reconcileBlockerResponse(previous, response.demand, response.createdDemand));
    setSelectedDemand(previous => previous?.id === id ? response.demand : previous);
    return response;
  }, [demands, executeMutation]);
  const addComment = useCallback(async (id: string, content: string, attachments: Attachment[] = []) => {
    const existing = demands.find(item => item.id === id);
    if (!existing) return null;
    const response = await executeMutation(id, () => apiClient.addComment(id, { version: existing.version, content, attachments }));
    const persisted = { ...existing, comments: [...existing.comments, response.comment], version: response.demandVersion, updatedAt: response.comment.createdAt };
    setDemands(previous => previous.map(item => item.id === id ? persisted : item));
    setSelectedDemand(previous => previous?.id === id ? persisted : previous);
    return persisted;
  }, [demands, executeMutation]);
  const editComment = useCallback(async (id: string, commentId: string, content: string) => {
    const existing = demands.find(item => item.id === id);
    if (!existing) return null;
    const response = await executeMutation(id, () => apiClient.editComment(id, commentId, { version: existing.version, content }));
    const persisted = { ...existing, comments: existing.comments.map(item => item.id === commentId ? response.comment : item), version: response.demandVersion, updatedAt: response.comment.editedAt ?? existing.updatedAt };
    setDemands(previous => previous.map(item => item.id === id ? persisted : item));
    setSelectedDemand(previous => previous?.id === id ? persisted : previous);
    return persisted;
  }, [demands, executeMutation]);
  const completeDemand = useCallback(async (id: string, statusId: string, summary: string) => {
    const existing = demands.find(item => item.id === id);
    if (!existing) return null;
    const response = await executeMutation(id, () => apiClient.completeDemand(id, { statusId, summary, version: existing.version }));
    setDemands(previous => reconcileCompletionResponse(previous, response.demand, response.autoUnblocked));
    setSelectedDemand(previous => previous?.id === id ? response.demand : previous);
    return response;
  }, [demands, executeMutation]);
  const clearConflict = useCallback(() => setConflict(null), []);
  const value = useMemo<DemandsContextValue>(() => ({ demands, setDemands, selectedDemand, setSelectedDemand, loading, error, conflict, clearConflict, pagination, query, loadDemands, reloadDemands, createDemand, updateDemand, deleteDemand, setBlocker, addComment, editComment, completeDemand }), [demands, selectedDemand, loading, error, conflict, clearConflict, pagination, query, loadDemands, reloadDemands, createDemand, updateDemand, deleteDemand, setBlocker, addComment, editComment, completeDemand]);
  return <DemandsContext.Provider value={value}>{children}</DemandsContext.Provider>;
};

export const useDemands = () => {
  const context = useContext(DemandsContext);
  if (!context) throw new Error('useDemands deve ser usado dentro de DemandsProvider.');
  return context;
};
