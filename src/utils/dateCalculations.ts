import { CycleInfo, FinancialMetrics, ExpenseItem, CategorySummary, CATEGORIES } from '../types';

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * 안전한 월급일 생성 (월말 일수 초과 방지: 예 31일 설정 시 2월은 28/29일로 보정)
 */
function createSafePaydayDate(year: number, month: number, targetDay: number): Date {
  const lastDay = getLastDayOfMonth(year, month);
  const safeDay = Math.min(targetDay, lastDay);
  return new Date(year, month, safeDay, 0, 0, 0, 0);
}

/**
 * 월급일 주기 계산 (기본: 15일 기준, 1~31일 지원)
 */
export function calculateCycleInfo(targetDate: Date = new Date(), payday: number = 15): CycleInfo {
  const current = new Date(targetDate);
  const year = current.getFullYear();
  const month = current.getMonth(); // 0 ~ 11
  const date = current.getDate();

  // 안전한 월급날 (1~31)
  const safePayday = Math.max(1, Math.min(31, payday || 15));

  let startDate: Date;
  let endDate: Date;

  const thisMonthPayday = createSafePaydayDate(year, month, safePayday);

  if (current.getTime() >= thisMonthPayday.getTime()) {
    // 이번 달 월급일 지남 -> 시작: 이번달 월급일, 종료: 다음달 월급일
    startDate = thisMonthPayday;
    endDate = createSafePaydayDate(year, month + 1, safePayday);
  } else {
    // 이번 달 월급일 전 -> 시작: 지난달 월급일, 종료: 이번달 월급일
    startDate = createSafePaydayDate(year, month - 1, safePayday);
    endDate = thisMonthPayday;
  }

  const oneDayMs = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / oneDayMs));

  const todayNormalized = new Date(year, month, date, 0, 0, 0, 0);
  
  // 경과일 (시작일 당일 = 0일차 또는 1일차)
  const daysPassed = Math.max(0, Math.floor((todayNormalized.getTime() - startDate.getTime()) / oneDayMs));
  // 남은 일수 (월급날 당일 D-Day)
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - todayNormalized.getTime()) / oneDayMs));

  const timeRemainingPercent = totalDays > 0 ? (daysRemaining / totalDays) * 100 : 0;
  const timePassedPercent = Math.max(0, Math.min(100, 100 - timeRemainingPercent));

  return {
    currentDate: current,
    paydayDay: safePayday,
    startDate,
    endDate,
    totalDays,
    daysPassed,
    daysRemaining,
    timePassedPercent: Number(timePassedPercent.toFixed(1)),
    timeRemainingPercent: Number(timeRemainingPercent.toFixed(1)),
  };
}

export function calculateFinancialMetrics(
  depositAmount: number,
  currentBalance: number,
  cycleInfo: CycleInfo
): FinancialMetrics {
  const safeDeposit = Math.max(0, depositAmount);
  const safeBalance = Math.max(0, currentBalance);
  const usedAmount = Math.max(0, safeDeposit - safeBalance);

  const balancePercent = safeDeposit > 0 ? Math.min(100, Math.max(0, (safeBalance / safeDeposit) * 100)) : 0;
  const usedPercent = safeDeposit > 0 ? Math.min(100, Math.max(0, (usedAmount / safeDeposit) * 100)) : 0;

  // 하루 권장 사용액 (남은 일수 기준)
  const remainingDays = Math.max(1, cycleInfo.daysRemaining);
  const dailyAllowance = Math.floor(safeBalance / remainingDays);

  // 하루 평균 지출액 (경과 일수 기준)
  const elapsedDays = Math.max(1, cycleInfo.daysPassed);
  const dailyAverageSpent = Math.floor(usedAmount / elapsedDays);

  // 소비 속도 분석 (잔여 예산% - 남은 시간%)
  const paceDifference = Number((balancePercent - cycleInfo.timeRemainingPercent).toFixed(1));

  let paceStatus: 'safe' | 'normal' | 'warning' | 'critical' | 'depleted' = 'normal';

  if (safeBalance === 0 && safeDeposit > 0) {
    paceStatus = 'depleted';
  } else if (paceDifference >= 10) {
    paceStatus = 'safe'; // 예산이 시간보다 10%p 이상 넉넉함
  } else if (paceDifference >= -10) {
    paceStatus = 'normal'; // 이상적인 지출 속도 유지 중
  } else if (paceDifference >= -25) {
    paceStatus = 'warning'; // 예산 소진이 다소 빠름
  } else {
    paceStatus = 'critical'; // 예산 초과 위험
  }

  return {
    depositAmount: safeDeposit,
    currentBalance: safeBalance,
    usedAmount,
    balancePercent: Number(balancePercent.toFixed(1)),
    usedPercent: Number(usedPercent.toFixed(1)),
    dailyAllowance,
    dailyAverageSpent,
    paceStatus,
    paceDifference,
  };
}

export function isExpenseInCycle(expenseDateStr: string, cycleInfo: CycleInfo): boolean {
  if (!expenseDateStr) return false;
  const expDate = new Date(`${expenseDateStr}T00:00:00`);
  return expDate.getTime() >= cycleInfo.startDate.getTime() && expDate.getTime() < cycleInfo.endDate.getTime();
}

export function calculateCategorySummaries(expenses: ExpenseItem[]): CategorySummary[] {
  const totalSpent = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const categoryMap = new Map<string, { totalAmount: number; count: number }>();

  // 카테고리 맵 초기화
  CATEGORIES.forEach((cat) => {
    categoryMap.set(cat.key, { totalAmount: 0, count: 0 });
  });

  // 지출 집계
  expenses.forEach((item) => {
    const key = item.categoryKey || 'other';
    const current = categoryMap.get(key) || { totalAmount: 0, count: 0 };
    categoryMap.set(key, {
      totalAmount: current.totalAmount + (item.amount || 0),
      count: current.count + 1,
    });
  });

  const summaries: CategorySummary[] = [];

  CATEGORIES.forEach((cat) => {
    const stats = categoryMap.get(cat.key) || { totalAmount: 0, count: 0 };
    if (stats.count > 0 || stats.totalAmount > 0) {
      const percentage = totalSpent > 0 ? Number(((stats.totalAmount / totalSpent) * 100).toFixed(1)) : 0;
      summaries.push({
        key: cat.key,
        name: cat.name,
        emoji: cat.emoji,
        color: cat.color,
        totalAmount: stats.totalAmount,
        count: stats.count,
        percentage,
      });
    }
  });

  // 금액 기준 내림차순 정렬
  return summaries.sort((a, b) => b.totalAmount - a.totalAmount);
}
