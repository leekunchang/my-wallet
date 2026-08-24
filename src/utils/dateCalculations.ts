import { CycleInfo, FinancialMetrics } from '../types';

/**
 * 특정 기준일(기본: 오늘)과 급여일(기본: 15일)을 바탕으로 월급 주기 정보를 계산합니다.
 */
export function calculateCycleInfo(targetDate: Date = new Date(), payday: number = 15): CycleInfo {
  const current = new Date(targetDate);
  const year = current.getFullYear();
  const month = current.getMonth(); // 0 ~ 11
  const date = current.getDate();

  let startDate: Date;
  let endDate: Date;

  if (date >= payday) {
    // 이번 달 급여일 이후: 시작일은 이번 달 15일, 종료일은 다음 달 15일
    startDate = new Date(year, month, payday, 0, 0, 0, 0);
    endDate = new Date(year, month + 1, payday, 0, 0, 0, 0);
  } else {
    // 이번 달 급여일 이전: 시작일은 지난 달 15일, 종료일은 이번 달 15일
    startDate = new Date(year, month - 1, payday, 0, 0, 0, 0);
    endDate = new Date(year, month, payday, 0, 0, 0, 0);
  }

  const oneDayMs = 1000 * 60 * 60 * 24;
  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / oneDayMs);

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
  // 예: 기간이 60% 남았는데 잔액이 80% 남았다면 +20% (아주 안정적)
  // 예: 기간이 60% 남았는데 잔액이 30% 남았다면 -30% (과소비)
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
