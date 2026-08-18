/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Layers,
  Smartphone,
  Repeat,
  Clock,
  AlertTriangle,
  Calendar,
  Code2,
  Activity,
  Plus,
  ArrowRight,
  Database
} from 'lucide-react';
import { ActiveView } from '../../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({ isOpen, onClose }) => {
  const {
    demands,
    setActiveView,
    setSelectedDemand,
    setIsNewDemandModalOpen,
    createBackupPoint
  } = useApp();

  const [search, setSearch] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    setSearch('');
    setSelectedIndex(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const views: { id: ActiveView; label: string; icon: any; category: string }[] = [
    { id: 'dashboard', label: 'Dashboard & Indicadores', icon: Layers, category: 'Visões' },
    { id: 'kanban', label: 'Quadro Kanban', icon: Layers, category: 'Visões' },
    { id: 'list', label: 'Lista de Demandas', icon: Layers, category: 'Visões' },
    { id: 'gantt', label: 'Cronograma Gantt', icon: Layers, category: 'Visões' },
    { id: 'android', label: 'Aplicativo Android & APK', icon: Smartphone, category: 'Módulos' },
    { id: 'templates', label: 'Modelos & Recorrências', icon: Repeat, category: 'Módulos' },
    { id: 'sla', label: 'Gestão de SLA & Horário Útil', icon: Clock, category: 'Módulos' },
    { id: 'risks', label: 'Gestão de Riscos & Matriz 5x5', icon: AlertTriangle, category: 'Módulos' },
    { id: 'reports', label: 'Relatórios Programados', icon: Calendar, category: 'Módulos' },
    { id: 'api_webhooks', label: 'API REST & Webhooks', icon: Code2, category: 'Módulos' },
    { id: 'system_health', label: 'Saúde & Backup Enterprise', icon: Activity, category: 'Módulos' }
  ];

  const matchedViews = views.filter((v) =>
    v.label.toLowerCase().includes(search.toLowerCase())
  );

  const matchedDemands = demands
    .filter(
      (d) =>
        d.code.toLowerCase().includes(search.toLowerCase()) ||
        d.title.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 5);

  const allItems = [
    ...matchedViews.map((v) => ({
      type: 'view',
      item: v,
      label: v.label,
      sublabel: v.category,
      icon: v.icon,
      action: () => {
        setActiveView(v.id);
        onClose();
      }
    })),
    ...matchedDemands.map((d) => ({
      type: 'demand',
      item: d,
      label: `[${d.code}] ${d.title}`,
      sublabel: 'Demanda Operacional',
      icon: Layers,
      action: () => {
        setSelectedDemand(d);
        onClose();
      }
    }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-700 gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Digite para buscar demandas, telas ou ações (Ex: Android, SLA, DEM-01)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded text-[10px] font-mono font-bold">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhum resultado encontrado para "{search}"
            </div>
          ) : (
            allItems.map((entry, idx) => {
              const Icon = entry.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={idx}
                  onClick={entry.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-semibold block truncate">{entry.label}</span>
                      <span className="text-[10px] text-slate-400 block">{entry.sublabel}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Navegue com ↑ ↓ e pressione Enter</span>
          <span className="font-mono">Atalho global: Ctrl+K</span>
        </div>
      </div>
    </div>
  );
};
