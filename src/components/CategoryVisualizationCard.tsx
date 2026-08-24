import React, { useState } from 'react';
import {
  PieChart as PieChartIcon,
  Table as TableIcon,
  Award,
  BarChart3,
} from 'lucide-react';
import { ExpenseItem, CATEGORIES, CycleInfo } from '../types';
import { calculateCategorySummaries } from '../utils/dateCalculations';
import { formatCurrency } from '../utils/formatters';

interface CategoryVisualizationCardProps {
  expenses: ExpenseItem[];
  cycleInfo: CycleInfo;
}

export const CategoryVisualizationCard: React.FC<CategoryVisualizationCardProps> = ({
  expenses,
  cycleInfo,
}) => {
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);

  // 이번 주기 지출 필터링
  const cycleExpenses = expenses.filter((item) => {
    const expDate = new Date(`${item.date}T00:00:00`);
    return expDate.getTime() >= cycleInfo.startDate.getTime() && expDate.getTime() < cycleInfo.endDate.getTime();
  });

  const targetExpenses = cycleExpenses.length > 0 ? cycleExpenses : expenses;
  const isAllFallback = cycleExpenses.length === 0 && expenses.length > 0;

  const summaries = calculateCategorySummaries(targetExpenses);
  const totalAmount = summaries.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalCount = summaries.reduce((sum, item) => sum + item.count, 0);
  const topCategory = summaries.length > 0 ? summaries[0] : null;

  if (targetExpenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <PieChartIcon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">카테고리별 지출 분석</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          지출을 등록하면 카테고리별 비중과 통계 차트가 이곳에 자동으로 시각화됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5">
      {/* 1. 섹션 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">카테고리별 소비 분석</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                {summaries.length}개 분야
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isAllFallback
                ? '전체 누적 지출 기준 통계'
                : `이번 주기 (${cycleInfo.paydayDay}일 기준) 총 지출 ${formatCurrency(totalAmount)}`}
            </p>
          </div>
        </div>

        {topCategory && (
          <div className="flex items-center gap-2 bg-indigo-50/80 px-3 py-1.5 rounded-xl border border-indigo-100 self-start sm:self-auto text-xs">
            <Award className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-slate-600 font-medium">최대 지출 항목:</span>
            <strong className="text-indigo-900 font-bold">
              {topCategory.emoji} {topCategory.name} ({topCategory.percentage}%)
            </strong>
          </div>
        )}
      </div>

      {/* 2. 누적 바 차트 (Stacked Progress Bar) */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            지출 비중 그래프
          </span>
          <span className="text-slate-400">총 {totalCount}건 결제</span>
        </div>

        {/* 비중 분할 바 */}
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/60 shadow-inner">
          {summaries.map((cat) => (
            <div
              key={cat.key}
              style={{
                width: `${cat.percentage}%`,
                backgroundColor: cat.color,
              }}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all hover:opacity-90 relative cursor-pointer"
              title={`${cat.name}: ${cat.percentage}% (${formatCurrency(cat.totalAmount)})`}
              onClick={() => setSelectedCategoryKey(selectedCategoryKey === cat.key ? null : cat.key)}
            />
          ))}
        </div>

        {/* 범례 (Legend) 칩 목록 */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {summaries.map((cat) => {
            const isSelected = selectedCategoryKey === cat.key;
            return (
              <button
                type="button"
                key={cat.key}
                onClick={() => setSelectedCategoryKey(isSelected ? null : cat.key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 shadow-xs font-bold text-slate-900 bg-indigo-50 border-indigo-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
                <span className="font-bold text-slate-800 ml-0.5">{cat.percentage}%</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 순위별 테이블 (Table) */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
          <span className="flex items-center gap-1">
            <TableIcon className="w-3.5 h-3.5 text-indigo-500" />
            카테고리별 지출 랭킹
          </span>
          <span className="text-slate-400 font-normal">항목을 누르면 세부 내역을 확인합니다</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th scope="col" className="py-2.5 px-3 text-center w-12">순위</th>
                <th scope="col" className="py-2.5 px-3">카테고리</th>
                <th scope="col" className="py-2.5 px-3 text-right">총 지출액</th>
                <th scope="col" className="py-2.5 px-3 text-center w-16">결제건수</th>
                <th scope="col" className="py-2.5 px-3 text-right w-20">비중(%)</th>
                <th scope="col" className="py-2.5 px-3 w-36">비율 게이지</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {summaries.map((cat, idx) => {
                const isSelected = selectedCategoryKey === cat.key;
                return (
                  <tr
                    key={cat.key}
                    onClick={() => setSelectedCategoryKey(isSelected ? null : cat.key)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/70 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-400">
                      {idx === 0 ? (
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black inline-flex items-center justify-center text-[10px]">
                          1
                        </span>
                      ) : idx === 1 ? (
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold inline-flex items-center justify-center text-[10px]">
                          2
                        </span>
                      ) : idx === 2 ? (
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 font-bold inline-flex items-center justify-center text-[10px]">
                          3
                        </span>
                      ) : (
                        idx + 1
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{cat.emoji}</span>
                        <span className="font-bold text-slate-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      {formatCurrency(cat.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">
                      {cat.count}건
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-600">
                      {cat.percentage}%
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
              <tr>
                <td className="py-2.5 px-3 text-center text-slate-500">합계</td>
                <td className="py-2.5 px-3">{summaries.length}개 카테고리</td>
                <td className="py-2.5 px-3 text-right font-black text-indigo-700">{formatCurrency(totalAmount)}</td>
                <td className="py-2.5 px-3 text-center">{totalCount}건</td>
                <td className="py-2.5 px-3 text-right text-indigo-700">100.0%</td>
                <td className="py-2.5 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4. 선택된 카테고리의 세부 지출 항목 */}
      {selectedCategoryKey && (
        <div className="bg-slate-50 rounded-xl p-4 border border-indigo-100 text-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{CATEGORIES.find((c) => c.key === selectedCategoryKey)?.emoji}</span>
              <span>{CATEGORIES.find((c) => c.key === selectedCategoryKey)?.name} 상세 내역</span>
            </h4>
            <button
              onClick={() => setSelectedCategoryKey(null)}
              className="text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
            >
              닫기
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {targetExpenses
              .filter((e) => e.categoryKey === selectedCategoryKey)
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900">{item.merchant}</span>
                    <span className="text-slate-400 ml-2 text-[11px]">{item.date}</span>
                    {item.aiReason && <span className="text-indigo-600 ml-2 text-[11px]">💡 {item.aiReason}</span>}
                  </div>
                  <span className="font-bold text-slate-900">-{formatCurrency(item.amount)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
