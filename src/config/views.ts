import { ActiveView } from '../types';
import { features } from './features';

const disabledViews = new Set<ActiveView>([
  ...(!features.googleWorkspace ? ['google_integrations' as ActiveView] : []),
  ...(!features.android ? ['android' as ActiveView, 'android_distribution' as ActiveView] : []),
  ...(!features.webhooks ? ['api_webhooks' as ActiveView] : []),
  ...(!features.backupUi ? ['system_health' as ActiveView, 'system_health_backup' as ActiveView] : []),
  ...(!features.slaAdvanced ? ['sla' as ActiveView, 'sla_management' as ActiveView] : []),
  ...(!features.risks ? ['risks' as ActiveView] : []),
  ...(!features.recurrence ? ['templates' as ActiveView, 'templates_recurrence' as ActiveView] : []),
  ...(!features.scheduledReports ? ['reports' as ActiveView, 'scheduled_reports' as ActiveView] : []),
]);

export const isViewEnabled = (view: ActiveView): boolean => !disabledViews.has(view);
