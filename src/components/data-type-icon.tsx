import { DataType } from '@/types';
import { Baseline, CalendarDays, CircleDollarSign, Hash } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { FC } from 'react';

export const DataTypeIcon: FC<{ type: DataType } & LucideProps> = ({ type, ...props }) => {
  switch (type) {
    case 'date':
      return <CalendarDays {...props} />;
    case 'currency':
      return <CircleDollarSign {...props} />;
    case 'number':
      return <Hash {...props} />;
    case 'text':
      return <Baseline {...props} />;
    default:
      return null;
  }
};
