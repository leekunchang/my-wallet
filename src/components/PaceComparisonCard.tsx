import React from 'react';
import { Compass, Sparkles, AlertCircle, CheckCircle, Flame, DollarSign, CalendarDays } from 'lucide-react';
import { CycleInfo, FinancialMetrics } from '../types';
import { formatCurrency, formatCurrencyShort } from '../utils/formatters';

interface PaceComparisonCardProps {
  cycleInfo: CycleInfo;
  metrics: FinancialMetrics;
}

export const PaceComparisonCard: React.FC<PaceComparisonCardProps> = ({
  cycleInfo,
  metrics,
}) => {
  const { timeRemainingPercent, daysRemaining, daysPassed, paydayDay } = cycleInfo;
  const {
    balancePercent,
    currentBalance,
    dailyAllowance,
    dailyAverageSpent,
    paceStatus,
    paceDifference,
  } = metrics;

  // 페이스 분석 메시지 및 디자인
  const getPaceDetails = () => {
    switch (paceStatus) {
      case 'depleted':
        return {
          title: '생활비가 모두 소진되었습니다',
          desc: `다음 급여일(${paydayDay}일)까지 ${daysRemaining}일 남았습니다. 추가 지출을 점검해보세요.`,
          badge: '소진 완료',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
          boxClass: 'border-rose-200 bg-rose-50/50',
          icon: AlertCircle,
          iconColor: 'text-rose-600',
        };
      case 'safe':
        return {
          title: '매우 여유로운 지출 페이스입니다',
          desc: `남은 기간(${timeRemainingPercent}%) 대비 잔여 예산(${balancePercent}%)이 +${paceDifference}%p 더 여유롭습니다.`,
          badge: '아주 여유로움',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          boxClass: 'border-emerald-200 bg-emerald-50/50',
          icon: Sparkles,
          iconColor: 'text-emerald-600',
        };
      case 'normal':
        return {
          title: '적정 수준의 지출 페이스입니다',
          desc: `남은 기간(${timeRemainingPercent}%)과 남은 예산(${balancePercent}%)의 비율이 적절하게 균형을 이루고 있습니다.`,
          badge: '안정적',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          boxClass: 'border-blue-200 bg-blue-50/50',
          icon: CheckCircle,
          iconColor: 'text-blue-600',
        };
      case 'warning':
        return {
          title: '지출 속도가 조금 빠릅니다',
          desc: `남은 기간은 ${timeRemainingPercent}% 남았으나 잔액은 ${balancePercent}%로 ${Math.abs(paceDifference)}%p 빠르게 소진 중입니다.`,
          badge: '주의 필요',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          boxClass: 'border-amber-200 bg-amber-50/50',
          icon: Flame,
          iconColor: 'text-amber-600',
        };
      case 'critical':
      default:
        return {
          title: '예산 조기 소진 위험이 있습니다',
          desc: `남은 기간(${timeRemainingPercent}%)에 비해 잔액(${balancePercent}%)이 크게 부족합니다. 일일 지출 한도를 조절해보세요.`,
          badge: '위험 경고',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
          boxClass: 'border-rose-200 bg-rose-50/50',
          icon: AlertCircle,
          iconColor: 'text-rose-600',
        };
    }
  };

  const paceInfo = getPaceDetails();
  const PaceIcon = paceInfo.icon;

  return (
    <div className={`rounded-2xl p-5 sm:p-6 border ${paceInfo.boxClass} shadow-xs transition-all`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl bg-white shadow-xs border border-slate-200/60 ${paceInfo.iconColor}`}>
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">기간 대비 지출 페이스 분석</h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${paceInfo.badgeClass}`}>
                {paceInfo.badge}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">{paceInfo.desc}</p>
          </div>
        </div>
      </div>

      {/* 스마트 가이드 카드 2개 (하루 권장 생활비 vs 지난 하루 평균 소비) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/60">
        <div className="bg-white/90 rounded-xl p-3.5 border border-slate-200/80 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              남은 일수({daysRemaining}일) 하루 권장 사용액
            </span>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {formatCurrency(dailyAllowance)}
              <span className="text-xs font-normal text-slate-400 ml-1">/ 일</span>
            </div>
          </div>
        </div>

        <div className="bg-white/90 rounded-xl p-3.5 border border-slate-200/80 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
              지난 일수({daysPassed}일) 하루 평균 소비액
            </span>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {formatCurrency(dailyAverageSpent)}
              <span className="text-xs font-normal text-slate-400 ml-1">/ 일</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
