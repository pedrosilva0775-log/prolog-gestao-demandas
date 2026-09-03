import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { auditListResponseSchema, blockerResponseSchema, completeDemandResponseSchema, publicUserDtoSchema, reportPresetListSchema, sessionListResponseSchema, teamDtoSchema } from '../contracts';
import { ApiError, apiRequest } from './apiClient';

const demandDto={id:'d1',moduleId:'mod-default',code:'DEM-1',title:'Demanda',description:'',categoryId:'tarefa',requesterId:'u1',assigneeId:'',teamId:'',clientId:null,statusId:'nova',priorityId:'normal',version:1,createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'};
const teamDto={id:'t1',name:'Equipe',description:'',department:'TI',leaderId:'',color:'#2563eb',active:true,memberIds:[],version:1,createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'};
const mockResponse=(payload:unknown)=>vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify(payload),{status:200,headers:{'Content-Type':'application/json'}})));
const expectRejected=async(schema:z.ZodType<unknown>,payload:unknown)=>{mockResponse(payload);await expect(apiRequest('/teste',schema)).rejects.toBeInstanceOf(z.ZodError);};
const expectAccepted=async(schema:z.ZodType<unknown>,payload:unknown)=>{mockResponse(payload);await expect(apiRequest('/teste',schema)).resolves.toEqual(payload);};

beforeEach(() => {
  vi.stubGlobal('document', { cookie: '' });
  vi.restoreAllMocks();
});

describe('apiRequest', () => {
  it('preserva detalhes de erro JSON validado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Inválido', code: 'VALIDATION_ERROR', fieldErrors: { title: ['Obrigatório'] }, requestId: 'req-1' }), { status: 422, headers: { 'Content-Type': 'application/json' } })));
    const error = await apiRequest('/teste', z.object({ ok: z.boolean() })).catch(cause => cause);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, message: 'Inválido', code: 'VALIDATION_ERROR', fieldErrors: { title: ['Obrigatório'] }, requestId: 'req-1' });
  });

  it('trata erro sem JSON sem conversão insegura', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('indisponível', { status: 503 })));
    await expect(apiRequest('/teste', z.string())).rejects.toMatchObject({ status: 503, message: 'Erro 503' });
  });

  it('não aceita envelope administrativo incompleto como contrato v1', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Negado' }), { status: 403, headers: { 'Content-Type': 'application/json' } })));
    const error = await apiRequest('/teste', z.string()).catch(cause => cause);
    expect(error).toMatchObject({ status: 403, message: 'Erro 403', code: undefined, requestId: undefined });
  });

  it('trata resposta 204 como ausência de conteúdo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(apiRequest('/teste', z.undefined(), { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('rejeita respostas incompletas de equipe, bloqueio e conclusão',async()=>{await expectRejected(teamDtoSchema,{...teamDto,version:undefined});await expectRejected(blockerResponseSchema,{demand:{...demandDto,version:undefined},createdDemand:null});await expectRejected(completeDemandResponseSchema,{demand:demandDto,autoUnblocked:[{...demandDto,version:undefined}]});});

  it('aceita respostas completas de equipe, bloqueio e conclusão',async()=>{await expectAccepted(teamDtoSchema,teamDto);await expectAccepted(blockerResponseSchema,{demand:demandDto,createdDemand:null});await expectAccepted(completeDemandResponseSchema,{demand:demandDto,autoUnblocked:[]});});

  it('rejeita respostas administrativas incompletas',async()=>{await expectRejected(publicUserDtoSchema,{id:'u1',email:'u@test.local'});await expectRejected(sessionListResponseSchema,[{id:'s1'}]);await expectRejected(auditListResponseSchema,[{id:'a1',action:'UPDATE'}]);await expectRejected(reportPresetListSchema,[{id:'r1',name:'Preset'}]);});
});
