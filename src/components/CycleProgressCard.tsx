import React from 'react';
import { Calendar, Clock, Hourglass } from 'lucide-react';
import { CycleInfo } from '../types';
import { formatKoreanDate, formatShortDate } from '../utils/formatters';

interface CycleProgressCardProps {
  cycleInfo: CycleInfo;
}

export const CycleProgressCard: React.FC<CycleProgressCardProps> = ({ cycleInfo }) => {
  const {
    currentDate,
    paydayDay,
    startDate,
    endDate,
    totalDays,
    daysPassed,
    daysRemaining,
    timeRemainingPercent,
    timePassedPercent,
  } = cycleInfo;

  // SVG Circular progress calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  // 남은 시간 게이지 (또는 경과 게이지)
  const strokeDashoffset = circumference - (timeRemainingPercent / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
      {/* 상단 헤더 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">월급 주기 (시간 경과)</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            {daysRemaining === 0 ? '월급날 당일!' : `월급날까지 D-${daysRemaining}`}
          </span>
        </div>

        {/* 주기 정보 */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4 flex items-center justify-between text-xs text-slate-600 border border-slate-200/60">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600" />
            기준일: {formatKoreanDate(currentDate)}
          </span>
          <span className="text-slate-400">이번 주기 총 {totalDays}일 ({paydayDay}일 기준)</span>
        </div>

        {/* 원형 차트 & 통계 */}
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
              {/* 진행 원 (남은 시간) */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-blue-600 transition-all duration-700 ease-out"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {timeRemainingPercent}%
              </span>
              <span className="text-[11px] font-semibold text-blue-600">시간 남음</span>
            </div>
          </div>

          {/* 일수 세부 통계 */}
          <div className="flex-1 w-full space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 text-blue-500" />
                다음 월급 ({paydayDay}일)
              </span>
              <span className="font-bold text-slate-900 text-sm">{daysRemaining}일 남음</span>
            </div>
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                주기 시작 후 경과
              </span>
              <span className="font-semibold text-slate-700">{daysPassed}일 지남</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-slate-500">시간 경과율</span>
              <span className="font-semibold text-slate-600">{timePassedPercent}%</span>
            </div>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
            <span>시작일: {formatShortDate(startDate)}</span>
            <span>종료일: {formatShortDate(endDate)}</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${timePassedPercent}%` }}
              title={`시간 경과율: ${timePassedPercent}%`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
