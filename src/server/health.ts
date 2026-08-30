import { Router } from 'express';
import { sql } from 'kysely';
import { getDatabase } from './database.js';

const startedAt=Date.now();
export const createHealthRouter=()=>{
  const router=Router();
  router.get('/health',(_req,res)=>res.status(200).set('Cache-Control','no-store').json({status:'ok',uptimeSeconds:Math.floor((Date.now()-startedAt)/1000)}));
  router.get('/ready',async(_req,res)=>{try{await Promise.race([sql`select 1`.execute(getDatabase()),new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),2000))]);return res.status(200).set('Cache-Control','no-store').json({status:'ready'});}catch{return res.status(503).set('Cache-Control','no-store').json({status:'not_ready'});}});
  return router;
};
