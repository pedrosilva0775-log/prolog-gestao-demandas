import { getDatabase, closeDatabase } from '../src/server/database.js';
import { INITIAL_STATUSES } from '../src/data/initialData.js';
import { sql } from 'kysely';

const db = getDatabase();
const value = sql<unknown>`${JSON.stringify(INITIAL_STATUSES)}::jsonb`;
await db
  .insertInto('configurations')
  .values({ key: 'statuses', value, updated_by: null, updated_at: new Date() })
  .onConflict(conflict => conflict.column('key').doUpdateSet({ value, updated_at: new Date() }))
  .execute();
const modules=await db.selectFrom('operational_modules').select('id').where('deleted_at','is',null).execute();
for(const module of modules){
  await db.insertInto('module_configurations').values({module_id:module.id,key:'statuses',value,updated_by:null,updated_at:new Date()}).onConflict(conflict=>conflict.columns(['module_id','key']).doUpdateSet({value,updated_at:new Date()})).execute();
}
await closeDatabase();
console.log(`Configuração restaurada com ${INITIAL_STATUSES.length} status em ${modules.length} módulos.`);
