import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { AuthorizedModuleDto } from '../contracts';
import { ModuleSelector } from '../components/modules/ModuleSelector';
import { resolveModuleSelection } from './ModuleContext';

const item=(id:string,slug:string):AuthorizedModuleDto=>({id,name:slug,slug,description:'',icon:'FolderKanban',color:'#2563eb',active:true,createdBy:null,version:1,deletedAt:null,createdAt:'2026-09-01T00:00:00.000Z',updatedAt:'2026-09-01T00:00:00.000Z',counts:{users:1,teams:0,demands:0},role:'member'});
describe('seleção de módulo',()=>{
  it('prioriza URL autorizada, depois preferência validada e seleção única',()=>{const modules=[item('m1','tecnologia'),item('m2','transporte')];expect(resolveModuleSelection(modules,'transporte','tecnologia')?.id).toBe('m2');expect(resolveModuleSelection(modules,'inexistente','tecnologia')?.id).toBe('m1');expect(resolveModuleSelection([modules[0]],'','')?.id).toBe('m1');expect(resolveModuleSelection(modules,'','')).toBeNull();});
  it('não aceita slug armazenado sem autorização',()=>{expect(resolveModuleSelection([item('m1','tecnologia')],'','juridico')?.slug).toBe('tecnologia');expect(resolveModuleSelection([],'tecnologia','tecnologia')).toBeNull();});
  it('renderiza estado vazio acessível e ação de saída',()=>{const html=renderToStaticMarkup(<ModuleSelector modules={[]} error="" onSelect={vi.fn()} onRetry={vi.fn()}/>);expect(html).toContain('Nenhum módulo disponível');expect(html).toContain('Sair');});
});
