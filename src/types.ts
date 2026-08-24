export interface BudgetState {
  depositAmount: number; // 입금액 (총 생활비)
  currentBalance: number; // 현재 잔액
  paydayDay: number; // 급여일 (기본값: 15)
}

export interface CycleInfo {
  currentDate: Date;
  startDate: Date; // 이번 주기 시작일 (예: 8월 15일)
  endDate: Date; // 다음 급여일 (예: 9월 15일)
  totalDays: number; // 주기의 총 일수 (보통 28~31일)
  daysPassed: number; // 경과한 일수
  daysRemaining: number; // 남은 일수 (D-Day)
  timePassedPercent: number; // 지난 시간 비율 (%)
  timeRemainingPercent: number; // 남은 시간 비율 (%)
}

export interface FinancialMetrics {
  depositAmount: number;
  currentBalance: number;
  usedAmount: number;
  balancePercent: number; // 잔여율 (%): (잔액 / 입금액) * 100
  usedPercent: number; // 사용율 (%): (사용액 / 입금액) * 100
  dailyAllowance: number; // 남은 일수 기준 하루 권장 사용액
  dailyAverageSpent: number; // 지난 일수 기준 하루 평균 사용액
  paceStatus: 'safe' | 'normal' | 'warning' | 'critical' | 'depleted';
  paceDifference: number; // 잔여예산% - 잔여기간% (양수면 여유, 음수면 과소비)
}
