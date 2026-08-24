import React from 'react';
import { Calendar, Clock, Hourglass, ArrowRight } from 'lucide-react';
import { CycleInfo } from '../types';
import { formatKoreanDate, formatShortDate } from '../utils/formatters';

interface CycleProgressCardProps {
  cycleInfo: CycleInfo;
}

export const CycleProgressCard: React.FC<CycleProgressCardProps> = ({ cycleInfo }) => {
  const {
    currentDate,
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
  // 남은 퍼센티지에 맞춘 strokeDashoffset
  const strokeDashoffset = circumference - (timeRemainingPercent / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
      {/* 헤더 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">급여 주기 및 남은 기간</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            {daysRemaining === 0 ? '오늘 급여일 🎉' : `D-${daysRemaining}`}
          </span>
        </div>

        {/* 현재 기준일 배너 */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4 flex items-center justify-between text-xs text-slate-600 border border-slate-200/60">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600" />
            현재일: {formatKoreanDate(currentDate)}
          </span>
          <span className="text-slate-400">총 {totalDays}일 주기</span>
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
              {/* 진행 원 (남은 기간 강조 - 블루/인디고) */}
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
              <span className="text-[11px] font-semibold text-blue-600">남은 기간</span>
            </div>
          </div>

          {/* 세부 수치 설명 */}
          <div className="flex-1 w-full space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 text-blue-500" />
                다음 15일까지 남은 일수
              </span>
              <span className="font-bold text-slate-900 text-sm">{daysRemaining}일</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                이번 주기 경과한 일수
              </span>
              <span className="font-semibold text-slate-700">{daysPassed}일 경과 ({timePassedPercent}%)</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">주기 총 기간</span>
              <span className="font-semibold text-slate-700">{totalDays}일</span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 주기 타임라인 시각화 바 */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
          <span className="flex items-center gap-1">
            시작 {formatShortDate(startDate)}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <span className="text-blue-700 font-bold">
            다음 급여 {formatShortDate(endDate)}
          </span>
        </div>

        {/* 선형 진행 바 */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/60">
          <div
            className="h-full bg-slate-300 rounded-l-full transition-all duration-500"
            style={{ width: `${timePassedPercent}%` }}
            title={`경과 ${timePassedPercent}%`}
          />
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-r-full transition-all duration-500"
            style={{ width: `${timeRemainingPercent}%` }}
            title={`남은 기간 ${timeRemainingPercent}%`}
          />
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
          <span>지난 시간 ({timePassedPercent}%)</span>
          <span className="text-blue-600 font-medium">남은 시간 ({timeRemainingPercent}%)</span>
        </div>
      </div>
    </div>
  );
};
