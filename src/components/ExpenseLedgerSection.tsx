import React, { useState } from 'react';
import {
  PlusCircle,
  Sparkles,
  Trash2,
  Receipt,
  Tag,
  Clock,
  CheckSquare,
  Square,
  AlertCircle,
  Check
} from 'lucide-react';
import { ExpenseItem, CATEGORIES, CycleInfo } from '../types';
import { formatCurrency, formatCurrencyShort } from '../utils/formatters';
import { DeleteConfirmModal, DeleteTarget } from './DeleteConfirmModal';

interface ExpenseLedgerSectionProps {
  expenses: ExpenseItem[];
  onAddExpense: (expense: Omit<ExpenseItem, 'id' | 'createdAt'>) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteMultipleExpenses: (ids: string[]) => void;
  onClearAllExpenses: () => void;
  cycleInfo: CycleInfo;
  autoDeductBalance: boolean;
  onToggleAutoDeduct: (enabled: boolean) => void;
}

export const ExpenseLedgerSection: React.FC<ExpenseLedgerSectionProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  onDeleteMultipleExpenses,
  onClearAllExpenses,
  cycleInfo,
  autoDeductBalance,
  onToggleAutoDeduct,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 폼 상태
  const [merchant, setMerchant] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(todayStr);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('food');
  const [aiReason, setAiReason] = useState<string | null>(null);
  const [isAiClassifying, setIsAiClassifying] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [cycleFilterOnly, setCycleFilterOnly] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // 다중 선택 상태 (선택된 item id Set)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 삭제 확인 모달 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // AI 카테고리 자동 분류 API 호출
  const requestAiClassification = async (merchantText: string, amountNum?: number) => {
    if (!merchantText.trim()) return;
    setIsAiClassifying(true);
    try {
      const res = await fetch('/api/categorize-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: merchantText,
          amount: amountNum || 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.categoryKey) {
          setSelectedCategoryKey(data.categoryKey);
          setAiReason(data.reason || 'AI 자동 분류');
        }
      }
    } catch (err) {
      console.warn('AI classification request failed:', err);
    } finally {
      setIsAiClassifying(false);
    }
  };

  // 지출처 입력란 포커스 아웃 시 자동 AI 분류
  const handleMerchantBlur = () => {
    if (merchant.trim().length >= 2) {
      const num = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;
      requestAiClassification(merchant, num);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = rawVal === '' ? 0 : parseInt(rawVal, 10);
    setAmountStr(rawVal === '' ? '' : num.toLocaleString('ko-KR'));
    if (formError) setFormError(null);
  };

  const handleMerchantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMerchant(e.target.value);
    if (formError) setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMerchant = merchant.trim();
    const cleanAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);

    if (!cleanMerchant) {
      setFormError('지출처 / 내용을 입력해주세요.');
      return;
    }
    if (!cleanAmount || cleanAmount <= 0) {
      setFormError('0원보다 큰 지출 금액을 입력해주세요.');
      return;
    }

    setFormError(null);
    const currentCat = CATEGORIES.find((c) => c.key === selectedCategoryKey) || CATEGORIES[0];

    onAddExpense({
      merchant: cleanMerchant,
      amount: cleanAmount,
      date: date || todayStr,
      category: currentCat.name,
      categoryKey: currentCat.key,
      emoji: currentCat.emoji,
      aiReason: aiReason || undefined,
    });

    // 폼 초기화
    setMerchant('');
    setAmountStr('');
    setAiReason(null);
  };

  // 현재 선택된 카테고리 객체
  const selectedCategory = CATEGORIES.find((c) => c.key === selectedCategoryKey) || CATEGORIES[0];

  // 지출 목록 필터링 (이번 주기만 or 전체)
  const filteredExpenses = expenses.filter((item) => {
    if (!cycleFilterOnly) return true;
    const expDate = new Date(`${item.date}T00:00:00`);
    return expDate.getTime() >= cycleInfo.startDate.getTime() && expDate.getTime() < cycleInfo.endDate.getTime();
  });

  const totalFilteredSpent = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  // 다중 선택 로직
  const isAllSelected =
    filteredExpenses.length > 0 &&
    filteredExpenses.every((item) => selectedIds.has(item.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // 현재 필터된 목록의 아이디들 해제
      const next = new Set(selectedIds);
      filteredExpenses.forEach((item) => next.delete(item.id));
      setSelectedIds(next);
    } else {
      // 현재 필터된 목록 전체 선택
      const next = new Set(selectedIds);
      filteredExpenses.forEach((item) => next.add(item.id));
      setSelectedIds(next);
    }
  };

  const handleToggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // 단일 삭제 버튼 클릭
  const handleOpenSingleDelete = (item: ExpenseItem) => {
    setDeleteTarget({ type: 'single', item });
    setDeleteModalOpen(true);
  };

  // 선택 삭제 버튼 클릭
  const handleOpenSelectedDelete = () => {
    const selectedItems = expenses.filter((e) => selectedIds.has(e.id));
    if (selectedItems.length === 0) return;
    setDeleteTarget({ type: 'selected', items: selectedItems });
    setDeleteModalOpen(true);
  };

  // 전체 삭제 버튼 클릭
  const handleOpenAllDelete = () => {
    if (expenses.length === 0) return;
    const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);
    setDeleteTarget({ type: 'all', count: expenses.length, totalAmount });
    setDeleteModalOpen(true);
  };

  // 모달에서 삭제 확정 시 실행
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'single') {
      onDeleteExpense(deleteTarget.item.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.item.id);
        return next;
      });
    } else if (deleteTarget.type === 'selected') {
      const idsToDelete = deleteTarget.items.map((i) => i.id);
      onDeleteMultipleExpenses(idsToDelete);
      setSelectedIds(new Set());
    } else if (deleteTarget.type === 'all') {
      onClearAllExpenses();
      setSelectedIds(new Set());
    }
  };

  // 선택된 항목들의 합계 금액
  const selectedItemsList = expenses.filter((e) => selectedIds.has(e.id));
  const selectedTotalAmount = selectedItemsList.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-6">
      {/* 1. 상단 섹션 헤더 & 잔액 연동 토글 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">생활비 가계부 지출 입력</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> AI 자동 카테고리 분류
              </span>
            </div>
            <p className="text-xs text-slate-500">지출처와 금액을 입력하면 AI가 분류하고 잔액에 즉시 반영합니다.</p>
          </div>
        </div>

        {/* 잔액 즉시 연동 표시 */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          <span className="text-xs font-semibold text-slate-700">현재 잔액 자동 차감</span>
          <button
            type="button"
            onClick={() => onToggleAutoDeduct(!autoDeductBalance)}
            className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
              autoDeductBalance ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
            title="지출 등록 시 현재 잔액 자동 연동 토글"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                autoDeductBalance ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. 지출 입력 폼 */}
      <form onSubmit={handleSubmit} className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* 지출처 입력란 (5 cols) */}
          <div className="sm:col-span-5">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="merchant-input" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>지출처 / 내용</span>
                <span className="text-rose-500">*</span>
              </label>
              {isAiClassifying && (
                <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3" /> AI 분석 중...
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="merchant-input"
                type="text"
                value={merchant}
                onChange={handleMerchantChange}
                onBlur={handleMerchantBlur}
                placeholder="예: 스타벅스 아메리카노, 이마트 장보기"
                className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400"
              />
              {merchant.trim() && (
                <button
                  type="button"
                  onClick={() => requestAiClassification(merchant)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs flex items-center gap-1 font-semibold cursor-pointer"
                  title="AI에게 카테고리 다시 요청"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">AI 분류</span>
                </button>
              )}
            </div>
          </div>

          {/* 지출 금액 입력란 (4 cols) */}
          <div className="sm:col-span-4">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="expense-amount-input" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>지출 금액</span>
                <span className="text-rose-500">*</span>
              </label>
              {amountStr && (
                <span className="text-xs font-semibold text-emerald-600">
                  {formatCurrencyShort(parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0)}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="expense-amount-input"
                type="text"
                inputMode="numeric"
                value={amountStr}
                onChange={handleAmountChange}
                placeholder="예: 4,500"
                className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 text-right pr-9 outline-none transition-all placeholder:text-slate-400"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                원
              </span>
            </div>
          </div>

          {/* 날짜 선택 (3 cols) */}
          <div className="sm:col-span-3">
            <label htmlFor="expense-date-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              지출 일자
            </label>
            <input
              id="expense-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 outline-none"
            />
          </div>
        </div>

        {/* 폼 유효성 에러 메시지 표시 */}
        {formError && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* AI 추천 카테고리 태그 및 수동 카테고리 선택 바 */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              분류 카테고리:
            </span>

            <button
              type="button"
              onClick={() => setShowCategorySelector(!showCategorySelector)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${selectedCategory.bgColor} ${selectedCategory.borderColor} text-slate-800 hover:shadow-xs`}
            >
              <span className="text-base leading-none">{selectedCategory.emoji}</span>
              <span>{selectedCategory.name}</span>
              <span className="text-[10px] text-slate-400 font-normal underline ml-1">변경</span>
            </button>

            {aiReason && (
              <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                {aiReason}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-sm flex items-center justify-center gap-1.5 transition-all self-end cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> 지출 등록하기
          </button>
        </div>

        {/* 전체 카테고리 펼쳐보기 셀렉터 */}
        {showCategorySelector && (
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 mt-2">
            <p className="text-[11px] font-bold text-slate-600">원하는 카테고리를 직접 선택할 수 있습니다:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.key}
                  onClick={() => {
                    setSelectedCategoryKey(cat.key);
                    setAiReason('직접 선택');
                    setShowCategorySelector(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    selectedCategoryKey === cat.key
                      ? `${cat.bgColor} ${cat.borderColor} font-bold text-slate-900 ring-2 ring-indigo-400`
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* 3. 최근 지출 내역 리스트 및 관리 바 */}
      <div>
        {/* 리스트 헤더 & 필터 및 전체 삭제 버튼 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>지출 기록 목록</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {filteredExpenses.length}건
              </span>
            </h3>
            <span className="text-xs text-slate-500">
              합계: <strong className="text-slate-900 font-bold">{formatCurrency(totalFilteredSpent)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
            {/* 주기 필터 버튼 */}
            <button
              type="button"
              onClick={() => setCycleFilterOnly(true)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-colors cursor-pointer ${
                cycleFilterOnly
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              이번 주기만 ({cycleInfo.paydayDay}일 기준)
            </button>
            <button
              type="button"
              onClick={() => setCycleFilterOnly(false)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-colors cursor-pointer ${
                !cycleFilterOnly
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              전체 ({expenses.length}건)
            </button>

            {/* 전체 삭제 버튼 (확인 팝업 모달 제공) */}
            {expenses.length > 0 && (
              <button
                type="button"
                onClick={handleOpenAllDelete}
                className="text-xs px-2.5 py-1 rounded-lg font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                title="전체 지출 내역 일괄 삭제 (확인 팝업)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>전체 삭제</span>
              </button>
            )}
          </div>
        </div>

        {/* 다중 선택 시 나타나는 상단 일괄 액션 바 */}
        {selectedIds.size > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-3 flex items-center justify-between flex-wrap gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                {selectedIds.size}
              </span>
              <span className="text-xs font-bold text-indigo-950">
                {selectedIds.size}개 항목 선택됨
              </span>
              <span className="text-xs text-indigo-700">
                (합계: <strong>{formatCurrency(selectedTotalAmount)}</strong>)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs px-2.5 py-1 rounded-lg font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                선택 해제
              </button>
              <button
                type="button"
                onClick={handleOpenSelectedDelete}
                className="text-xs px-3 py-1 rounded-lg font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>선택 삭제 ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        )}

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-2">
              <Receipt className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700">등록된 지출 내역이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-0.5">위 입력창에서 지출처와 금액을 입력하여 가계부를 시작해보세요.</p>
          </div>
        ) : (
          <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
            {/* 리스트 테이블 헤더 (전체 선택 체크박스 포함) */}
            <div className="bg-slate-50/90 px-3.5 py-2 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-1.5 text-slate-700 hover:text-indigo-600 cursor-pointer font-bold"
                  title={isAllSelected ? '전체 선택 해제' : '목록 전체 선택'}
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>전체 선택</span>
                </button>
                <span className="text-slate-300">|</span>
                <span>지출처 및 카테고리</span>
              </div>
              <div>금액 / 관리</div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredExpenses.map((item) => {
                const catDef = CATEGORIES.find((c) => c.key === item.categoryKey) || CATEGORIES[0];
                const isSelected = selectedIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:px-4 flex items-center justify-between transition-colors gap-3 group ${
                      isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* 다중 선택 체크박스 */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelectItem(item.id)}
                        className="p-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer shrink-0"
                        title={isSelected ? '선택 해제' : '항목 선택'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                        )}
                      </button>

                      {/* 카테고리 이모지 뱃지 */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg border ${catDef.bgColor} ${catDef.borderColor}`}>
                        {item.emoji || catDef.emoji}
                      </div>

                      {/* 지출 세부 정보 */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {item.merchant}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catDef.bgColor} ${catDef.borderColor} text-slate-700`}>
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {item.date}
                          </span>
                          {item.aiReason && (
                            <span className="text-indigo-600/90 font-medium truncate max-w-[200px] sm:max-w-xs">
                              · {item.aiReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 금액 및 삭제 버튼 */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                        -{formatCurrency(item.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenSingleDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="지출 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 지출 삭제 확인 팝업 모달 */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        target={deleteTarget}
        autoDeductBalance={autoDeductBalance}
      />
    </div>
  );
};
