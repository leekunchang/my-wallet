import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { BudgetInputCard } from './components/BudgetInputCard';
import { CycleProgressCard } from './components/CycleProgressCard';
import { BalanceProgressCard } from './components/BalanceProgressCard';
import { PaceComparisonCard } from './components/PaceComparisonCard';
import { DateSimulatorModal } from './components/DateSimulatorModal';
import { calculateCycleInfo, calculateFinancialMetrics } from './utils/dateCalculations';

const STORAGE_KEYS = {
  DEPOSIT: 'budget_deposit_amount',
  BALANCE: 'budget_current_balance',
};

const DEFAULT_DEPOSIT = 850000;
const DEFAULT_BALANCE = 550000;

export default function App() {
  // 1. 초기 입금액 및 잔액 상태 (localStorage 연동)
  const [depositAmount, setDepositAmount] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEPOSIT);
    return saved !== null ? Number(saved) : DEFAULT_DEPOSIT;
  });

  const [currentBalance, setCurrentBalance] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BALANCE);
    return saved !== null ? Number(saved) : DEFAULT_BALANCE;
  });

  // 2. 기준 날짜 상태 (기본: 실제 오늘)
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // 로컬스토리지 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEPOSIT, depositAmount.toString());
  }, [depositAmount]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BALANCE, currentBalance.toString());
  }, [currentBalance]);

  // 현재 유효한 날짜
  const activeDate = useMemo(() => {
    return simulatedDate || new Date();
  }, [simulatedDate]);

  // 3. 주기 및 재정 지표 계산
  const cycleInfo = useMemo(() => {
    return calculateCycleInfo(activeDate, 15);
  }, [activeDate]);

  const financialMetrics = useMemo(() => {
    return calculateFinancialMetrics(depositAmount, currentBalance, cycleInfo);
  }, [depositAmount, currentBalance, cycleInfo]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 상단 네비게이션 / 헤더 */}
      <Header
        currentDate={activeDate}
        onOpenDateModal={() => setIsDateModalOpen(true)}
        isCustomDate={simulatedDate !== null}
        onResetDate={() => setSimulatedDate(null)}
      />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 1. 입력 영역 (입금액, 잔액) */}
        <section aria-labelledby="input-section-title">
          <h2 id="input-section-title" className="sr-only">생활비 금액 설정</h2>
          <BudgetInputCard
            depositAmount={depositAmount}
            currentBalance={currentBalance}
            onDepositChange={setDepositAmount}
            onBalanceChange={setCurrentBalance}
          />
        </section>

        {/* 2. 두 가지 핵심 시각화 카드 (남은 기간 % & 잔액 % ) */}
        <section aria-labelledby="visual-section-title" className="space-y-3">
          <h2 id="visual-section-title" className="sr-only">생활비 및 주기 시각화 분석</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* 시각화 1: 15일 기준 다음달 15일까지 몇 퍼센트 남았는지 */}
            <CycleProgressCard cycleInfo={cycleInfo} />

            {/* 시각화 2: 입금액 대비 현재 잔액이 몇 퍼센트인지 */}
            <BalanceProgressCard metrics={financialMetrics} />
          </div>
        </section>

        {/* 3. 종합 페이스 비교 및 일일 권장 지출 인사이트 */}
        <section aria-labelledby="pace-section-title">
          <h2 id="pace-section-title" className="sr-only">소비 페이스 비교</h2>
          <PaceComparisonCard
            cycleInfo={cycleInfo}
            metrics={financialMetrics}
          />
        </section>
      </main>

      {/* 푸터 */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50 mt-auto">
        <p>매월 15일 기준 급여 생활비 계산기 · 실시간 자동 저장</p>
      </footer>

      {/* 기준일 변경 모달 */}
      <DateSimulatorModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        currentDate={activeDate}
        onSelectDate={(newDate) => setSimulatedDate(newDate)}
        onResetToToday={() => setSimulatedDate(null)}
      />
    </div>
  );
}
