import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  bootstrapResponseSchema, blockerInputSchema, clientCreateSchema, demandCreateSchema, demandListQuerySchema,
  demandUpdateSchema, demandDtoSchema, demandDtoToDomain, commentDtoSchema, commentAttachmentSchema,
  categoryConfigDtoSchema, statusConfigDtoSchema, priorityConfigDtoSchema,
  publicUserDtoSchema, teamCreateSchema, type PublicUserDto
} from '.';

const validDemand = { title: 'Demanda válida', description: '', statusId: 'nova', priorityId: 'normal', categoryId: 'tarefa' };
const validDemandDto={id:'d1',moduleId:'mod-default',code:'DEM-1',version:1,...validDemand,requesterId:'u1',assigneeId:'u1',teamId:'t1'};

describe('contratos da API', () => {
  it('aceita criação válida de demanda e rejeita payload inválido', () => {
    expect(demandCreateSchema.safeParse(validDemand).success).toBe(true);
    expect(demandCreateSchema.safeParse({ ...validDemand, title: '', statusId: '' }).success).toBe(false);
    expect(demandCreateSchema.safeParse({ ...validDemand, internalSecret: 'não permitido' }).success).toBe(false);
  });

  it('aceita atualização parcial válida', () => {
    expect(demandUpdateSchema.parse({ version: 3, title: 'Título atualizado' })).toEqual({ version: 3, title: 'Título atualizado' });
    expect(demandUpdateSchema.safeParse({ title: 'Sem versão' }).success).toBe(false);
    expect(demandUpdateSchema.safeParse({ version: 3, comments: [] }).success).toBe(false);
    expect(demandUpdateSchema.safeParse({ version: 3, progressPercent: 50 }).success).toBe(false);
    expect(demandUpdateSchema.safeParse({ version: 3, checklist: [{ id: 'i1', title: 'Item', completed: true }], progressPercent: 0 }).success).toBe(false);
    expect(demandUpdateSchema.safeParse({ version: 3, checklist: [{ id: 'i1', title: 'Item', completed: true }], progressPercent: 100 }).success).toBe(true);
  });

  it('normaliza filtros múltiplos e limita a paginação',()=>{expect(demandListQuerySchema.parse({statusIds:'nova,andamento',page:'2',pageSize:'100'})).toMatchObject({statusIds:['nova','andamento'],page:2,pageSize:100});expect(demandListQuerySchema.safeParse({pageSize:101}).success).toBe(false);});

  it('rejeita bloqueio sem motivo', () => {
    expect(blockerInputSchema.safeParse({ isBlocked: true }).success).toBe(false);
    expect(blockerInputSchema.safeParse({ version: 1, isBlocked: true, reason: 'Dependência externa' }).success).toBe(true);
    expect(blockerInputSchema.safeParse({ version: 1, isBlocked: false, unknownField: true }).success).toBe(false);
  });

  it('valida cliente válido e inválido', () => {
    expect(clientCreateSchema.safeParse({ name: 'Contato', company: 'Empresa', email: 'contato@empresa.test' }).success).toBe(true);
    expect(clientCreateSchema.safeParse({ name: 'C', company: '', email: 'invalido' }).success).toBe(false);
  });

  it('valida equipe válida e inválida', () => {
    expect(teamCreateSchema.safeParse({ name: 'Equipe A', description: '', department: 'TI', color: '#2563eb', active: true, memberIds: [] }).success).toBe(true);
    expect(teamCreateSchema.safeParse({ name: 'E', color: 'azul' }).success).toBe(false);
  });

  it('aceita uma resposta pública de bootstrap compatível', () => {
    const result = bootstrapResponseSchema.safeParse({
      currentUserId: 'u1',
      users: [{ id: 'u1', email: 'user@test.local', name: 'Usuário', role: 'admin', roleTitle: 'Admin', department: 'TI', avatar: '', active: true, mfaEnabled: false, approvalStatus: 'approved', teamIds: [] }],
      teams: [{ id: 't1', name: 'Time', description: '', department: 'TI', leaderId: '', color: '#2563eb', active: true, memberIds: [], version: 1, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      clients: [], demands: [validDemandDto], auditLogs: [], configurations: {}
    });
    expect(result.success).toBe(true);
  });

  it('rejeita demanda sem campo crítico e tipo aninhado incorreto',()=>{
    const {statusId,...withoutStatus}=validDemandDto;
    expect(demandDtoSchema.safeParse(withoutStatus).success).toBe(false);
    expect(demandDtoSchema.safeParse({...validDemandDto,blocker:{isBlocked:'sim'}}).success).toBe(false);
  });

  it('rejeita comentário e anexo inválidos',()=>{
    expect(commentDtoSchema.safeParse({id:'c1',userId:'u1',userName:'U',userAvatar:'',content:2,createdAt:new Date().toISOString()}).success).toBe(false);
    expect(commentAttachmentSchema.safeParse({id:'a1',name:'x',size:'grande',type:'image/png',url:'/uploads/x',uploadedByUserId:'u1',uploadedAt:new Date().toISOString()}).success).toBe(false);
  });

  it('rejeita configurações incompletas',()=>{
    expect(categoryConfigDtoSchema.safeParse({id:'c',name:'C'}).success).toBe(false);
    expect(statusConfigDtoSchema.safeParse({id:'s',name:'S'}).success).toBe(false);
    expect(priorityConfigDtoSchema.safeParse({id:'p',name:'P'}).success).toBe(false);
  });

  it('mapeia DTO de demanda para o domínio com defaults explícitos',()=>{
    const domain=demandDtoToDomain(demandDtoSchema.parse(validDemandDto));
    expect(domain).toMatchObject({id:'d1',statusId:'nova',blocker:{isBlocked:false},comments:[],progressPercent:0});
    expect(domain.financials.estimatedCost).toBe(0);
  });

  it('impede campos sensíveis no DTO público de usuário', () => {
    expect(publicUserDtoSchema.safeParse({ id: 'u1', email: 'user@test.local', name: 'Usuário', role: 'admin', roleTitle: '', department: '', avatar: '', active: true, teamIds: [], password_hash: 'segredo' }).success).toBe(false);
    expectTypeOf<PublicUserDto>().not.toHaveProperty('password_hash');
    expectTypeOf<PublicUserDto>().not.toHaveProperty('mfa_secret_encrypted');
    expectTypeOf<PublicUserDto>().not.toHaveProperty('token_hash');
  });
});
