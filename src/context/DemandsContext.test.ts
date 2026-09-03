import { describe, expect, it } from 'vitest';
import type { Demand } from '../types';
import { demandQueryFromSearch, demandQueryUrl, isCurrentDemandRequest, reconcileBlockerResponse, reconcileCompletionResponse, replaceDemandInCollection } from './DemandsContext';

const demand = (id: string, version: number): Demand => ({ id, moduleId: 'm1', code: id, version, title: id, description: '', categoryId: 'c1', requesterId: 'u1', assigneeId: 'u1', teamId: 't1', statusId: 's1', priorityId: 'p1', whyReason: '', expectedOutcome: '', whereLocation: '', howExecutionGuide: '', participantIds: [], createdAt: '2026-01-01T00:00:00.000Z', plannedStartDate: '2026-01-01T00:00:00.000Z', dueDate: '2026-01-02T00:00:00.000Z', progressPercent: 0, financials: { estimatedCost: 0, approvedCost: 0, realizedCost: 0, estimatedHours: 0, realizedHours: 0, costCenter: '', expectedBenefit: '', financialImpact: '', operationalImpact: '', regulatoryImpact: '', strategicImpact: '' }, sla: { policyId: '', firstResponseDue: '2026-01-01T00:00:00.000Z', resolutionDue: '2026-01-02T00:00:00.000Z', isBreached: false, isPaused: false, totalPausedMinutes: 0, pauseHistory: [], escalationLevel: 'none' }, advancedDependencies: [], dependencies: [], tags: [], checklist: [], blocker: { isBlocked: false }, deadlineExtensions: [], attachments: [], comments: [], watchers: [], updatedAt: '2026-01-01T00:00:00.000Z', updatedByUserId: 'u1' });

describe('estado de consultas de demandas', () => {
  it('aceita somente a resposta mais recente do módulo atual', () => {
    expect(isCurrentDemandRequest(2, 2, 'tecnologia', 'tecnologia')).toBe(true);
    expect(isCurrentDemandRequest(1, 2, 'tecnologia', 'tecnologia')).toBe(false);
    expect(isCurrentDemandRequest(2, 2, 'tecnologia', 'transporte')).toBe(false);
  });
  it('reconcilia versões persistidas, demandas relacionadas e desbloqueios', () => {
    const original = [demand('d1', 1), demand('d2', 1)];
    expect(replaceDemandInCollection(original, demand('d1', 2)).map(item => item.version)).toEqual([2, 1]);
    expect(reconcileBlockerResponse(original, demand('d1', 2), demand('d3', 1)).map(item => item.id)).toEqual(['d3', 'd1', 'd2']);
    expect(reconcileCompletionResponse(original, demand('d1', 2), [demand('d2', 2)]).map(item => item.version)).toEqual([2, 2]);
  });
  it('serializa filtros e paginação na URL do módulo',()=>{expect(demandQueryUrl('/modules/tecnologia',{q:'falha',statusIds:['nova','andamento'],page:2,pageSize:25,sort:'dueDate',direction:'asc'})).toBe('/modules/tecnologia?q=falha&statusIds=nova%2Candamento&sort=dueDate&direction=asc&page=2&pageSize=25');});
  it('restaura a consulta validada a partir da URL',()=>{expect(demandQueryFromSearch('?q=falha&statusIds=nova%2Candamento&page=2&pageSize=25&sort=dueDate&direction=asc')).toMatchObject({q:'falha',statusIds:['nova','andamento'],page:2,pageSize:25});});
  it('ignora parâmetros de URL que não pertencem à consulta de demandas',()=>{expect(demandQueryFromSearch('?utm_source=portal&page=2')).toMatchObject({page:2});});
});
