import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Team } from '../types';
import type { TeamCreateInput, TeamUpdateInput } from '../contracts';
import { apiClient } from '../services/apiClient';

type TeamsContextValue = {
  teams: Team[];
  replaceTeams: (teams: Team[]) => void;
  createTeam: (input: TeamCreateInput) => Promise<Team>;
  updateTeam: (id: string, input: TeamUpdateInput) => Promise<Team>;
  deleteTeam: (id: string) => Promise<void>;
};

const TeamsContext = createContext<TeamsContextValue | null>(null);

export const upsertTeam = (teams: Team[], persisted: Team) =>
  [...teams.filter(team => team.id !== persisted.id), persisted]
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));

export const TeamsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const replaceTeams = useCallback((nextTeams: Team[]) => setTeams(nextTeams.slice().sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))), []);

  const createTeam = useCallback(async (input: TeamCreateInput) => {
    const persisted = await apiClient.createTeam(input);
    setTeams(previous => upsertTeam(previous, persisted));
    return persisted;
  }, []);

  const updateTeam = useCallback(async (id: string, input: TeamUpdateInput) => {
    const persisted = await apiClient.updateTeam(id, input);
    setTeams(previous => upsertTeam(previous, persisted));
    return persisted;
  }, []);

  const deleteTeam = useCallback(async (id: string) => {
    await apiClient.deleteTeam(id);
    setTeams(previous => previous.filter(team => team.id !== id));
  }, []);

  const value = useMemo(() => ({ teams, replaceTeams, createTeam, updateTeam, deleteTeam }), [teams, replaceTeams, createTeam, updateTeam, deleteTeam]);
  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>;
};

export const useTeams = () => {
  const context = useContext(TeamsContext);
  if (!context) throw new Error('useTeams deve ser usado dentro de TeamsProvider.');
  return context;
};
