import React from 'react';
import { Wallet, TrendingDown, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { FinancialMetrics } from '../types';
import { formatCurrency, formatCurrencyShort } from '../utils/formatters';

interface BalanceProgressCardProps {
  metrics: FinancialMetrics;
}

export const BalanceProgressCard: React.FC<BalanceProgressCardProps> = ({ metrics }) => {
  const {
    depositAmount,
    currentBalance,
    usedAmount,
    balancePercent,
    usedPercent,
  } = metrics;

  // 색상 결정 로직 (잔여율 기준)
  let statusColor = {
    ring: 'stroke-emerald-500',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    bar: 'bg-emerald-500',
    label: '안전한 잔액',
    icon: CheckCircle2,
  };

  if (balancePercent <= 0) {
    statusColor = {
      ring: 'stroke-rose-600',
      text: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      bar: 'bg-rose-600',
      label: '예산 모두 소진',
      icon: XCircle,
    };
  } else if (balancePercent < 20) {
    statusColor = {
      ring: 'stroke-rose-500',
      text: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      bar: 'bg-rose-500',
      label: '잔액 주의 (20% 미만)',
      icon: AlertTriangle,
    };
  } else if (balancePercent < 45) {
    statusColor = {
      ring: 'stroke-amber-500',
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      bar: 'bg-amber-500',
      label: '보통 잔액',
      icon: TrendingDown,
    };
  }

  // SVG Circular progress calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (balancePercent / 100) * circumference;

  const StatusIcon = statusColor.icon;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
      {/* 헤더 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">입금액 대비 잔여 생활비</h3>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusColor.label}
          </span>
        </div>

        {/* 입금액 & 현재 잔액 요약 배너 */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4 flex items-center justify-between text-xs text-slate-600 border border-slate-200/60">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <Wallet className="w-4 h-4 text-emerald-600" />
            입금 총액: {formatCurrency(depositAmount)}
          </span>
          <span className="font-bold text-emerald-700">
            잔액 {formatCurrency(currentBalance)}
          </span>
        </div>

        {/* 원형 시각화 게이지 & 수치 */}
        <div className="flex flex-col sm:flex-row items-center gap-5 my-2">
          {/* SVG Ring Meter */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-32 h-32 transform -rotate-90">
              {/* 배경 원 */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              {/* 진행 원 (잔여율) */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className={`${statusColor.ring} transition-all duration-700 ease-out`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {balancePercent}%
              </span>
              <span className={`text-[11px] font-semibold ${statusColor.text}`}>현재 잔여율</span>
            </div>
          </div>

          {/* 세부 수치 설명 */}
          <div className="flex-1 w-full space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
              <span className="text-slate-500">현재 남은 잔액</span>
              <div className="text-right">
                <span className="font-bold text-slate-900 text-sm">{formatCurrency(currentBalance)}</span>
                <span className="text-slate-400 text-[11px] ml-1">({balancePercent}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
              <span className="text-slate-500">지금까지 사용한 금액</span>
              <div className="text-right">
                <span className="font-semibold text-slate-700">{formatCurrency(usedAmount)}</span>
                <span className="text-slate-400 text-[11px] ml-1">({usedPercent}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">입금액 (전체 예산)</span>
              <span className="font-semibold text-slate-700">{formatCurrency(depositAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 잔액/사용액 분할 바 */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
          <span>사용 {formatCurrencyShort(usedAmount)} ({usedPercent}%)</span>
          <span className="text-emerald-700 font-bold">
            잔액 {formatCurrencyShort(currentBalance)} ({balancePercent}%)
          </span>
        </div>

        {/* 선형 듀얼 분할 바 */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/60">
          <div
            className="h-full bg-slate-300 rounded-l-full transition-all duration-500"
            style={{ width: `${usedPercent}%` }}
            title={`사용 ${usedPercent}%`}
          />
          <div
            className={`h-full ${statusColor.bar} rounded-r-full transition-all duration-500`}
            style={{ width: `${balancePercent}%` }}
            title={`잔액 ${balancePercent}%`}
          />
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
          <span>사용한 예산 비율</span>
          <span className="text-emerald-600 font-medium">남은 예산 비율</span>
        </div>
      </div>
    </div>
  );
};
