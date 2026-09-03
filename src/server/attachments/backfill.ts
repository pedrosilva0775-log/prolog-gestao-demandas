import { sql, type Kysely } from "kysely";
import type { Database } from "../database.js";

export const backfillAttachmentMetadata=async(db:Kysely<Database>)=>{
  await sql`WITH attachment_refs AS (
    SELECT d.id demand_id,comment->>'id' comment_id,attachment,regexp_replace(attachment->>'url','^/uploads/','') storage_key
    FROM demands d CROSS JOIN LATERAL jsonb_array_elements(COALESCE(d.payload->'comments','[]'::jsonb)) comment
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(comment->'attachments','[]'::jsonb)) attachment WHERE attachment->>'url' LIKE '/uploads/%'
  ), unambiguous AS (
    SELECT storage_key,min(demand_id) demand_id,min(comment_id) comment_id,min(attachment->>'name') original_name,min(attachment->>'type') mime_type,min((attachment->>'size')::bigint) size_bytes,min(attachment->>'uploadedByUserId') uploaded_by
    FROM attachment_refs GROUP BY storage_key HAVING count(*)=1
  ) INSERT INTO attachment_files(id,demand_id,comment_id,storage_key,original_name,mime_type,size_bytes,uploaded_by)
    SELECT 'attf-'||md5(storage_key),demand_id,comment_id,storage_key,COALESCE(original_name,'arquivo'),COALESCE(mime_type,'application/octet-stream'),LEAST(COALESCE(size_bytes,0),2097152),uploaded_by FROM unambiguous ON CONFLICT(storage_key) DO NOTHING`.execute(db);
  await sql`WITH attachment_refs AS (
    SELECT regexp_replace(attachment->>'url','^/uploads/','') storage_key FROM demands d
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(d.payload->'comments','[]'::jsonb)) comment
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(comment->'attachments','[]'::jsonb)) attachment WHERE attachment->>'url' LIKE '/uploads/%'
  ) INSERT INTO attachment_backfill_issues(storage_key,reason,reference_count)
    SELECT storage_key,'AMBIGUOUS_REFERENCE',count(*)::integer FROM attachment_refs GROUP BY storage_key HAVING count(*)>1
    ON CONFLICT(storage_key) DO UPDATE SET reason=EXCLUDED.reason,reference_count=EXCLUDED.reference_count,detected_at=now()`.execute(db);
};
