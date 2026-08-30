import { describe, expect, it } from 'vitest';
import { createDefaultReportConfiguration, createNativePreset, statusMatches } from './reportBuilder';

const statuses:any[]=[{id:'nova',name:'Nova',active:true},{id:'andamento',name:'Em Andamento',active:true},{id:'terceiros',name:'Aguardando Terceiros',active:true},{id:'bloqueada',name:'Bloqueada',active:true},{id:'concluida',name:'Concluída',active:true}];
const categories:any[]=[{id:'projeto',name:'Projeto'},{id:'melhoria',name:'Melhoria'},{id:'tarefa',name:'Tarefa'}];

describe('construtor do relatório executivo',()=>{
  it('cria o padrão com status, categorias e regra de impedimentos',()=>{const config=createDefaultReportConfiguration(statuses,categories);expect(config.statusIds).toHaveLength(5);expect(config.categoryIds).toEqual(['projeto','melhoria','tarefa']);expect(config.impedimentStatusIds).toEqual(['terceiros','bloqueada']);});
  it('aplica presets nativos sem alterar o fluxo do Kanban',()=>{expect(createNativePreset('Executivo',statuses,categories).blocks).toContain('executiveSummary');expect(createNativePreset('Completo',statuses,categories).blocks).toHaveLength(12);});
  it('compara nomes de status ignorando acentos e caixa',()=>{expect(statusMatches({name:'Em Validação'} as any,'validacao')).toBe(true);});
});
