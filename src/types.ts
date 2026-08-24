export interface BudgetState {
  depositAmount: number; // 입금액 (총 생활비, 기본 850,000)
  currentBalance: number; // 현재 잔액
  paydayDay: number; // 급여일 (기본값: 15, 1~31일 선택 가능)
}

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  merchant: string; // 지출처 / 내용
  amount: number; // 지출 금액 (원)
  category: string; // 카테고리명 (예: 식비/카페)
  categoryKey: string; // food, grocery, etc.
  emoji: string; // 이모지
  aiReason?: string; // AI 분류 사유
  createdAt: number;
}

export interface CategoryDefinition {
  key: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const CATEGORIES: CategoryDefinition[] = [
  { key: 'food', name: '식비/카페', emoji: '🍚', color: '#f97316', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { key: 'delivery', name: '배달/외식', emoji: '🛵', color: '#ef4444', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
  { key: 'grocery', name: '마트/생필품', emoji: '🛒', color: '#10b981', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { key: 'transport', name: '교통/차량', emoji: '🚇', color: '#0ea5e9', bgColor: 'bg-sky-50', borderColor: 'border-sky-200' },
  { key: 'shopping', name: '쇼핑/패션', emoji: '🛍️', color: '#a855f7', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { key: 'culture', name: '문화/여가', emoji: '🎬', color: '#ec4899', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  { key: 'living', name: '주거/통신/공과금', emoji: '💡', color: '#eab308', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  { key: 'subscription', name: '구독/정기결제', emoji: '📺', color: '#6366f1', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  { key: 'medical', name: '의료/건강', emoji: '💊', color: '#14b8a6', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
  { key: 'social', name: '경조사/선물', emoji: '🎁', color: '#8b5cf6', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
  { key: 'other', name: '기타', emoji: '📦', color: '#64748b', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
];

export interface CategorySummary {
  key: string;
  name: string;
  emoji: string;
  color: string;
  totalAmount: number;
  count: number;
  percentage: number; // % of total expenses
}

export interface CycleInfo {
  currentDate: Date;
  paydayDay: number;
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
