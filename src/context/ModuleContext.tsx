import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthorizedModuleDto } from '../contracts';
import { ApiError, apiClient, setActiveApiModule } from '../services/apiClient';
import { ModuleSelector } from '../components/modules/ModuleSelector';

type ModuleContextValue={modules:AuthorizedModuleDto[];currentModule:AuthorizedModuleDto;selectModule:(module:AuthorizedModuleDto)=>void;chooseAnotherModule:()=>void;refreshModules:()=>Promise<void>};
const ModuleContext=createContext<ModuleContextValue|null>(null);
const moduleSlugFromUrl=()=>decodeURIComponent(window.location.pathname.match(/^\/modules\/([^/]+)/)?.[1]??'');
export const resolveModuleSelection=(available:AuthorizedModuleDto[],urlSlug:string,storedSlug:string)=>available.find(item=>item.slug===urlSlug)||available.find(item=>item.slug===storedSlug)||(available.length===1?available[0]:null);

export const ModuleProvider:React.FC<{children:React.ReactNode}>=({children})=>{
  const [modules,setModules]=useState<AuthorizedModuleDto[]>([]);
  const [currentModule,setCurrentModule]=useState<AuthorizedModuleDto|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const load=useCallback(async()=>{setLoading(true);setError('');try{const available=await apiClient.authorizedModules();setModules(available);const urlSlug=moduleSlugFromUrl();const stored=localStorage.getItem('prolog:last-module-slug')??'';const selected=resolveModuleSelection(available,urlSlug,stored);setActiveApiModule(selected?.id??'');setCurrentModule(selected);if(selected&&urlSlug!==selected.slug)window.history.replaceState({},'',`/modules/${encodeURIComponent(selected.slug)}`);}catch(cause){setActiveApiModule('');setError(cause instanceof ApiError?cause.message:'Não foi possível carregar os módulos autorizados.');setCurrentModule(null);}finally{setLoading(false);}},[]);
  useEffect(()=>{void load();},[load]);
  useEffect(()=>{const onPopState=()=>{const slug=moduleSlugFromUrl();setCurrentModule(modules.find(item=>item.slug===slug)??null);};window.addEventListener('popstate',onPopState);return()=>window.removeEventListener('popstate',onPopState);},[modules]);
  useEffect(()=>{setActiveApiModule(currentModule?.id??'');},[currentModule]);
  const selectModule=useCallback((module:AuthorizedModuleDto)=>{if(!modules.some(item=>item.id===module.id))return;setActiveApiModule(module.id);localStorage.setItem('prolog:last-module-slug',module.slug);setCurrentModule(module);window.history.pushState({},'',`/modules/${encodeURIComponent(module.slug)}`);},[modules]);
  const chooseAnotherModule=useCallback(()=>{setActiveApiModule('');setCurrentModule(null);window.history.pushState({},'','/modules');},[]);
  const value=useMemo(()=>currentModule?{modules,currentModule,selectModule,chooseAnotherModule,refreshModules:load}:null,[modules,currentModule,selectModule,chooseAnotherModule,load]);
  if(loading)return <main className="min-h-dvh grid place-items-center bg-slate-50 text-sm font-bold text-slate-600" aria-live="polite">Carregando módulos autorizados…</main>;
  if(!value)return <ModuleSelector modules={modules} error={error} onSelect={selectModule} onRetry={load}/>;
  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
};

export const useModule=()=>{const context=useContext(ModuleContext);if(!context)throw new Error('useModule deve ser usado dentro de ModuleProvider com um módulo selecionado.');return context;};
