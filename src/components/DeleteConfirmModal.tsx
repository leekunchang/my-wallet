import React from 'react';
import { AlertTriangle, Trash2, X, Check } from 'lucide-react';
import { ExpenseItem } from '../types';
import { formatCurrency } from '../utils/formatters';

export type DeleteTarget =
  | { type: 'single'; item: ExpenseItem }
  | { type: 'selected'; items: ExpenseItem[] }
  | { type: 'all'; count: number; totalAmount: number };

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  target: DeleteTarget | null;
  autoDeductBalance: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  target,
  autoDeductBalance,
}) => {
  if (!isOpen || !target) return null;

  let title = '지출 삭제 확인';
  let description = '';
  let totalAmount = 0;
  let itemCount = 0;

  if (target.type === 'single') {
    title = '지출 내역 삭제';
    itemCount = 1;
    totalAmount = target.item.amount;
    description = `'${target.item.merchant}' (${formatCurrency(target.item.amount)}) 지출 내역을 삭제하시겠습니까?`;
  } else if (target.type === 'selected') {
    itemCount = target.items.length;
    totalAmount = target.items.reduce((sum, item) => sum + item.amount, 0);
    title = `선택한 ${itemCount}건 삭제`;
    description = `선택하신 ${itemCount}개의 지출 내역을 목록에서 완전히 삭제하시겠습니까?`;
  } else if (target.type === 'all') {
    itemCount = target.count;
    totalAmount = target.totalAmount;
    title = '전체 지출 내역 초기화';
    description = `등록된 모든 지출 내역(${itemCount}건, 총 ${formatCurrency(totalAmount)})을 삭제하시겠습니까?`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* 모달 헤더 */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                target.type === 'all'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {target.type === 'all' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{title}</h3>
              <p className="text-xs text-slate-500">삭제 후 데이터 복구가 불가능합니다.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="py-4 space-y-3">
          <p className="text-sm text-slate-700 leading-relaxed">{description}</p>

          {/* 삭제 상세 요약 박스 */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>삭제 항목 수:</span>
              <strong className="font-bold text-slate-900">{itemCount}건</strong>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>총 삭제 금액:</span>
              <strong className="font-bold text-rose-600 text-sm">
                -{formatCurrency(totalAmount)}
              </strong>
            </div>
            {autoDeductBalance && totalAmount > 0 && (
              <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs text-emerald-700 font-semibold bg-emerald-50/70 -mx-1 px-2 py-1.5 rounded-lg border border-emerald-100">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  잔액 자동 환원 적용
                </span>
                <span className="font-bold">+{formatCurrency(totalAmount)}</span>
              </div>
            )}
          </div>

          {target.type === 'all' && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>주의:</strong> 전체 삭제 시 모든 지출 기록이 초기화됩니다.
              </span>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{target.type === 'all' ? '전체 삭제 실행' : '삭제'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
