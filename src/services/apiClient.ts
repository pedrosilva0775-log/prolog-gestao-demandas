import { z } from 'zod';
import {
  addCommentInputSchema, apiErrorResponseSchema, blockerInputSchema, blockerResponseSchema,
  bootstrapResponseSchema, clientCreateSchema, clientDtoSchema, clientUpdateSchema,
  commentMutationResponseSchema, completeDemandInputSchema, completeDemandResponseSchema,
  demandCreateSchema, demandDtoSchema, demandDtoToDomain, demandListQuerySchema, demandListResponseSchema, demandMetricsQuerySchema, demandMetricsSchema, demandUpdateSchema, editCommentInputSchema,
  noContentSchema, teamCreateSchema, teamDtoSchema, teamListItemDtoSchema, teamUpdateSchema,
  auditListResponseSchema, auditQuerySchema, configurationUpdateSchemas, publicUserDtoSchema,
  reportDemandListResponseSchema, reportDemandQuerySchema, reportPresetCreateSchema, reportPresetDtoSchema, reportPresetListSchema, sessionListResponseSchema,
  userUpdateSchema, privacyRequestCreateSchema, privacyRequestDtoSchema, privacyRequestListSchema,
  privacyRequestUpdateSchema, retentionEntitySchema, retentionPolicyInputSchema, retentionPolicyListSchema, privacyExportSchema,
  authorizedModuleListSchema, moduleCreateSchema, moduleDtoSchema, moduleListResponseSchema, moduleMemberCreateSchema, moduleMemberDtoSchema, moduleMemberUpdateSchema, moduleQuerySchema, moduleUpdateSchema,
  type AddCommentInput, type ApiErrorResponse, type DemandCreateInput, type DemandUpdateInput, type UserUpdateInput
} from '../contracts';
import { csrfHeaders } from './csrf';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly code?: string, public readonly fieldErrors?: Record<string, string[]>, public readonly requestId?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const parseErrorBody = async (response: Response): Promise<ApiErrorResponse | undefined> => {
  try {
    const raw: unknown = await response.json();
    const parsed = apiErrorResponseSchema.safeParse(raw);
    if (!parsed.success) return undefined;
    const fieldErrors = parsed.data.fieldErrors ?? parsed.data.issues?.reduce<Record<string, string[]>>((all, issue) => {
      (all[issue.path] ??= []).push(issue.message);
      return all;
    }, {});
    return { ...parsed.data, fieldErrors };
  } catch { return undefined; }
};

