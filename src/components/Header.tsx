import React from 'react';
import { Calendar, Wallet, Settings, Sparkles } from 'lucide-react';
import { formatKoreanDate } from '../utils/formatters';

interface HeaderProps {
  currentDate: Date;
  paydayDay: number;
  onOpenPaydayModal: () => void;
  onOpenDateModal: () => void;
  isCustomDate: boolean;
  onResetDate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  paydayDay,
  onOpenPaydayModal,
  onOpenDateModal,
  isCustomDate,
  onResetDate,
}) => {
  return (
    <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">생활비 가계부 & 잔액 관리기</h1>
              <button
                type="button"
                onClick={onOpenPaydayModal}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
                title="급여일(기준일) 변경"
              >
                <span>매달 {paydayDay}일 주기</span>
                <Settings className="w-3 h-3 text-indigo-500" />
              </button>
            </div>
            <p className="text-xs text-slate-500">급여일 기준 남은 일수 계산 · AI 지출 카테고리화 · 잔액 자동 연동</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* 급여일 변경 버튼 */}
          <button
            type="button"
            onClick={onOpenPaydayModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>급여일 {paydayDay}일</span>
          </button>

          {/* 기준 날짜 변경 버튼 */}
          <button
            onClick={onOpenDateModal}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              isCustomDate
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="기준 날짜 변경 및 시뮬레이션"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatKoreanDate(currentDate)}</span>
            {isCustomDate && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                테스트
              </span>
            )}
          </button>

          {isCustomDate && (
            <button
              onClick={onResetDate}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 underline underline-offset-2"
            >
              오늘로
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
