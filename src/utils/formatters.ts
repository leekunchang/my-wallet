/**
 * 원화(KRW) 화폐 단위 포맷팅 (예: 1500000 -> "1,500,000원")
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '0원';
  return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * 축약형 원화 화폐 단위 포맷팅 (예: 1500000 -> "150만원", 850000 -> "85만원")
 */
export function formatCurrencyShort(amount: number): string {
  if (isNaN(amount) || amount === 0) return '0원';
  
  if (amount >= 100000000) {
    const eok = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    return man > 0 ? `${eok}억 ${man.toLocaleString('ko-KR')}만원` : `${eok}억원`;
  }
  
  if (amount >= 10000) {
    const man = amount / 10000;
    return Number.isInteger(man) ? `${man.toLocaleString('ko-KR')}만원` : `${man.toFixed(1)}만원`;
  }
  
  return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * 한국어 전체 날짜 포맷 (예: "2026년 8월 24일 (월)")
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
 * 한국어 짧은 날짜 포맷 (예: "8월 15일")
 */
export function formatShortDate(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}월 ${d}일`;
}
