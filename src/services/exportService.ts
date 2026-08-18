/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ExcelJS from 'exceljs';
import { toPng } from 'html-to-image';
import { Demand, User, Team, CategoryConfig, StatusConfig, PriorityConfig } from '../types';

export interface ExcelExportOptions {
  fileName?: string;
  demands: Demand[];
  users: User[];
  teams: Team[];
  categories: CategoryConfig[];
  statuses: StatusConfig[];
  priorities: PriorityConfig[];
  currentUser: User;
  includeSummaryTab?: boolean;
  selectedColumns?: string[];
  filterSummaryText?: string;
}

export const ALL_COLUMNS = [
  { key: 'code', label: 'Código' },
  { key: 'title', label: 'Título' },
  { key: 'category', label: 'Categoria' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Prioridade' },
  { key: 'team', label: 'Equipe' },
  { key: 'assignee', label: 'Responsável' },
  { key: 'requester', label: 'Solicitante' },
  { key: 'progress', label: 'Progresso (%)' },
  { key: 'dueDate', label: 'Prazo Final' },
  { key: 'plannedStartDate', label: 'Início Planejado' },
  { key: 'completedAt', label: 'Concluído Em' },
  { key: 'whyReason', label: 'Por Que (Motivo)' },
  { key: 'whereLocation', label: 'Onde (Local/Processo)' },
  { key: 'howExecutionGuide', label: 'Como Executar' },
  { key: 'expectedOutcome', label: 'Resultado Esperado' },
  { key: 'isBlocked', label: 'Bloqueado?' },
  { key: 'blockerReason', label: 'Motivo do Bloqueio' },
  { key: 'blockerAction', label: 'Ação Necessária' },
  { key: 'tags', label: 'Etiquetas' },
  { key: 'checklistsSummary', label: 'Checklist (Concluído/Total)' },
  { key: 'extensionsCount', label: 'Qtd. Prorrogações' },
  { key: 'createdAt', label: 'Data de Cadastro' },
];

export const ExportService = {
  /**
   * Generates and downloads a rich multi-sheet Excel Workbook (.xlsx)
   */
  exportToExcel: async (options: ExcelExportOptions): Promise<void> => {
    const {
      fileName = `Gestao_de_Demandas_Relatorio_${new Date().toISOString().slice(0, 10)}.xlsx`,
      demands,
      users,
      teams,
      categories,
      statuses,
      priorities,
      currentUser,
      includeSummaryTab = true,
      selectedColumns = ALL_COLUMNS.map(c => c.key),
      filterSummaryText = 'Todos os registros (sem filtros restritivos)'
    } = options;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = `${currentUser.name} (${currentUser.roleTitle})`;
    workbook.lastModifiedBy = currentUser.name;
    workbook.created = new Date();
    workbook.modified = new Date();

    const userMap = new Map(users.map(u => [u.id, u]));
    const teamMap = new Map(teams.map(t => [t.id, t]));
    const catMap = new Map(categories.map(c => [c.id, c]));
    const statusMap = new Map(statuses.map(s => [s.id, s]));
    const prioMap = new Map(priorities.map(p => [p.id, p]));

    // ----------------------------------------------------
    // TAB 1: RESUMO EXECUTIVO (If requested)
    // ----------------------------------------------------
    if (includeSummaryTab) {
      const summarySheet = workbook.addWorksheet('Resumo Executivo', {
        views: [{ showGridLines: true }]
      });

      // Title & Metadata
      summarySheet.mergeCells('A1:F1');
      const titleCell = summarySheet.getCell('A1');
      titleCell.value = 'PAINEL EXECUTIVO - GESTÃO DE DEMANDAS & PROJETOS';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' } // Slate 800
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      summarySheet.getRow(1).height = 36;

      summarySheet.mergeCells('A2:F2');
      const subCell = summarySheet.getCell('A2');
      subCell.value = `Exportado por: ${currentUser.name} (${currentUser.email}) | Data: ${new Date().toLocaleString('pt-BR')} | Filtros: ${filterSummaryText}`;
      subCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF64748B' } };
      subCell.alignment = { vertical: 'middle', horizontal: 'left' };
      summarySheet.getRow(2).height = 20;

      // KPIs calculation
      const total = demands.length;
      const completed = demands.filter(d => statusMap.get(d.statusId)?.category === 'completed').length;
      const blocked = demands.filter(d => d.blocker?.isBlocked || statusMap.get(d.statusId)?.category === 'blocked').length;
      const now = new Date();
      const overdue = demands.filter(d => {
        const isComp = statusMap.get(d.statusId)?.category === 'completed';
        const isCanc = statusMap.get(d.statusId)?.category === 'cancelled';
        return !isComp && !isCanc && new Date(d.dueDate) < now;
      }).length;
      const inProgress = demands.filter(d => statusMap.get(d.statusId)?.category === 'in_progress').length;
      const criticalCount = demands.filter(d => prioMap.get(d.priorityId)?.level === 5).length;
      const avgProgress = total > 0 ? Math.round(demands.reduce((acc, d) => acc + d.progressPercent, 0) / total) : 0;

      // KPI Cards Row 4-5
      summarySheet.getCell('A4').value = 'Total de Demandas';
      summarySheet.getCell('A5').value = total;
      summarySheet.getCell('B4').value = 'Em Andamento';
      summarySheet.getCell('B5').value = inProgress;
      summarySheet.getCell('C4').value = 'Concluídas';
      summarySheet.getCell('C5').value = completed;
      summarySheet.getCell('D4').value = 'Atrasadas (Vencidas)';
      summarySheet.getCell('D5').value = overdue;
      summarySheet.getCell('E4').value = 'Bloqueadas / Risco';
      summarySheet.getCell('E5').value = blocked;
      summarySheet.getCell('F4').value = 'Média de Progresso';
      summarySheet.getCell('F5').value = `${avgProgress}%`;

      ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
        const header = summarySheet.getCell(`${col}4`);
        const value = summarySheet.getCell(`${col}5`);

        header.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF475569' } };
        header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        header.alignment = { horizontal: 'center', vertical: 'middle' };
        header.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

        value.font = { name: 'Arial', size: 16, bold: true, color: col === 'D' ? { argb: 'FFDC2626' } : col === 'E' ? { argb: 'FFEA580C' } : col === 'C' ? { argb: 'FF16A34A' } : { argb: 'FF0F172A' } };
        value.alignment = { horizontal: 'center', vertical: 'middle' };
        value.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        value.border = { bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
      summarySheet.getRow(4).height = 22;
      summarySheet.getRow(5).height = 30;

      // Section: Demandas Críticas que exigem Atenção da Diretoria
      summarySheet.getCell('A7').value = 'ATENÇÃO DA DIRETORIA: Demandas Críticas, Bloqueadas ou com Atraso Elevado';
      summarySheet.getCell('A7').font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF991B1B' } };
      summarySheet.mergeCells('A7:F7');

      const criticalHeaderRow = summarySheet.getRow(8);
      criticalHeaderRow.values = ['Código', 'Título da Demanda', 'Categoria', 'Responsável', 'Prazo', 'Situação / Bloqueio'];
      criticalHeaderRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      criticalHeaderRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        cell.alignment = { vertical: 'middle' };
      });

      const attentionDemands = demands.filter(d => 
        d.blocker?.isBlocked || 
        prioMap.get(d.priorityId)?.level === 5 ||
        (new Date(d.dueDate) < now && statusMap.get(d.statusId)?.category !== 'completed')
      ).slice(0, 10);

      let currentRowIndex = 9;
      if (attentionDemands.length === 0) {
        summarySheet.getCell(`A${currentRowIndex}`).value = 'Nenhuma demanda crítica ou bloqueada no momento. Todas em conformidade.';
        summarySheet.mergeCells(`A${currentRowIndex}:F${currentRowIndex}`);
        summarySheet.getCell(`A${currentRowIndex}`).font = { italic: true, color: { argb: 'FF16A34A' } };
        currentRowIndex++;
      } else {
        attentionDemands.forEach(d => {
          const row = summarySheet.getRow(currentRowIndex);
          const assigneeName = userMap.get(d.assigneeId)?.name || 'N/A';
          const catName = catMap.get(d.categoryId)?.name || 'N/A';
          const dueStr = new Date(d.dueDate).toLocaleDateString('pt-BR');
          let sit = d.blocker?.isBlocked ? `⚠️ BLOQUEADA: ${d.blocker.reason || 'Sem motivo registrado'}` : `Prioridade ${prioMap.get(d.priorityId)?.name || ''} - Progresso ${d.progressPercent}%`;

          row.values = [d.code, d.title, catName, assigneeName, dueStr, sit];
          row.font = { name: 'Arial', size: 9 };
          row.eachCell(cell => {
            cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
          });
          currentRowIndex++;
        });
      }

      // Column widths
      summarySheet.getColumn('A').width = 18;
      summarySheet.getColumn('B').width = 40;
      summarySheet.getColumn('C').width = 16;
      summarySheet.getColumn('D').width = 22;
      summarySheet.getColumn('E').width = 16;
      summarySheet.getColumn('F').width = 45;
    }

    // ----------------------------------------------------
    // TAB 2: DEMANDAS DETALHADAS (Full Structured Table)
    // ----------------------------------------------------
    const dataSheet = workbook.addWorksheet('Demandas Detalhadas', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
    });

    const activeCols = ALL_COLUMNS.filter(c => selectedColumns.includes(c.key));
    dataSheet.columns = activeCols.map(c => ({
      header: c.label,
      key: c.key,
      width: c.key === 'title' || c.key === 'whyReason' || c.key === 'howExecutionGuide' ? 38 : c.key === 'description' ? 45 : 18
    }));

    // Header styling
    const headerRow = dataSheet.getRow(1);
    headerRow.height = 28;
    headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' } // Blue 900
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    // Populate rows
    demands.forEach((d, idx) => {
      const assignee = userMap.get(d.assigneeId)?.name || 'Não atribuído';
      const requester = userMap.get(d.requesterId)?.name || 'Não informado';
      const team = teamMap.get(d.teamId)?.name || 'Geral';
      const category = catMap.get(d.categoryId)?.name || d.categoryId;
      const status = statusMap.get(d.statusId)?.name || d.statusId;
      const priority = prioMap.get(d.priorityId)?.name || d.priorityId;

      const completedChecklist = d.checklist.filter(c => c.completed).length;
      const totalChecklist = d.checklist.length;
      const checklistStr = totalChecklist > 0 ? `${completedChecklist}/${totalChecklist}` : 'N/A';

      const rowValues: Record<string, any> = {
        code: d.code,
        title: d.title,
        category: category,
        status: status,
        priority: priority,
        team: team,
        assignee: assignee,
        requester: requester,
        progress: d.progressPercent / 100, // as decimal for Excel percentage formatting
        dueDate: d.dueDate ? new Date(d.dueDate) : '',
        plannedStartDate: d.plannedStartDate ? new Date(d.plannedStartDate) : '',
        completedAt: d.completedAt ? new Date(d.completedAt) : '',
        whyReason: d.whyReason || '',
        whereLocation: d.whereLocation || '',
        howExecutionGuide: d.howExecutionGuide || '',
        expectedOutcome: d.expectedOutcome || '',
        isBlocked: d.blocker?.isBlocked ? 'SIM' : 'NÃO',
        blockerReason: d.blocker?.reason || '',
        blockerAction: d.blocker?.actionNeeded || '',
        tags: (d.tags || []).join(', '),
        checklistsSummary: checklistStr,
        extensionsCount: d.deadlineExtensions?.length || 0,
        createdAt: d.createdAt ? new Date(d.createdAt) : ''
      };

      const row = dataSheet.addRow(rowValues);
      row.height = 22;
      row.font = { name: 'Arial', size: 9 };

      // Alternating row background
      if (idx % 2 === 1) {
        row.eachCell({ includeEmpty: true }, cell => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        });
      }

      // Format progress as percentage
      const progressCell = row.getCell('progress');
      if (progressCell) {
        progressCell.numFmt = '0%';
        progressCell.alignment = { horizontal: 'center' };
      }

      // Format date cells
      ['dueDate', 'plannedStartDate', 'completedAt', 'createdAt'].forEach(key => {
        const dateCell = row.getCell(key);
        if (dateCell && dateCell.value) {
          dateCell.numFmt = 'dd/mm/yyyy';
          dateCell.alignment = { horizontal: 'center' };
        }
      });

      // Highlight blocked in soft red
      if (d.blocker?.isBlocked) {
        const blockedCell = row.getCell('isBlocked');
        if (blockedCell) {
          blockedCell.font = { bold: true, color: { argb: 'FFDC2626' } };
        }
      }
    });

    // Write file to browser download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Captures any element (e.g. Demand Report, Kanban Board or Dashboard) and downloads high-res PNG
   */
  exportToPng: async (elementId: string, fileName: string): Promise<void> => {
    const node = document.getElementById(elementId);
    if (!node) {
      throw new Error(`Element with id "${elementId}" not found for PNG export.`);
    }

    try {
      const dataUrl = await toPng(node, {
        quality: 0.98,
        pixelRatio: 2, // High resolution for executive presentations
        backgroundColor: '#f8fafc',
        width: node.scrollWidth || undefined,
        height: node.scrollHeight || undefined,
        style: {
          overflow: 'visible',
          maxWidth: 'none',
          maxHeight: 'none',
          boxSizing: 'border-box'
        },
        filter: (childNode) => {
          // exclude temporary tooltips or non-exportable buttons if marked
          if (childNode instanceof HTMLElement && childNode.classList.contains('no-export')) {
            return false;
          }
          return true;
        }
      });

      const link = document.createElement('a');
      link.download = `${fileName.replace(/\.png$/i, '')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating PNG export:', err);
      throw err;
    }
  }
};
