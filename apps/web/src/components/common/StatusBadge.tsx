import React from 'react';
import { MailStatus, MailCategory } from '@postmate/shared';

export const StatusBadge: React.FC<{ status: MailStatus | string }> = ({ status }) => {
  let color = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case MailStatus.RECEIVED:
      color = 'bg-sky-50 text-sky-700 border-sky-200';
      break;
    case MailStatus.SCANNED:
      color = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case MailStatus.SORTED:
      color = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case MailStatus.ASSIGNED:
    case MailStatus.OUT_FOR_DELIVERY:
      color = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      break;
    case MailStatus.DELIVERED:
      color = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
      break;
    case MailStatus.EXCEPTION:
      color = 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
      break;
    case MailStatus.DISPATCHED:
      color = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${color}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: MailCategory | string }> = ({ category }) => {
  let badgeStyle = 'bg-slate-100 text-slate-800';

  if (category === MailCategory.SPEED_POST) {
    badgeStyle = 'bg-red-100 text-red-800 font-medium';
  } else if (category === MailCategory.REGISTERED_POST) {
    badgeStyle = 'bg-blue-100 text-blue-800 font-medium';
  } else if (category === MailCategory.PARCEL) {
    badgeStyle = 'bg-amber-100 text-amber-900 font-medium';
  } else if (category === MailCategory.MONEY_ORDER) {
    badgeStyle = 'bg-emerald-100 text-emerald-800 font-medium';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${badgeStyle}`}>
      {category.replace(/_/g, ' ')}
    </span>
  );
};
