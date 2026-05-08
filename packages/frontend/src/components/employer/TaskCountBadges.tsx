'use client';

interface TaskCountBadgesProps {
  open: number;
  assigned: number;
  submitted: number;
  paid: number;
}

export function TaskCountBadges({ open, assigned, submitted, paid }: TaskCountBadgesProps) {
  const items = [
    { label: 'Open', count: open, color: 'text-blue-400' },
    { label: 'Assigned', count: assigned, color: 'text-yellow-400' },
    { label: 'Submitted', count: submitted, color: 'text-purple-400' },
    { label: 'Paid', count: paid, color: 'text-emerald-400' },
  ];
  return (
    <div className="flex gap-3 flex-wrap">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1">
          <span className={`text-xs font-mono font-bold ${item.color}`}>{item.count}</span>
          <span className="text-xs text-slate-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
