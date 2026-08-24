import React from 'react';
import { Calendar, Wallet, Sparkles } from 'lucide-react';
import { formatKoreanDate } from '../utils/formatters';

interface HeaderProps {
  currentDate: Date;
  onOpenDateModal: () => void;
  isCustomDate: boolean;
  onResetDate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onOpenDateModal,
  isCustomDate,
  onResetDate,
}) => {
  return (
    <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">15일 생활비 매니저</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100/80">
                매달 15일 주기
              </span>
            </div>
            <p className="text-xs text-slate-500">급여일 기준 생활비 잔액 및 남은 일수 시각화</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
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
                테스트중
              </span>
            )}
          </button>

          {isCustomDate && (
            <button
              onClick={onResetDate}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 underline underline-offset-2"
            >
              오늘로 복귀
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
