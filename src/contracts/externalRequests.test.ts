import { describe, expect, it } from 'vitest';
import { externalLinkCreateSchema, externalLinkCreatedSchema, externalRequestSubmitSchema } from './externalRequests';

const id=(prefix:string)=>`${prefix}-12345678`;

describe('contratos de solicitações externas',()=>{
  it('aceita a configuração segura padrão de um link',()=>{
    const parsed=externalLinkCreateSchema.parse({clientId:id('cli'),moduleId:id('mod'),recipientUserId:id('usr'),allowedTypes:['task']});
    expect(parsed.maxSubmissions).toBe(1);
  });
  it('não aceita destino, campos internos ou tipo adulterado na submissão pública',()=>{
    const base={idempotencyKey:'aa3d29af-32af-4425-a5cc-940987756835',name:'Pessoa Cliente',email:'cliente@example.test',type:'task',title:'Solicitação válida',description:'Descrição externa suficientemente detalhada.'};
    expect(externalRequestSubmitSchema.safeParse({...base,moduleId:id('mod')}).success).toBe(false);
    expect(externalRequestSubmitSchema.safeParse({...base,type:'admin'}).success).toBe(false);
  });
  it('expõe o token somente na resposta única de criação do link',()=>{
    const now=new Date().toISOString();
    expect(externalLinkCreatedSchema.safeParse({link:{id:id('lnk'),clientId:id('cli'),moduleId:id('mod'),recipientUserId:id('usr'),allowedTypes:['project'],expiresAt:now,maxSubmissions:1,submissionCount:0,revokedAt:null,createdAt:now,version:1},token:'x'.repeat(43),path:`/request/${'x'.repeat(43)}`}).success).toBe(true);
  });
});
