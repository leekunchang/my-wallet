import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, Coins, Plus, Minus, RotateCcw, AlertCircle } from 'lucide-react';
import { formatCurrency, formatCurrencyShort } from '../utils/formatters';

interface BudgetInputCardProps {
  depositAmount: number;
  currentBalance: number;
  onDepositChange: (amount: number) => void;
  onBalanceChange: (amount: number) => void;
}

export const BudgetInputCard: React.FC<BudgetInputCardProps> = ({
  depositAmount,
  currentBalance,
  onDepositChange,
  onBalanceChange,
}) => {
  const [depositStr, setDepositStr] = useState(depositAmount.toString());
  const [balanceStr, setBalanceStr] = useState(currentBalance.toString());

  // 외부 props 변경 동기화
  useEffect(() => {
    setDepositStr(depositAmount ? depositAmount.toLocaleString('ko-KR') : '');
  }, [depositAmount]);

  useEffect(() => {
    setBalanceStr(currentBalance ? currentBalance.toLocaleString('ko-KR') : '');
  }, [currentBalance]);

  const handleDepositInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = rawVal === '' ? 0 : parseInt(rawVal, 10);
    setDepositStr(rawVal === '' ? '' : num.toLocaleString('ko-KR'));
    onDepositChange(num);
  };

  const handleBalanceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = rawVal === '' ? 0 : parseInt(rawVal, 10);
    setBalanceStr(rawVal === '' ? '' : num.toLocaleString('ko-KR'));
    onBalanceChange(num);
  };

  const adjustBalance = (delta: number) => {
    const newBal = Math.max(0, currentBalance + delta);
    onBalanceChange(newBal);
  };

  const setDepositPreset = (amount: number) => {
    onDepositChange(amount);
  };

  const usedAmount = Math.max(0, depositAmount - currentBalance);
  const isOverBudget = currentBalance > depositAmount && depositAmount > 0;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
          <h2 className="text-base font-bold text-slate-800 tracking-tight">예산 및 잔액 설정</h2>
        </div>
        <span className="text-xs text-slate-400">실시간 자동 계산 및 브라우저 저장</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. 예치금(총 예산) 입력 */}
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="deposit-input" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <ArrowDownToLine className="w-4 h-4 text-indigo-600" />
              <span>한 달 예치금 (총 생활비)</span>
            </label>
            {depositAmount > 0 && (
              <span className="text-xs font-medium text-indigo-600">
                {formatCurrencyShort(depositAmount)}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="deposit-input"
              type="text"
              inputMode="numeric"
              value={depositStr}
              onChange={handleDepositInput}
              placeholder="예: 850,000"
              className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg px-3.5 py-2.5 text-right font-bold text-slate-900 text-lg sm:text-xl pr-9 outline-none transition-all placeholder:text-slate-300"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none">
              원
            </span>
          </div>
          {/* 예치금 빠른 선택 칩 */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] text-slate-400 mr-1">빠른 선택:</span>
            {[500000, 850000, 1000000, 1500000, 2000000].map((preset) => (
              <button
                key={preset}
                onClick={() => setDepositPreset(preset)}
                className={`text-xs px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  depositAmount === preset
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {formatCurrencyShort(preset)}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 현재 잔액 입력 */}
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="balance-input" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>현재 통장 잔액 (남은 예산)</span>
            </label>
            {currentBalance > 0 && (
              <span className="text-xs font-medium text-emerald-600">
                {formatCurrencyShort(currentBalance)}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="balance-input"
              type="text"
              inputMode="numeric"
              value={balanceStr}
              onChange={handleBalanceInput}
              placeholder="예: 600,000"
              className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-lg px-3.5 py-2.5 text-right font-bold text-slate-900 text-lg sm:text-xl pr-9 outline-none transition-all placeholder:text-slate-300"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none">
              원
            </span>
          </div>
          {/* 잔액 미세 조정 버튼 */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] text-slate-400 mr-1">잔액 조정:</span>
            <button
              onClick={() => adjustBalance(100000)}
              className="text-xs px-2 py-1 rounded-md font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-emerald-600" /> 10만
            </button>
            <button
              onClick={() => adjustBalance(50000)}
              className="text-xs px-2 py-1 rounded-md font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-emerald-600" /> 5만
            </button>
            <button
              onClick={() => adjustBalance(-10000)}
              className="text-xs px-2 py-1 rounded-md font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 flex items-center gap-0.5 cursor-pointer"
            >
              <Minus className="w-3 h-3 text-rose-500" /> 1만
            </button>
            <button
              onClick={() => adjustBalance(-50000)}
              className="text-xs px-2 py-1 rounded-md font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 flex items-center gap-0.5 cursor-pointer"
            >
              <Minus className="w-3 h-3 text-rose-500" /> 5만
            </button>
            {depositAmount > 0 && currentBalance !== depositAmount && (
              <button
                onClick={() => onBalanceChange(depositAmount)}
                title="예치금과 동일하게 잔액 재설정"
                className="text-xs px-2 py-1 rounded-md font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-0.5 ml-auto cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> 초기화
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 요약 바 */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-500">
            현재까지 사용한 총액: <strong className="text-slate-800 font-semibold">{formatCurrency(usedAmount)}</strong>
          </span>
        </div>
        {isOverBudget && (
          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/70">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>현재 잔액이 설정된 총 예치금보다 큽니다.</span>
          </div>
        )}
      </div>
    </div>
  );
};
