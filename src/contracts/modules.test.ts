import { describe, expect, it } from 'vitest';
import { authorizedModuleDtoSchema, moduleCreateSchema, moduleListResponseSchema, moduleMemberUpdateSchema, moduleUpdateSchema } from './modules';

const moduleDto={id:'mod-tech',name:'Tecnologia',slug:'tecnologia',description:'Demandas de tecnologia',icon:'Code2',color:'#2563eb',active:true,createdBy:null,version:1,deletedAt:null,createdAt:'2026-09-01T00:00:00.000Z',updatedAt:'2026-09-01T00:00:00.000Z',counts:{users:2,teams:1,demands:3}};

describe('contratos de módulos operacionais',()=>{
  it('valida criação e impede slug, cor e ícone arbitrários',()=>{expect(moduleCreateSchema.safeParse({name:'Transporte e Logística',slug:'transporte-logistica',description:'Operação logística',icon:'Truck',color:'#0f766e'}).success).toBe(true);expect(moduleCreateSchema.safeParse({name:'X',slug:'Transporte Logística',icon:'<script>',color:'red'}).success).toBe(false);});
  it('exige versão nas alterações para concorrência otimista',()=>{expect(moduleUpdateSchema.safeParse({name:'Tecnologia',version:2}).success).toBe(true);expect(moduleUpdateSchema.safeParse({name:'Tecnologia'}).success).toBe(false);});
  it('valida papel por módulo e exige alteração real no vínculo',()=>{expect(moduleMemberUpdateSchema.safeParse({role:'manager'}).success).toBe(true);expect(moduleMemberUpdateSchema.safeParse({}).success).toBe(false);expect(moduleMemberUpdateSchema.safeParse({role:'admin'}).success).toBe(false);});
  it('valida listagem administrativa paginada e módulo autorizado',()=>{expect(moduleListResponseSchema.safeParse({items:[moduleDto],pagination:{page:1,pageSize:20,total:1,totalPages:1}}).success).toBe(true);expect(authorizedModuleDtoSchema.safeParse({...moduleDto,role:'viewer'}).success).toBe(true);expect(authorizedModuleDtoSchema.safeParse({...moduleDto,role:'admin'}).success).toBe(false);});
});
