/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Crown,
  BookOpen,
  Cog,
  Sparkles,
  Search,
  Calendar,
  PlayCircle,
  Clock,
  AlertOctagon,
  CheckSquare,
  CheckCircle2,
  XCircle,
  Flame,
  Zap,
  ArrowUpCircle,
  MinusCircle,
  ArrowDownCircle,
  Layers,
  Briefcase,
  LucideProps
} from 'lucide-react';

interface IconRendererProps extends LucideProps {
  name: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Crown':
      return <Crown {...props} />;
    case 'BookOpen':
      return <BookOpen {...props} />;
    case 'Cog':
      return <Cog {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'Search':
      return <Search {...props} />;
    case 'Calendar':
      return <Calendar {...props} />;
    case 'PlayCircle':
      return <PlayCircle {...props} />;
    case 'Clock':
      return <Clock {...props} />;
    case 'AlertOctagon':
      return <AlertOctagon {...props} />;
    case 'CheckSquare':
      return <CheckSquare {...props} />;
    case 'CheckCircle2':
      return <CheckCircle2 {...props} />;
    case 'XCircle':
      return <XCircle {...props} />;
    case 'Flame':
      return <Flame {...props} />;
    case 'Zap':
      return <Zap {...props} />;
    case 'ArrowUpCircle':
      return <ArrowUpCircle {...props} />;
    case 'MinusCircle':
      return <MinusCircle {...props} />;
    case 'ArrowDownCircle':
      return <ArrowDownCircle {...props} />;
    case 'Layers':
      return <Layers {...props} />;
    case 'Briefcase':
      return <Briefcase {...props} />;
    default:
      return <Sparkles {...props} />;
  }
};
