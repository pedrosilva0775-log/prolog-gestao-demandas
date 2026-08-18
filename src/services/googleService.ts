/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GoogleIntegrationService,
  AutomationRule,
  Demand,
  User,
  GoogleSyncMetadata
} from '../types';

export interface GoogleSyncResult {
  success: boolean;
  serviceKey: string;
  message: string;
  externalUrl?: string;
  details?: Record<string, any>;
}

export const GoogleService = {
  /**
   * Simulates OAuth 2.0 connection popup to Google Workspace
   */
  connectAccount: async (
    serviceKey: string,
    userEmail: string
  ): Promise<{ success: boolean; accountEmail: string; message: string }> => {
    // Simulating instant authorization handshake
    await new Promise((res) => setTimeout(res, 600));
    return {
      success: true,
      accountEmail: userEmail,
      message: `Conta Google ${userEmail} conectada com sucesso aos escopos autorizados.`
    };
  },

  /**
   * Toggles connection state for a Google Integration Service
   */
  toggleServiceConnection: async (
    services: GoogleIntegrationService[],
    serviceKey: string,
    connected: boolean
  ): Promise<GoogleIntegrationService[]> => {
    return services.map((s) =>
      s.serviceKey === serviceKey
        ? {
            ...s,
            connected,
            status: connected ? 'idle' : 'idle',
            lastSync: connected ? new Date().toISOString() : s.lastSync
          }
        : s
    );
  },

  /**
   * Sync a demand to Google Calendar (Creates or updates event)
   */
  syncToGoogleCalendar: async (
    demand: Demand,
    assignee?: User
  ): Promise<GoogleSyncResult> => {
    await new Promise((res) => setTimeout(res, 400));
    const eventId = `gcal-${demand.id}-${Date.now().toString(36)}`;
    const eventUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(
      `[${demand.code}] ${demand.title}`
    )}&dates=${new Date(demand.plannedStartDate || demand.createdAt)
      .toISOString()
      .replace(/[-:]/g, '')
      .slice(0, 15)}Z/${new Date(demand.dueDate)
      .toISOString()
      .replace(/[-:]/g, '')
      .slice(0, 15)}Z&details=${encodeURIComponent(
      `5W2H:\n- Motivo: ${demand.whyReason}\n- Onde: ${demand.whereLocation}\n- Como: ${demand.howExecutionGuide}\n- Responsável: ${
        assignee?.name || 'N/A'
      }`
    )}`;

    return {
      success: true,
      serviceKey: 'calendar',
      message: `Evento de marco "${demand.code}" sincronizado no Google Calendar.`,
      externalUrl: eventUrl,
      details: { eventId, syncedAt: new Date().toISOString() }
    };
  },

  /**
   * Sync a demand to Google Sheets (Appends or updates master project row)
   */
  syncToGoogleSheet: async (
    demand: Demand,
    statusName: string
  ): Promise<GoogleSyncResult> => {
    await new Promise((res) => setTimeout(res, 350));
    return {
      success: true,
      serviceKey: 'sheets',
      message: `Linha de acompanhamento atualizada na Planilha Corporativa (Status: ${statusName}).`,
      externalUrl: 'https://docs.google.com/spreadsheets/d/gestao-demandas-master-2026',
      details: { rowId: 4, syncedAt: new Date().toISOString() }
    };
  },

  /**
   * Generates a Google Docs 5W2H Action Plan summary
   */
  generateGoogleDoc: async (demand: Demand): Promise<GoogleSyncResult> => {
    await new Promise((res) => setTimeout(res, 500));
    const docUrl = `https://docs.google.com/document/d/plano-5w2h-${demand.code.toLowerCase()}`;
    return {
      success: true,
      serviceKey: 'docs',
      message: `Documento 5W2H "${demand.code} - Plano de Ação" gerado no Google Docs.`,
      externalUrl: docUrl
    };
  },

  /**
   * Generates a Google Slides Executive Deck slide for Board meeting
   */
  generateGoogleSlide: async (demand: Demand): Promise<GoogleSyncResult> => {
    await new Promise((res) => setTimeout(res, 500));
    const slideUrl = `https://docs.google.com/presentation/d/deck-executivo-${demand.code.toLowerCase()}`;
    return {
      success: true,
      serviceKey: 'slides',
      message: `Slide executivo da demanda "${demand.code}" adicionado à Apresentação da Diretoria.`,
      externalUrl: slideUrl
    };
  },

  /**
   * Creates a dedicated Google Drive folder structure for a Project
   */
  createGoogleDriveFolder: async (
    demand: Demand
  ): Promise<GoogleSyncResult> => {
    await new Promise((res) => setTimeout(res, 400));
    const folderUrl = `https://drive.google.com/drive/folders/projeto-${demand.code.toLowerCase()}`;
    return {
      success: true,
      serviceKey: 'drive',
      message: `Pasta corporativa no Google Drive criada: [${demand.code}] ${demand.title}`,
      externalUrl: folderUrl
    };
  },

  /**
   * Sends an automated alert to Google Chat space
   */
  sendGoogleChatAlert: async (
    spaceName: string,
    message: string
  ): Promise<GoogleSyncResult> => {
    await new Promise((res) => setTimeout(res, 300));
    return {
      success: true,
      serviceKey: 'chat',
      message: `Notificação enviada ao espaço "${spaceName}" no Google Chat: "${message}"`
    };
  },

  /**
   * Executes Automation Recipe based on event trigger
   */
  runAutomationTrigger: async (
    trigger: AutomationRule['triggerEvent'],
    demand: Demand,
    automations: AutomationRule[],
    assignee?: User
  ): Promise<{ executedRules: string[]; results: GoogleSyncResult[] }> => {
    const matchingRules = automations.filter(
      (a) => a.active && a.triggerEvent === trigger
    );
    const results: GoogleSyncResult[] = [];
    const executedRules: string[] = [];

    for (const rule of matchingRules) {
      executedRules.push(rule.title);
      switch (rule.actionType) {
        case 'google_calendar_create_event':
        case 'google_calendar_update_event':
          results.push(await GoogleService.syncToGoogleCalendar(demand, assignee));
          break;
        case 'google_sheets_update_status':
        case 'google_sheets_append_row':
          results.push(await GoogleService.syncToGoogleSheet(demand, demand.statusId));
          break;
        case 'google_drive_create_folder':
          results.push(await GoogleService.createGoogleDriveFolder(demand));
          break;
        case 'google_chat_send_alert':
          results.push(
            await GoogleService.sendGoogleChatAlert(
              'Liderança & Diretoria',
              `⚠️ Alerta de Demanda: [${demand.code}] ${demand.title} - ${demand.blocker?.reason || 'Status alterado'}`
            )
          );
          break;
        case 'google_docs_generate_summary':
          results.push(await GoogleService.generateGoogleDoc(demand));
          break;
      }
    }

    return { executedRules, results };
  }
};
