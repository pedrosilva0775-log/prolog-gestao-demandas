/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Demand } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { parseLocalCalendarDate } from '../../utils/date';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  ShieldAlert,
  Plus
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const { filteredDemands, setSelectedDemand, setIsCreateModalOpen, categories, statuses } = useApp();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (7 is August)

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDemandsForDay = (day: number) => {
    return filteredDemands.filter(d => {
      const due = parseLocalCalendarDate(d.dueDate);
      return due.getFullYear() === year && due.getMonth() === month && due.getDate() === day;
    });
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {monthNames[month]} de {year}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Hoje
          </button>
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Day of week labels */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center py-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>

        {/* Days grid */}
        <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`${year}-${month}`} initial={reduceMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -12 }} transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }} className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {blankDays.map((_, i) => (
            <div key={`blank-${i}`} className="min-h-[110px] bg-slate-50/50 dark:bg-slate-950/20 p-2" />
          ))}

          {daysArray.map((day) => {
            const dayDemands = getDemandsForDay(day);
            const today = new Date();
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

            return (
              <div
                key={`day-${day}`}
                className={`min-h-[110px] p-2 flex flex-col justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                  isToday ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {day}
                  </span>
                  {dayDemands.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400">
                      {dayDemands.length} {dayDemands.length === 1 ? 'prazo' : 'prazos'}
                    </span>
                  )}
                </div>

                {/* Day demand pills */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                  {dayDemands.map((demand) => {
                    const category = categories.find(c => c.id === demand.categoryId);
                    const status = statuses.find(s => s.id === demand.statusId);
                    const isCompleted = status?.category === 'completed';

                    return (
                      <div
                        key={demand.id}
                        onClick={() => setSelectedDemand(demand)}
                        className={`p-1 rounded text-[10px] font-semibold truncate cursor-pointer transition-all border flex items-center space-x-1 ${
                          demand.blocker?.isBlocked
                            ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-800'
                        }`}
                        title={`[${demand.code}] ${demand.title}`}
                      >
                        {category && <IconRenderer name={category.iconName} className="w-3 h-3 shrink-0" />}
                        <span className="truncate">{demand.code}: {demand.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
