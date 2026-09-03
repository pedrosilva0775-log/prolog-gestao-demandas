import path from "node:path";
import { lstat, readdir, realpath, stat } from "node:fs/promises";
import type { Kysely } from "kysely";
import type { Database } from "../database.js";

export type InventoryIssue={kind:"missing_file"|"orphan_file"|"ambiguous_reference"|"cleanup_required"|"invalid_path"|"escaping_symlink"|"size_mismatch"|"read_error";storageKey:string;detail:string};
export type AttachmentInventory={root:string;generatedAt:string;summary:Record<InventoryIssue["kind"],number>;issues:InventoryIssue[]};
const kinds:InventoryIssue["kind"][]=["missing_file","orphan_file","ambiguous_reference","cleanup_required","invalid_path","escaping_symlink","size_mismatch","read_error"];
export const inventoryAttachments=async(db:Kysely<Database>,rootInput:string,recentMs=5*60_000):Promise<AttachmentInventory>=>{
  const root=await realpath(path.resolve(rootInput));const issues:InventoryIssue[]=[];
  const metadata=await db.selectFrom("attachment_files").select(["storage_key","size_bytes"]).execute();
  const known=new Map(metadata.map(item=>[item.storage_key,Number(item.size_bytes)]));
  for(const item of metadata){if(!/^[a-f0-9-]{36}\.(?:png|jpg|webp|gif)$/i.test(item.storage_key)){issues.push({kind:"invalid_path",storageKey:item.storage_key,detail:"storage_key fora do formato permitido"});continue;}const candidate=path.join(root,item.storage_key);try{const actual=await realpath(candidate);if(!actual.startsWith(`${root}${path.sep}`)){issues.push({kind:"escaping_symlink",storageKey:item.storage_key,detail:"destino fora da raiz"});continue;}const info=await stat(actual);if(info.size!==Number(item.size_bytes))issues.push({kind:"size_mismatch",storageKey:item.storage_key,detail:`esperado=${item.size_bytes}; atual=${info.size}`});}catch(error){const code=typeof error==="object"&&error&&"code" in error?String(error.code):"UNKNOWN";issues.push({kind:code==="ENOENT"?"missing_file":"read_error",storageKey:item.storage_key,detail:`falha=${code}`});}}
  try{for(const name of await readdir(root)){if(known.has(name))continue;const candidate=path.join(root,name);try{const link=await lstat(candidate);if(link.isSymbolicLink()){const actual=await realpath(candidate);if(!actual.startsWith(`${root}${path.sep}`))issues.push({kind:"escaping_symlink",storageKey:name,detail:"link órfão aponta para fora da raiz"});continue;}if(link.isFile()&&Date.now()-link.mtimeMs>=recentMs)issues.push({kind:"orphan_file",storageKey:name,detail:"arquivo sem metadados e fora da janela de operação"});}catch(error){issues.push({kind:"read_error",storageKey:name,detail:`falha=${typeof error==="object"&&error&&"code" in error?String(error.code):"UNKNOWN"}`});}}}catch(error){issues.push({kind:"read_error",storageKey:".",detail:`falha ao listar raiz: ${typeof error==="object"&&error&&"code" in error?String(error.code):"UNKNOWN"}`});}
  const ambiguous=await db.selectFrom("attachment_backfill_issues").select(["storage_key","reference_count"]).where("reason","=","AMBIGUOUS_REFERENCE").execute();for(const item of ambiguous)issues.push({kind:"ambiguous_reference",storageKey:item.storage_key,detail:`referências=${item.reference_count}`});
  const cleanup=await db.selectFrom("attachment_backfill_issues").select("storage_key").where("reason","=","CLEANUP_REQUIRED").execute();for(const item of cleanup)issues.push({kind:"cleanup_required",storageKey:item.storage_key,detail:"remocao fisica pendente; investigar sem expor o arquivo"});
  const summary=Object.fromEntries(kinds.map(kind=>[kind,issues.filter(issue=>issue.kind===kind).length])) as Record<InventoryIssue["kind"],number>;
  return{root,generatedAt:new Date().toISOString(),summary,issues};
};
