/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FEATURE_GOOGLE_WORKSPACE?: string;
  readonly VITE_FEATURE_ANDROID?: string;
  readonly VITE_FEATURE_WEBHOOKS?: string;
  readonly VITE_FEATURE_AUTOMATIONS?: string;
  readonly VITE_FEATURE_BACKUP_UI?: string;
  readonly VITE_FEATURE_SLA_ADVANCED?: string;
  readonly VITE_FEATURE_APPROVALS?: string;
  readonly VITE_FEATURE_RISKS?: string;
  readonly VITE_FEATURE_RECURRENCE?: string;
  readonly VITE_FEATURE_SCHEDULED_REPORTS?: string;
  readonly VITE_FEATURE_OFFLINE_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
