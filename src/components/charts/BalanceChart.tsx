import React, { useState } from 'react';
import { LedgerEntry } from '../../types';
import { formatCurrency, formatShortDate } from '../../lib/utils';

interface BalanceChartProps {
  ledger: LedgerEntry[];
  height?: number;
}

export const BalanceChart: React.FC<BalanceChartProps> = ({ ledger, height = 240 }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    date: string;
    balance: number;
    label: string;
  } | null>(null);

  // Chronological order (oldest to newest)
  const chronological = [...ledger].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (chronological.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">
        No transaction history recorded yet.
      </div>
    );
  }

  // Ensure initial baseline point if only 1 entry
  const dataPoints = chronological.map(item => ({
    date: item.timestamp,
    balance: item.runningBalance,
    label: item.purposeOrSource
  }));

  const balances = dataPoints.map(d => d.balance);
  const minBalance = Math.min(0, ...balances);
  const maxBalance = Math.max(...balances, 1000);
  const range = maxBalance - minBalance || 1;

  const width = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (dataPoints.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (dataPoints.length - 1)) * chartWidth;
  };

  const getY = (balance: number) => {
    return padding.top + chartHeight - ((balance - minBalance) / range) * chartHeight;
  };

  const points = dataPoints.map((d, i) => `${getX(i)},${getY(d.balance)}`).join(' ');
  const areaPoints = `${getX(0)},${padding.top + chartHeight} ${points} ${getX(dataPoints.length - 1)},${padding.top + chartHeight}`;

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((fraction, i) => {
          const yVal = padding.top + chartHeight * (1 - fraction);
          const balanceVal = minBalance + range * fraction;
          return (
            <g key={i} className="text-neutral-300 dark:text-neutral-800">
              <line
                x1={padding.left}
                y1={yVal}
                x2={width - padding.right}
                y2={yVal}
                stroke="currentColor"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padding.left - 6}
                y={yVal + 3}
                textAnchor="end"
                className="text-[9px] fill-neutral-400 dark:fill-neutral-500 font-sans"
              >
                {formatCurrency(balanceVal)}
              </text>
            </g>
          );
        })}

        {/* Filled Area */}
        <polygon points={areaPoints} fill="url(#balanceGradient)" />

        {/* Crisp Stroke Line */}
        <polyline
          fill="none"
          stroke="#059669"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Interactive Data Dots */}
        {dataPoints.map((d, idx) => {
          const cx = getX(idx);
          const cy = getY(d.balance);
          return (
            <g key={idx}>
              <circle
                cx={cx}
                cy={cy}
                r="4"
                className="fill-white dark:fill-[#121215] stroke-emerald-600 stroke-[2] transition-all hover:r-6 cursor-pointer"
                onMouseEnter={() => setHoveredPoint({ x: cx, y: cy, date: d.date, balance: d.balance, label: d.label })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs px-3 py-1.5 rounded-lg shadow-lg border border-neutral-800 dark:border-neutral-200"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`
          }}
        >
          <div className="font-semibold">{formatCurrency(hoveredPoint.balance)}</div>
          <div className="text-[10px] text-neutral-300 dark:text-neutral-600 truncate max-w-[180px]">
            {formatShortDate(hoveredPoint.date)}
          </div>
        </div>
      )}

      {/* Timeline Footnote */}
      <div className="flex justify-between items-center text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 px-1">
        <span>{formatShortDate(dataPoints[0].date)}</span>
        <span className="font-medium text-emerald-600 dark:text-emerald-400">Available Reserves: {formatCurrency(dataPoints[dataPoints.length - 1].balance)}</span>
        <span>{formatShortDate(dataPoints[dataPoints.length - 1].date)}</span>
      </div>
    </div>
  );
};
