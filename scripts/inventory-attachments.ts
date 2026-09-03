import { writeFile } from "node:fs/promises";
import { closeDatabase, getDatabase } from "../src/server/database.js";
import { inventoryAttachments } from "../src/server/attachments/inventory.js";
const root=process.argv[2];const reportPath=process.argv[3];
if(!process.env.DATABASE_URL||!root||!reportPath)throw new Error("Uso: DATABASE_URL=... npm run attachments:inventory -- <diretório> <relatório.json>");
try{const report=await inventoryAttachments(getDatabase(),root);await writeFile(reportPath,JSON.stringify(report,null,2),{flag:"wx",mode:0o600});process.stdout.write(`${JSON.stringify(report.summary)}\nRelatório: ${reportPath}\n`);}finally{await closeDatabase();}
