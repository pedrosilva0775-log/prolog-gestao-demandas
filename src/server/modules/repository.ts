import type { Kysely, Selectable, Transaction } from 'kysely';
import type { Database } from '../database.js';

export type ModuleRow=Selectable<Database['operational_modules']>;
export type DbConnection=Kysely<Database>|Transaction<Database>;

export const findModule=async(db:DbConnection,id:string,includeDeleted=false)=>{
  let query=db.selectFrom('operational_modules').selectAll().where('id','=',id);
  if(!includeDeleted)query=query.where('deleted_at','is',null);
  return query.executeTakeFirst();
};

export const findMembership=(db:DbConnection,moduleId:string,userId:string)=>db.selectFrom('module_members').selectAll().where('module_id','=',moduleId).where('user_id','=',userId).executeTakeFirst();

export const moduleCounts=async(db:DbConnection,moduleId:string)=>{
  const [users,teams,demands]=await Promise.all([
    db.selectFrom('module_members').select(({fn})=>fn.countAll<number>().as('count')).where('module_id','=',moduleId).where('active','=',true).executeTakeFirstOrThrow(),
    db.selectFrom('team_modules').select(({fn})=>fn.countAll<number>().as('count')).where('module_id','=',moduleId).executeTakeFirstOrThrow(),
    db.selectFrom('demands').select(({fn})=>fn.countAll<number>().as('count')).where('module_id','=',moduleId).where('deleted_at','is',null).executeTakeFirstOrThrow()
  ]);
  return {users:Number(users.count),teams:Number(teams.count),demands:Number(demands.count)};
};

export const activeModuleAdminCount=async(db:DbConnection,moduleId:string)=>Number((await db.selectFrom('module_members').select(({fn})=>fn.countAll<number>().as('count')).where('module_id','=',moduleId).where('role','=','module_admin').where('active','=',true).executeTakeFirstOrThrow()).count);
