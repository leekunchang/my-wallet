export interface BudgetState {
  depositAmount: number; // 예치금 (기본: 850,000)
  currentBalance: number; // 현재 잔액
  paydayDay: number; // 월급날 (기본: 15, 1~31)
}

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  merchant: string; // 사용처
  amount: number; // 금액
  category: string; // 카테고리 표시 이름
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
  { key: 'food', name: '식비/외식', emoji: '🍔', color: '#f97316', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { key: 'delivery', name: '배달음식', emoji: '🛵', color: '#ef4444', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
  { key: 'grocery', name: '식료품/장보기', emoji: '🛒', color: '#10b981', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { key: 'transport', name: '교통/차량', emoji: '🚗', color: '#0ea5e9', bgColor: 'bg-sky-50', borderColor: 'border-sky-200' },
  { key: 'shopping', name: '쇼핑/패션', emoji: '🛍️', color: '#a855f7', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { key: 'culture', name: '문화/여가', emoji: '🎬', color: '#ec4899', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  { key: 'living', name: '주거/통신', emoji: '🏠', color: '#eab308', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  { key: 'subscription', name: '구독서비스', emoji: '💳', color: '#6366f1', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  { key: 'medical', name: '의료/건강', emoji: '💊', color: '#14b8a6', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
  { key: 'social', name: '경조사/선물', emoji: '🎁', color: '#8b5cf6', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
  { key: 'other', name: '기타/잡비', emoji: '📦', color: '#64748b', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
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
  startDate: Date; // 주기 시작일
  endDate: Date; // 다음 월급일 (주기 종료일)
  totalDays: number; // 주기 총 일수 (28~31)
  daysPassed: number; // 경과 일수
  daysRemaining: number; // 남은 일수 (D-Day)
  timePassedPercent: number; // 시간 경과율 (%)
  timeRemainingPercent: number; // 남은 시간 비율 (%)
}

export interface FinancialMetrics {
  depositAmount: number;
  currentBalance: number;
  usedAmount: number;
  balancePercent: number; // 잔여율 (%): (현재잔액 / 예치금) * 100
  usedPercent: number; // 사용율 (%): (사용금액 / 예치금) * 100
  dailyAllowance: number; // 하루 사용 권장액
  dailyAverageSpent: number; // 하루 평균 지출액
  paceStatus: 'safe' | 'normal' | 'warning' | 'critical' | 'depleted';
  paceDifference: number; // 잔여율% - 남은시간%
}
