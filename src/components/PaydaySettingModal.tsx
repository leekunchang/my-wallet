import React, { useState } from 'react';
import { X, Calendar, Check, AlertCircle } from 'lucide-react';

interface PaydaySettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPayday: number;
  onSavePayday: (day: number) => void;
}

export const PaydaySettingModal: React.FC<PaydaySettingModalProps> = ({
  isOpen,
  onClose,
  currentPayday,
  onSavePayday,
}) => {
  if (!isOpen) return null;

  const [selectedDay, setSelectedDay] = useState(currentPayday);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePayday(selectedDay);
    onClose();
  };

  const commonPaydays = [1, 5, 10, 15, 20, 25, 31];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">월급일(정산 주기) 설정</h3>
              <p className="text-xs text-slate-500">예산 주기의 시작과 끝 기준이 됩니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* 자주 쓰는 월급날 프리셋 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              주요 월급일 빠른 선택
            </label>
            <div className="grid grid-cols-4 gap-2">
              {commonPaydays.map((day) => (
                <button
                  type="button"
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    selectedDay === day
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {day === 31 ? '말일 (31일)' : `매월 ${day}일`}
                </button>
              ))}
            </div>
          </div>

          {/* 슬라이더로 직접 선택 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="payday-slider" className="text-xs font-semibold text-slate-700">
                1일 ~ 31일 직접 조절
              </label>
              <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                매월 {selectedDay}일
              </span>
            </div>
            <input
              id="payday-slider"
              type="range"
              min={1}
              max={31}
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1일</span>
              <span>10일</span>
              <span>15일</span>
              <span>20일</span>
              <span>25일</span>
              <span>31일(말일)</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-xs text-blue-800">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              예산 주기가 <strong>매월 {selectedDay}일</strong>부터 다음 달 {selectedDay}일 직전까지로 자동 재계산됩니다.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" /> 저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
