export type Feature =
  | 'googleWorkspace'
  | 'android'
  | 'webhooks'
  | 'automations'
  | 'backupUi'
  | 'slaAdvanced'
  | 'approvals'
  | 'risks'
  | 'recurrence'
  | 'scheduledReports'
  | 'offlineMode';

const enabled = (value: string | undefined): boolean => value === 'true';

export const features: Readonly<Record<Feature, boolean>> = Object.freeze({
  googleWorkspace: enabled(import.meta.env.VITE_FEATURE_GOOGLE_WORKSPACE),
  android: enabled(import.meta.env.VITE_FEATURE_ANDROID),
  webhooks: enabled(import.meta.env.VITE_FEATURE_WEBHOOKS),
  automations: enabled(import.meta.env.VITE_FEATURE_AUTOMATIONS),
  backupUi: enabled(import.meta.env.VITE_FEATURE_BACKUP_UI),
  slaAdvanced: enabled(import.meta.env.VITE_FEATURE_SLA_ADVANCED),
  approvals: enabled(import.meta.env.VITE_FEATURE_APPROVALS),
  risks: enabled(import.meta.env.VITE_FEATURE_RISKS),
  recurrence: enabled(import.meta.env.VITE_FEATURE_RECURRENCE),
  scheduledReports: enabled(import.meta.env.VITE_FEATURE_SCHEDULED_REPORTS),
  offlineMode: enabled(import.meta.env.VITE_FEATURE_OFFLINE_MODE),
});

export const isFeatureEnabled = (feature: Feature): boolean => features[feature];
