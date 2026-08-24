import { useState, useEffect, useMemo } from 'react';
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

const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 'init-1',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0],
    merchant: '스타벅스 아메리카노',
    amount: 9800,
    category: '식비/외식',
    categoryKey: 'food',
    emoji: '🍔',
    aiReason: '카페 및 음료 결제',
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
  },
  {
    id: 'init-2',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString().split('T')[0],
    merchant: '이마트 트레이더스',
    amount: 43500,
    category: '식료품/장보기',
    categoryKey: 'grocery',
    emoji: '🛒',
    aiReason: '마트 식료품 구매',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'init-3',
    date: new Date().toISOString().split('T')[0],
    merchant: '카카오T 택시비',
    amount: 25000,
    category: '교통/차량',
    categoryKey: 'transport',
    emoji: '🚗',
    aiReason: '택시 이동 요금',
    createdAt: Date.now(),
  },
];

export default function App() {
  // 1. 월급일 설정 (기본: 15일)
  const [paydayDay, setPaydayDay] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYDAY);
    return saved !== null ? Number(saved) : DEFAULT_PAYDAY;
  });

  // 2. 한 달 예치금 (기본: 85만원)
  const [depositAmount, setDepositAmount] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEPOSIT);
    return saved !== null ? Number(saved) : DEFAULT_DEPOSIT;
  });

  // 3. 현재 통장 잔액
  const [currentBalance, setCurrentBalance] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BALANCE);
    if (saved !== null) return Number(saved);
    // 초기 로드 시 예치금에서 초기 샘플 지출을 제외한 금액
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

  // 5. 지출 시 잔액 자동 차감 여부 (기본: true)
  const [autoDeductBalance, setAutoDeductBalance] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_DEDUCT);
    return saved !== null ? saved === 'true' : true;
  });

  // 6. 날짜 시뮬레이터 상태
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isPaydayModalOpen, setIsPaydayModalOpen] = useState(false);

  // 로컬 스토리지 자동 저장
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

  // 현재 기준 날짜
  const activeDate = useMemo(() => {
    return simulatedDate || new Date();
  }, [simulatedDate]);

  // 7. 주기 정보 및 재정 지표 계산
  const cycleInfo = useMemo(() => {
    return calculateCycleInfo(activeDate, paydayDay);
  }, [activeDate, paydayDay]);

  const financialMetrics = useMemo(() => {
    return calculateFinancialMetrics(depositAmount, currentBalance, cycleInfo);
  }, [depositAmount, currentBalance, cycleInfo]);

  // 지출 항목 추가
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

  // 단일 지출 삭제
  const handleDeleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;
    setExpenses((prev) => prev.filter((e) => e.id !== id));

    if (autoDeductBalance) {
      setCurrentBalance((prev) => prev + target.amount);
    }
  };

  // 다중 지출 삭제
  const handleDeleteMultipleExpenses = (ids: string[]) => {
    const targetSet = new Set(ids);
    const deletedItems = expenses.filter((e) => targetSet.has(e.id));
    const totalAmount = deletedItems.reduce((sum, item) => sum + item.amount, 0);

    setExpenses((prev) => prev.filter((e) => !targetSet.has(e.id)));

    if (autoDeductBalance && totalAmount > 0) {
      setCurrentBalance((prev) => prev + totalAmount);
    }
  };

  // 전체 지출 초기화
  const handleClearAllExpenses = () => {
    const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);
    setExpenses([]);

    if (autoDeductBalance && totalAmount > 0) {
      setCurrentBalance((prev) => prev + totalAmount);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 헤더 */}
      <Header
        currentDate={activeDate}
        paydayDay={paydayDay}
        onOpenPaydayModal={() => setIsPaydayModalOpen(true)}
        onOpenDateModal={() => setIsDateModalOpen(true)}
        isCustomDate={simulatedDate !== null}
        onResetDate={() => setSimulatedDate(null)}
      />

      {/* 메인 대시보드 */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 1. 예산 및 잔액 설정 카드 */}
        <section aria-labelledby="input-section-title">
          <h2 id="input-section-title" className="sr-only">예산 및 잔액 입력</h2>
          <BudgetInputCard
            depositAmount={depositAmount}
            currentBalance={currentBalance}
            onDepositChange={setDepositAmount}
            onBalanceChange={setCurrentBalance}
          />
        </section>

        {/* 2. 주기 진척도(시간 경과%) & 예산 현황(잔액%) 듀얼 카드 */}
        <section aria-labelledby="visual-section-title" className="space-y-3">
          <h2 id="visual-section-title" className="sr-only">월급 주기 및 예산 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* 게이지 1: 월급 주기 시간 경과 */}
            <CycleProgressCard cycleInfo={cycleInfo} />
            {/* 게이지 2: 예산 잔액 현황 */}
            <BalanceProgressCard metrics={financialMetrics} />
          </div>
        </section>

        {/* 3. 소비 속도 및 하루 권장 지출액 분석 */}
        <section aria-labelledby="pace-section-title">
          <h2 id="pace-section-title" className="sr-only">소비 속도 분석</h2>
          <PaceComparisonCard
            cycleInfo={cycleInfo}
            metrics={financialMetrics}
          />
        </section>

        {/* 4. 지출 내역 기록 & AI 자동 분류 */}
        <section aria-labelledby="ledger-section-title">
          <h2 id="ledger-section-title" className="sr-only">지출 기록 및 AI 가계부</h2>
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

        {/* 5. 카테고리별 지출 시각화 */}
        <section aria-labelledby="category-visual-section-title">
          <h2 id="category-visual-section-title" className="sr-only">카테고리별 지출 분석</h2>
          <CategoryVisualizationCard
            expenses={expenses}
            cycleInfo={cycleInfo}
          />
        </section>
      </main>

      {/* 푸터 */}
      <footer className="w-full py-5 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50 mt-auto">
        <p>매월 {paydayDay}일 기준 월급 주기 스마트 예산 관리기 & AI 자동 분류</p>
      </footer>

      {/* 기준 날짜 시뮬레이터 모달 */}
      <DateSimulatorModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        currentDate={activeDate}
        onSelectDate={(newDate) => setSimulatedDate(newDate)}
        onResetToToday={() => setSimulatedDate(null)}
      />

      {/* 월급일 설정 모달 */}
      <PaydaySettingModal
        isOpen={isPaydayModalOpen}
        onClose={() => setIsPaydayModalOpen(false)}
        currentPayday={paydayDay}
        onSavePayday={(newDay) => setPaydayDay(newDay)}
      />
    </div>
  );
}
