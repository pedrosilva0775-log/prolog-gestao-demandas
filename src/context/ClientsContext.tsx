import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { z } from 'zod';
import { clientCreateSchema, clientUpdateSchema, type ClientDto } from '../contracts';
import { ApiError, apiClient } from '../services/apiClient';
import { useModule } from './ModuleContext';

type ClientsContextValue = {
  clients: ClientDto[];
  loading: boolean;
  error: string;
  reloadClients: () => Promise<void>;
  createClient: (input: z.input<typeof clientCreateSchema>) => Promise<ClientDto>;
  updateClient: (id: string, input: z.input<typeof clientUpdateSchema>) => Promise<ClientDto>;
};

const ClientsContext = createContext<ClientsContextValue | null>(null);

export const upsertClient = (clients: ClientDto[], persisted: ClientDto) =>
  [...clients.filter(client => client.id !== persisted.id), persisted]
    .sort((left, right) => left.company.localeCompare(right.company, 'pt-BR'));

export const ClientsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentModule } = useModule();
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reloadClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.clients();
      setClients(result.slice().sort((left, right) => left.company.localeCompare(right.company, 'pt-BR')));
    } catch (cause) {
      setClients([]);
      setError(cause instanceof ApiError ? cause.message : 'Não foi possível carregar os clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reloadClients(); }, [currentModule.id, reloadClients]);

  const createClient = useCallback(async (input: z.input<typeof clientCreateSchema>) => {
    const persisted = await apiClient.createClient(input);
    setClients(previous => upsertClient(previous, persisted));
    return persisted;
  }, []);

  const updateClient = useCallback(async (id: string, input: z.input<typeof clientUpdateSchema>) => {
    const persisted = await apiClient.updateClient(id, input);
    setClients(previous => upsertClient(previous, persisted));
    return persisted;
  }, []);

  const value = useMemo(() => ({ clients, loading, error, reloadClients, createClient, updateClient }), [clients, loading, error, reloadClients, createClient, updateClient]);
  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (!context) throw new Error('useClients deve ser usado dentro de ClientsProvider.');
  return context;
};
