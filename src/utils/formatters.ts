/**
 * 금액을 한국어 원화(KRW) 형식으로 포맷팅합니다.
 * 예: 1500000 -> 1,500,000원
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '0원';
  return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * 금액을 만/억 단위 한국어로 간략히 표시합니다.
 * 예: 1500000 -> 150만 원
 */
export function formatCurrencyShort(amount: number): string {
  if (isNaN(amount) || amount === 0) return '0원';
  if (amount >= 100000000) {
    const eok = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    return man > 0 ? `${eok}억 ${man.toLocaleString('ko-KR')}만 원` : `${eok}억 원`;
  }
  if (amount >= 10000) {
    const man = amount / 10000;
    return Number.isInteger(man) ? `${man.toLocaleString('ko-KR')}만 원` : `${man.toFixed(1)}만 원`;
  }
  return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * 날짜를 한국어 형식으로 포맷팅합니다.
 * 예: 2026년 8월 24일 (월)
 */
export function formatKoreanDate(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dayName = days[date.getDay()];
  return `${y}년 ${m}월 ${d}일 (${dayName})`;
}

/**
 * 날짜를 간략한 월/일 형식으로 포맷팅합니다.
 * 예: 8월 15일
 */
export function formatShortDate(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}월 ${d}일`;
}
