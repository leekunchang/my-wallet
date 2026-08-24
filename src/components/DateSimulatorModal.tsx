import React, { useState } from 'react';
import { X, Calendar, RotateCcw, Check } from 'lucide-react';
import { formatKoreanDate } from '../utils/formatters';

interface DateSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  onResetToToday: () => void;
}

export const DateSimulatorModal: React.FC<DateSimulatorModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  onSelectDate,
  onResetToToday,
}) => {
  if (!isOpen) return null;

  const today = new Date();

  // Format to YYYY-MM-DD for standard date picker
  const formatDateForInput = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [inputVal, setInputVal] = useState(formatDateForInput(currentDate));

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal) return;
    const [y, m, d] = inputVal.split('-').map(Number);
    const newDate = new Date(y, m - 1, d, 12, 0, 0);
    onSelectDate(newDate);
    onClose();
  };

  const handleQuickSelect = (offsetDays: number | 'payday' | 'beforePayday') => {
    const now = new Date();
    if (offsetDays === 'payday') {
      // 15일
      const d = new Date(now.getFullYear(), now.getMonth(), 15, 12, 0, 0);
      onSelectDate(d);
    } else if (offsetDays === 'beforePayday') {
      // 14일 (월급 하루 전)
      const d = new Date(now.getFullYear(), now.getMonth(), 14, 12, 0, 0);
      onSelectDate(d);
    } else {
      const d = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
      onSelectDate(d);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">기준 날짜 시뮬레이터</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 mb-4">
          과거 또는 미래 날짜로 기준일을 변경하여 주기별 예산 소진 속도와 D-Day 변화를 미리 테스트해볼 수 있습니다.
        </p>

        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              기준일 직접 선택
            </label>
            <input
              type="date"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              빠른 날짜 이동
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect('payday')}
                className="text-xs px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-left border border-indigo-100 cursor-pointer"
              >
                🎉 이번달 월급날 (15일)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('beforePayday')}
                className="text-xs px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-left border border-slate-200 cursor-pointer"
              >
                ⏳ 월급 전날 (14일)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
            <button
              type="button"
              onClick={() => {
                onResetToToday();
                onClose();
              }}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 오늘로 복귀 ({formatKoreanDate(today)})
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> 적용하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