export const apiRequest = async <T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> => {
  const response = await fetch(`/api/v1${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...csrfHeaders(), ...(init?.headers || {}) } });
  if (response.status === 401) window.dispatchEvent(new CustomEvent('prolog:session-expired'));
  if (!response.ok) {
    const error = await parseErrorBody(response);
    const requestId = error?.requestId || response.headers.get('X-Request-Id') || undefined;
    throw new ApiError(response.status, error?.message || `Erro ${response.status}`, error?.code, error?.fieldErrors, requestId);
  }
  if (response.status === 204) return schema.parse(undefined);
  const raw: unknown = await response.json();
  return schema.parse(raw);
};

const body = (schema: z.ZodType, value: unknown) => JSON.stringify(schema.parse(value));
let activeModuleId='';
export const setActiveApiModule=(moduleId:string)=>{activeModuleId=moduleId;};
const operationalPath=(path:string)=>activeModuleId?`/modules/${encodeURIComponent(activeModuleId)}${path}`:path;

export const apiClient = {
  bootstrap: async () => { const dto=await apiRequest(operationalPath('/bootstrap'),bootstrapResponseSchema); return {...dto,demands:dto.demands.map(demandDtoToDomain)}; },
  demands: async (query:z.input<typeof demandListQuerySchema>={}) => {const parsed=demandListQuerySchema.parse(query);const params=new URLSearchParams(Object.entries(parsed).filter(([,value])=>value!==undefined).map(([key,value])=>[key,String(value)]));const dto=await apiRequest(operationalPath(`/demands?${params}`),demandListResponseSchema);return {...dto,items:dto.items.map(demandDtoToDomain)};},
  demandMetrics: async (query:z.input<typeof demandMetricsQuerySchema>={}) => {const parsed=demandMetricsQuerySchema.parse(query);const params=new URLSearchParams(Object.entries(parsed).filter(([,value])=>value!==undefined).map(([key,value])=>[key,String(value)]));return apiRequest(operationalPath(`/demand-metrics?${params}`),demandMetricsSchema);},
  reportDemands: async (query:z.input<typeof reportDemandQuerySchema>={}) => {const base=reportDemandQuerySchema.parse(query);const items=[];let page=1;let totalPages=1;do{const params=new URLSearchParams();for(const [key,value] of Object.entries({...base,page,pageSize:500}))if(value!==undefined)params.set(key,Array.isArray(value)?value.join(','):String(value));const dto=await apiRequest(operationalPath(`/report-demands?${params}`),reportDemandListResponseSchema);items.push(...dto.items.map(demandDtoToDomain));totalPages=dto.pagination.totalPages;page+=1;if(page>100)throw new ApiError(422,'O relatório excede o limite seguro de 50.000 demandas. Restrinja os filtros.','VALIDATION_ERROR');}while(page<=totalPages);return items;},
  createDemand: async (data: DemandCreateInput) => demandDtoToDomain(await apiRequest(operationalPath('/demands'), demandDtoSchema, { method: 'POST', body: body(demandCreateSchema, data) })),
  updateDemand: async (id: string, data: DemandUpdateInput) => demandDtoToDomain(await apiRequest(operationalPath(`/demands/${encodeURIComponent(id)}`), demandDtoSchema, { method: 'PATCH', body: body(demandUpdateSchema, data) })),
  setBlocker: async (id: string, data: z.input<typeof blockerInputSchema>) => {const dto=await apiRequest(operationalPath(`/demands/${encodeURIComponent(id)}/blocker`), blockerResponseSchema, { method: 'PUT', body: body(blockerInputSchema, data) });return {demand:demandDtoToDomain(dto.demand),createdDemand:dto.createdDemand==null?undefined:demandDtoToDomain(dto.createdDemand)};},
  completeDemand: async (id: string, data: z.input<typeof completeDemandInputSchema>) => {const dto=await apiRequest(operationalPath(`/demands/${encodeURIComponent(id)}/complete`), completeDemandResponseSchema, { method: 'POST', body: body(completeDemandInputSchema, data) });return {demand:demandDtoToDomain(dto.demand),autoUnblocked:dto.autoUnblocked.map(demandDtoToDomain)};},
  addComment: (demandId: string, data: AddCommentInput) => apiRequest(operationalPath(`/demands/${encodeURIComponent(demandId)}/comments`), commentMutationResponseSchema, { method: 'POST', body: body(addCommentInputSchema, data) }),
  editComment: (demandId: string, commentId: string, data: z.input<typeof editCommentInputSchema>) => apiRequest(operationalPath(`/demands/${encodeURIComponent(demandId)}/comments/${encodeURIComponent(commentId)}`), commentMutationResponseSchema, { method: 'PATCH', body: body(editCommentInputSchema, data) }),
  deleteDemand: (id: string, version: number) => apiRequest(operationalPath(`/demands/${encodeURIComponent(id)}?version=${version}`), noContentSchema, { method: 'DELETE' }),
  clients: () => apiRequest('/clients', z.array(clientDtoSchema)),
  createClient: (data: z.input<typeof clientCreateSchema>) => apiRequest('/clients', clientDtoSchema, { method: 'POST', body: body(clientCreateSchema, data) }),
  updateClient: (id: string, data: z.input<typeof clientUpdateSchema>) => apiRequest(`/clients/${encodeURIComponent(id)}`, clientDtoSchema, { method: 'PATCH', body: body(clientUpdateSchema, data) }),
  deleteClient: (id: string) => apiRequest(`/clients/${encodeURIComponent(id)}`, noContentSchema, { method: 'DELETE' }),
  teams: () => apiRequest('/teams', z.array(teamListItemDtoSchema)),
  createTeam: (data: z.input<typeof teamCreateSchema>) => apiRequest('/teams', teamDtoSchema, { method: 'POST', body: body(teamCreateSchema, data) }),
  updateTeam: (id: string, data: z.input<typeof teamUpdateSchema>) => apiRequest(`/teams/${encodeURIComponent(id)}`, teamDtoSchema, { method: 'PATCH', body: body(teamUpdateSchema, data) }),
  deleteTeam: (id: string) => apiRequest(`/teams/${encodeURIComponent(id)}`, noContentSchema, { method: 'DELETE' }),
  auditLogs: (limit=100) => apiRequest(operationalPath(`/audit-logs?limit=${auditQuerySchema.parse({limit}).limit}`), auditListResponseSchema),
  reportPresets: () => apiRequest(operationalPath('/report-presets'), reportPresetListSchema),
  saveReportPreset: (name: string, configuration: z.input<typeof reportPresetCreateSchema>['configuration']) => apiRequest(operationalPath('/report-presets'), reportPresetDtoSchema, { method: 'POST', body: body(reportPresetCreateSchema,{name,configuration}) }),
  updateConfiguration: <K extends keyof typeof configurationUpdateSchemas>(key:K,value:z.input<(typeof configurationUpdateSchemas)[K]>['value']) => apiRequest(operationalPath(`/configurations/${key}`),noContentSchema,{method:'PUT',body:body(configurationUpdateSchemas[key],{value})}),
  updateUser: (id: string, value: UserUpdateInput) => apiRequest(`/users/${encodeURIComponent(id)}`, publicUserDtoSchema, { method: 'PATCH', body: body(userUpdateSchema,value) }),
  deactivateUser: (id: string) => apiRequest(`/users/${encodeURIComponent(id)}`, noContentSchema, { method: 'DELETE' }),
  sessions: () => apiRequest('/sessions', sessionListResponseSchema),
  revokeSession: (id: string) => apiRequest(`/sessions/${encodeURIComponent(id)}`, noContentSchema, { method: 'DELETE' }),
  createPrivacyRequest:(value:z.input<typeof privacyRequestCreateSchema>)=>apiRequest('/privacy/requests',privacyRequestDtoSchema,{method:'POST',body:body(privacyRequestCreateSchema,value)}),
  privacyRequests:()=>apiRequest('/privacy/requests',privacyRequestListSchema),
  updatePrivacyRequest:(id:string,value:z.input<typeof privacyRequestUpdateSchema>)=>apiRequest(`/privacy/requests/${encodeURIComponent(id)}`,noContentSchema,{method:'PATCH',body:body(privacyRequestUpdateSchema,value)}),
  privacyExport:()=>apiRequest('/privacy/export',privacyExportSchema),
  retentionPolicies:()=>apiRequest('/privacy/retention-policies',retentionPolicyListSchema),
  updateRetentionPolicy:(entityType:z.input<typeof retentionEntitySchema>,value:z.input<typeof retentionPolicyInputSchema>)=>apiRequest(`/privacy/retention-policies/${encodeURIComponent(retentionEntitySchema.parse(entityType))}`,noContentSchema,{method:'PUT',body:body(retentionPolicyInputSchema,value)})
  ,authorizedModules:()=>apiRequest('/me/modules',authorizedModuleListSchema)
  ,modules:(query:z.input<typeof moduleQuerySchema>={})=>{const parsed=moduleQuerySchema.parse(query);const params=new URLSearchParams({page:String(parsed.page),pageSize:String(parsed.pageSize),sort:parsed.sort,direction:parsed.direction});if(parsed.search)params.set('search',parsed.search);if(parsed.active!==undefined)params.set('active',String(parsed.active));return apiRequest(`/modules?${params}`,moduleListResponseSchema);}
  ,createModule:(value:z.input<typeof moduleCreateSchema>)=>apiRequest('/modules',moduleDtoSchema,{method:'POST',body:body(moduleCreateSchema,value)})
  ,updateModule:(id:string,value:z.input<typeof moduleUpdateSchema>)=>apiRequest(`/modules/${encodeURIComponent(id)}`,moduleDtoSchema,{method:'PATCH',body:body(moduleUpdateSchema,value)})
  ,deleteModule:(id:string,version:number)=>apiRequest(`/modules/${encodeURIComponent(id)}?version=${version}`,noContentSchema,{method:'DELETE'})
  ,moduleMembers:(id:string)=>apiRequest(`/modules/${encodeURIComponent(id)}/members`,z.array(moduleMemberDtoSchema))
  ,addModuleMember:(id:string,value:z.input<typeof moduleMemberCreateSchema>)=>apiRequest(`/modules/${encodeURIComponent(id)}/members`,moduleMemberDtoSchema,{method:'POST',body:body(moduleMemberCreateSchema,value)})
  ,updateModuleMember:(id:string,userId:string,value:z.input<typeof moduleMemberUpdateSchema>)=>apiRequest(`/modules/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,moduleMemberDtoSchema,{method:'PATCH',body:body(moduleMemberUpdateSchema,value)})
  ,removeModuleMember:(id:string,userId:string)=>apiRequest(`/modules/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,noContentSchema,{method:'DELETE'})
};
