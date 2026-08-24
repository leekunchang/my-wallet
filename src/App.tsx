import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { BudgetInputCard } from './components/BudgetInputCard';
import { CycleProgressCard } from './components/CycleProgressCard';
import { BalanceProgressCard } from './components/BalanceProgressCard';
import { PaceComparisonCard } from './components/PaceComparisonCard';
import { ExpenseLedgerSection } from './components/ExpenseLedgerSection';
import { CategoryVisualizationCard } from './components/CategoryVisualizationCard';
import { DateSimulatorModal } from './components/DateSimulatorModal';
import { PaydaySettingModal } from './components/PaydaySettingModal';
import { calculateCycleInfo, calculateFinancialMetrics } from './utils/dateCalculations';
import { ExpenseItem } from './types';

const STORAGE_KEYS = {
  DEPOSIT: 'budget_deposit_amount',
  BALANCE: 'budget_current_balance',
  PAYDAY: 'budget_payday_day',
  EXPENSES: 'budget_expense_items',
  AUTO_DEDUCT: 'budget_auto_deduct_balance',
};

const DEFAULT_DEPOSIT = 850000;
const DEFAULT_PAYDAY = 15;

// 초기 예시 지출 내역 (앱 첫 실행 시)
const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 'init-1',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0],
    merchant: '스타벅스 아메리카노 & 샌드위치',
    amount: 9800,
    category: '식비/카페',
    categoryKey: 'food',
    emoji: '🍚',
    aiReason: '카페 및 베이커리 식음료',
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
  },
  {
    id: 'init-2',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString().split('T')[0],
    merchant: '이마트 생필품 & 과일 장보기',
    amount: 43500,
    category: '마트/생필품',
    categoryKey: 'grocery',
    emoji: '🛒',
    aiReason: '대형마트 식료품 및 생필품',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'init-3',
    date: new Date().toISOString().split('T')[0],
    merchant: '지하철 교통카드 충전',
    amount: 25000,
    category: '교통/차량',
    categoryKey: 'transport',
    emoji: '🚇',
    aiReason: '대중교통 교통카드 충전',
    createdAt: Date.now(),
  },
];

