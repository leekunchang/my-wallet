import { CycleInfo, FinancialMetrics, ExpenseItem, CategorySummary, CATEGORIES } from '../types';

/**
 * 특정 연월의 마지막 날짜를 구합니다.
 */
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * 특정 연월에 주어진 급여일(1~31)을 유효한 날짜 객체로 생성합니다.
 * (예: 31일 설정 시 2월이면 28/29일로 보정)
 */
function createSafePaydayDate(year: number, month: number, targetDay: number): Date {
  const lastDay = getLastDayOfMonth(year, month);
  const safeDay = Math.min(targetDay, lastDay);
  return new Date(year, month, safeDay, 0, 0, 0, 0);
}

/**
 * 특정 기준일(기본: 오늘)과 급여일(기본: 15일, 1~31)을 바탕으로 월급 주기 정보를 계산합니다.
 */
export function calculateCycleInfo(targetDate: Date = new Date(), payday: number = 15): CycleInfo {
  const current = new Date(targetDate);
  const year = current.getFullYear();
  const month = current.getMonth(); // 0 ~ 11
  const date = current.getDate();

  // 안전한 급여일 (1~31)
  const safePayday = Math.max(1, Math.min(31, payday || 15));

  let startDate: Date;
  let endDate: Date;

  // 현재 날짜가 이번 달 급여일 이상인지 확인
  const thisMonthPayday = createSafePaydayDate(year, month, safePayday);

  if (current.getTime() >= thisMonthPayday.getTime()) {
    // 이번 달 급여일 이후: 시작일은 이번 달 급여일, 종료일은 다음 달 급여일
    startDate = thisMonthPayday;
    endDate = createSafePaydayDate(year, month + 1, safePayday);
  } else {
    // 이번 달 급여일 이전: 시작일은 지난 달 급여일, 종료일은 이번 달 급여일
    startDate = createSafePaydayDate(year, month - 1, safePayday);
    endDate = thisMonthPayday;
  }

  const oneDayMs = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / oneDayMs));

  const todayNormalized = new Date(year, month, date, 0, 0, 0, 0);

  // 경과 일수 (시작일 = 0일차, 급여일 당일 = 0일 경과)
  const daysPassed = Math.max(0, Math.floor((todayNormalized.getTime() - startDate.getTime()) / oneDayMs));

  // 남은 일수 (다음 급여일까지 D-Day)
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - todayNormalized.getTime()) / oneDayMs));

  // 남은 기간 퍼센트 (다음 급여일까지 남은 비율)
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

/**
 * 입금액과 잔액, 주기 정보를 바탕으로 재정 지표 및 페이스 상태를 계산합니다.
 */
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

  // 남은 일수 기준 하루 권장 생활비 (남은 일수가 0이면 당일 잔액 그대로)
  const remainingDays = Math.max(1, cycleInfo.daysRemaining);
  const dailyAllowance = Math.floor(safeBalance / remainingDays);

  // 지난 일수 기준 하루 평균 소비액
  const elapsedDays = Math.max(1, cycleInfo.daysPassed);
  const dailyAverageSpent = Math.floor(usedAmount / elapsedDays);

  // 페이스 차이: 잔여 예산 비율 - 잔여 기간 비율
  const paceDifference = Number((balancePercent - cycleInfo.timeRemainingPercent).toFixed(1));

  let paceStatus: 'safe' | 'normal' | 'warning' | 'critical' | 'depleted' = 'normal';

  if (safeBalance === 0 && safeDeposit > 0) {
    paceStatus = 'depleted';
  } else if (paceDifference >= 10) {
    paceStatus = 'safe'; // 예산이 넉넉함
  } else if (paceDifference >= -10) {
    paceStatus = 'normal'; // 기간과 소비 속도가 균형을 이룸
  } else if (paceDifference >= -25) {
    paceStatus = 'warning'; // 예산 소진 속도가 다소 빠름
  } else {
    paceStatus = 'critical'; // 예산 조기 소진 위험
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

/**
 * 특정 지출 날짜가 현재 주기에 속하는지 검사합니다.
 */
export function isExpenseInCycle(expenseDateStr: string, cycleInfo: CycleInfo): boolean {
  if (!expenseDateStr) return false;
  const expDate = new Date(`${expenseDateStr}T00:00:00`);
  return expDate.getTime() >= cycleInfo.startDate.getTime() && expDate.getTime() < cycleInfo.endDate.getTime();
}

/**
 * 지출 목록을 카테고리별로 집계하여 통계 및 백분율을 반환합니다.
 */
export function calculateCategorySummaries(expenses: ExpenseItem[]): CategorySummary[] {
  const totalSpent = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  const categoryMap = new Map<string, { totalAmount: number; count: number }>();

  // 카테고리별 초기화
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

  // 금액 높은 순 정렬
  return summaries.sort((a, b) => b.totalAmount - a.totalAmount);
}
