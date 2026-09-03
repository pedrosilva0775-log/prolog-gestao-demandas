import path from "node:path";
import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { Router, type Request, type Response } from "express";
import { getDatabase } from "../database.js";
import { isAuthorized, type ModuleRole } from "../authorization/policy.js";

type Session={id:string;role?:string};
type Override={permission:string;effect:"allow"|"deny"};
type Options={validateSession:(request:Request)=>Promise<Session|null>;readOverrides?:(userId:string)=>Promise<Override[]>};
const inaccessible=(res:Response)=>res.status(404).json({message:"Arquivo não encontrado."});

export const createProtectedAttachmentsRouter=({validateSession,readOverrides}:Options)=>{
  const router=Router();
  const handler=async(req:Request<{storageKey:string}>,res:Response)=>{
    const session=await validateSession(req);
    if(!session)return res.status(401).json({message:"Sessão inválida ou revogada."});
    const key=String(req.params.storageKey??"");
    if(!/^[a-f0-9-]{36}\.(?:png|jpg|webp|gif)$/i.test(key))return inaccessible(res);
    const db=getDatabase();
    const row=await db.selectFrom("attachment_files")
      .innerJoin("demands","demands.id","attachment_files.demand_id")
      .innerJoin("operational_modules","operational_modules.id","demands.module_id")
      .leftJoin("module_members",join=>join.onRef("module_members.module_id","=","demands.module_id").on("module_members.user_id","=",session.id))
      .select(["attachment_files.storage_key","attachment_files.original_name","attachment_files.mime_type","attachment_files.size_bytes","attachment_files.comment_id","demands.payload","demands.deleted_at","operational_modules.active as module_active","operational_modules.deleted_at as module_deleted_at","module_members.role as module_role","module_members.active as membership_active"])
      .where("attachment_files.storage_key","=",key).executeTakeFirst();
    if(!row||row.deleted_at||!row.module_active||row.module_deleted_at)return inaccessible(res);
    const comments=typeof row.payload==="object"&&row.payload&&"comments" in row.payload&&Array.isArray(row.payload.comments)?row.payload.comments:[];
    const linked=comments.some((comment:unknown)=>{
      if(!comment||typeof comment!=="object"||!("id" in comment)||!("attachments" in comment))return false;
      return comment.id===row.comment_id&&Array.isArray(comment.attachments)&&comment.attachments.some((item:unknown)=>Boolean(item)&&typeof item==="object"&&"url" in item&&item.url===`/uploads/${key}`);
    });
    if(!linked)return inaccessible(res);
    let overrides:Override[];
    try{overrides=readOverrides?await readOverrides(session.id):await db.selectFrom("user_permissions").select(["permission","effect"]).where("user_id","=",session.id).execute();}
    catch{return res.status(503).json({message:"Arquivo temporariamente indisponível."});}
    const allowed=isAuthorized({permission:"demands:read",scope:"module",globalRole:session.role??"",moduleRole:row.module_role as ModuleRole|undefined,moduleActive:row.module_active,membershipActive:Boolean(row.membership_active),grants:overrides.filter(x=>x.effect==="allow").map(x=>x.permission),revocations:overrides.filter(x=>x.effect==="deny").map(x=>x.permission)});
    if(!allowed)return inaccessible(res);
    const root=await realpath(path.resolve(process.env.UPLOAD_DIR||"uploads")).catch(()=>null);
    const file=await realpath(path.resolve(process.env.UPLOAD_DIR||"uploads",key)).catch(()=>null);
    if(!root||!file||(!file.startsWith(`${root}${path.sep}`)))return inaccessible(res);
    const info=await stat(file).catch(()=>null);
    if(!info?.isFile()||info.size!==Number(row.size_bytes))return inaccessible(res);
    const safeName=row.original_name.replace(/["\r\n\\/]/g,"_");
    const inline=["image/png","image/jpeg","image/webp","image/gif"].includes(row.mime_type);
    res.setHeader("Content-Type",row.mime_type);
    res.setHeader("Content-Length",String(info.size));
    res.setHeader("Content-Disposition",`${inline?"inline":"attachment"}; filename="${safeName}"`);
    res.setHeader("Cache-Control","private, no-store");
    res.setHeader("X-Content-Type-Options","nosniff");
    if(req.method==="HEAD")return res.status(200).end();
    createReadStream(file).on("error",()=>{if(!res.headersSent)inaccessible(res);else res.destroy();}).pipe(res);
  };
  router.get("/:storageKey",handler);
  router.head("/:storageKey",handler);
  return router;
};