export default function App() {
  // 1. 급여일(기준일) 설정 (기본값: 15일)
  const [paydayDay, setPaydayDay] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYDAY);
    return saved !== null ? Number(saved) : DEFAULT_PAYDAY;
  });

  // 2. 입금액 (기본값: 85만원)
  const [depositAmount, setDepositAmount] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEPOSIT);
    return saved !== null ? Number(saved) : DEFAULT_DEPOSIT;
  });

  // 3. 현재 잔액
  const [currentBalance, setCurrentBalance] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BALANCE);
    if (saved !== null) return Number(saved);
    // 초기 지출 합계 차감 기본값 계산
    const initialSpent = INITIAL_EXPENSES.reduce((sum, item) => sum + item.amount, 0);
    return Math.max(0, DEFAULT_DEPOSIT - initialSpent);
  });

  // 4. 지출 내역 리스트
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_EXPENSES;
      }
    }
    return INITIAL_EXPENSES;
  });

  // 5. 지출 추가 시 잔액 자동 차감 연동 여부 (기본: true)
  const [autoDeductBalance, setAutoDeductBalance] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_DEDUCT);
    return saved !== null ? saved === 'true' : true;
  });

  // 6. 기준 날짜 상태 (기본: 실제 오늘)
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isPaydayModalOpen, setIsPaydayModalOpen] = useState(false);

  // 로컬스토리지 동기화
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYDAY, paydayDay.toString());
  }, [paydayDay]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEPOSIT, depositAmount.toString());
  }, [depositAmount]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BALANCE, currentBalance.toString());
  }, [currentBalance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTO_DEDUCT, autoDeductBalance.toString());
  }, [autoDeductBalance]);

  // 현재 유효한 날짜
  const activeDate = useMemo(() => {
    return simulatedDate || new Date();
  }, [simulatedDate]);

  // 7. 주기 및 재정 지표 계산
  const cycleInfo = useMemo(() => {
    return calculateCycleInfo(activeDate, paydayDay);
  }, [activeDate, paydayDay]);

  const financialMetrics = useMemo(() => {
    return calculateFinancialMetrics(depositAmount, currentBalance, cycleInfo);
  }, [depositAmount, currentBalance, cycleInfo]);

  // 지출 등록 핸들러 (지출 추가 + 잔액 자동 차감)
  const handleAddExpense = (newExpenseData: Omit<ExpenseItem, 'id' | 'createdAt'>) => {
    const newExpense: ExpenseItem = {
      ...newExpenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };

    setExpenses((prev) => [newExpense, ...prev]);

    if (autoDeductBalance) {
      setCurrentBalance((prev) => Math.max(0, prev - newExpenseData.amount));
    }
  };

  // 지출 단일 삭제 핸들러 (지출 삭제 + 잔액 환원)
  const handleDeleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;

    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (autoDeductBalance) {
      setCurrentBalance((prev) => prev + target.amount);
    }
  };

  // 지출 다중 선택 삭제 핸들러
  const handleDeleteMultipleExpenses = (ids: string[]) => {
    const targetSet = new Set(ids);
    const deletedItems = expenses.filter((e) => targetSet.has(e.id));
    const totalAmount = deletedItems.reduce((sum, item) => sum + item.amount, 0);

    setExpenses((prev) => prev.filter((e) => !targetSet.has(e.id)));
    if (autoDeductBalance && totalAmount > 0) {
      setCurrentBalance((prev) => prev + totalAmount);
    }
  };

  // 지출 전체 삭제 핸들러
  const handleClearAllExpenses = () => {
    const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);
    setExpenses([]);
    if (autoDeductBalance && totalAmount > 0) {
      setCurrentBalance((prev) => prev + totalAmount);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 상단 네비게이션 / 헤더 */}
      <Header
        currentDate={activeDate}
        paydayDay={paydayDay}
        onOpenPaydayModal={() => setIsPaydayModalOpen(true)}
        onOpenDateModal={() => setIsDateModalOpen(true)}
        isCustomDate={simulatedDate !== null}
        onResetDate={() => setSimulatedDate(null)}
      />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
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
            {/* 시각화 1: 급여일 기준 다음 급여일까지 몇 퍼센트 남았는지 */}
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

        {/* 4. 가계부 지출 입력 & AI 카테고리 자동 분류 */}
        <section aria-labelledby="ledger-section-title">
          <h2 id="ledger-section-title" className="sr-only">가계부 지출 입력 및 AI 자동 분류</h2>
          <ExpenseLedgerSection
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            onDeleteMultipleExpenses={handleDeleteMultipleExpenses}
            onClearAllExpenses={handleClearAllExpenses}
            cycleInfo={cycleInfo}
            autoDeductBalance={autoDeductBalance}
            onToggleAutoDeduct={setAutoDeductBalance}
          />
        </section>

        {/* 5. 분류된 카테고리 시각화 표 및 차트 */}
        <section aria-labelledby="category-visual-section-title">
          <h2 id="category-visual-section-title" className="sr-only">카테고리별 소비 시각화 표 및 분석</h2>
          <CategoryVisualizationCard
            expenses={expenses}
            cycleInfo={cycleInfo}
          />
        </section>
      </main>

      {/* 푸터 */}
      <footer className="w-full py-5 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50 mt-auto">
        <p>매월 {paydayDay}일 기준 생활비 가계부 & AI 자동 카테고리 매니저 · 실시간 자동 저장</p>
      </footer>

      {/* 기준일 변경 모달 */}
      <DateSimulatorModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        currentDate={activeDate}
        onSelectDate={(newDate) => setSimulatedDate(newDate)}
        onResetToToday={() => setSimulatedDate(null)}
      />

      {/* 급여일(기준일) 설정 모달 */}
      <PaydaySettingModal
        isOpen={isPaydayModalOpen}
        onClose={() => setIsPaydayModalOpen(false)}
        currentPayday={paydayDay}
        onSavePayday={(newDay) => setPaydayDay(newDay)}
      />
    </div>
  );
}
