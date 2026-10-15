import React, { useState } from 'react';
import { Award, Building, Flame, ChevronRight } from 'lucide-react';
import { ProcessingKpis } from '../types';

interface ChartsSectionProps {
  kpis: ProcessingKpis;
  onSelectSellerCode?: (code: string) => void;
  onSelectGt?: (gt: string) => void;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  kpis,
  onSelectSellerCode,
  onSelectGt
}) => {
  const [metricMode, setMetricMode] = useState<'acumulado' | 'ultimos5'>('acumulado');

  // Máximo para cálculo de proporções de barra
  const maxVendedorVal = Math.max(
    ...kpis.top10Vendedores.map((v) => (metricMode === 'acumulado' ? v.acumulado : v.ultimos5Dias)),
    1
  );

  const allGts = kpis.rankingGts || kpis.top10Gts;
  const maxGtVal = Math.max(
    ...allGts.map((g) => (metricMode === 'acumulado' ? g.acumulado : g.ultimos5Dias)),
    1
  );

  // Ordena conforme a métrica selecionada
  const sortedVendedores = [...kpis.top10Vendedores].sort((a, b) =>
    metricMode === 'acumulado' ? b.acumulado - a.acumulado : b.ultimos5Dias - a.ultimos5Dias
  );

  const sortedGts = [...allGts].sort((a, b) =>
    metricMode === 'acumulado' ? b.acumulado - a.acumulado : b.ultimos5Dias - a.ultimos5Dias
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      
      {/* 1. Top 10 Vendedores */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Top 10 Vendedores com Mais Anulações
                </h3>
                <p className="text-xs text-slate-500">
                  {metricMode === 'acumulado' ? 'Classificação por Acumulado Anual' : 'Classificação por Últimos 5 Dias Úteis'}
                </p>
              </div>
            </div>

            {/* Toggle metric */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setMetricMode('acumulado')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  metricMode === 'acumulado'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ano
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('ultimos5')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  metricMode === 'ultimos5'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                5 Dias
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {sortedVendedores.map((v, idx) => {
              const currentVal = metricMode === 'acumulado' ? v.acumulado : v.ultimos5Dias;
              const barPercent = Math.min(100, Math.round((currentVal / maxVendedorVal) * 100));
              const isTop3 = idx < 3;

              return (
                <div
                  key={v.codigo}
                  onClick={() => onSelectSellerCode?.(v.codigo)}
                  className="group p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                          isTop3
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-mono font-bold text-blue-900 shrink-0">
                        {v.codigo}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">
                        {v.nome}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                        ({v.gt})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-slate-500">
                        5d: <strong className="text-slate-700">{v.ultimos5Dias}</strong>
                      </span>
                      <span className="font-bold text-slate-900 min-w-8 text-right">
                        {currentVal}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTop3
                          ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 text-right">
          <span className="text-[11px] text-slate-400">
            * Clica em qualquer vendedor para auditar os recibos detalhados
          </span>
        </div>
      </div>

      {/* 2. Ranking GT (Tabela Compacta) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Ranking GT
                </h3>
                <p className="text-xs text-slate-500">
                  Tabela compacta com todos os Gestores de Território
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              {allGts.length} GTs Totais
            </span>
          </div>

          {/* Tabela Compacta Ranking GT */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-white uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12 text-white">Pos</th>
                  <th className="py-2.5 px-3 text-left text-white">GT</th>
                  <th className="py-2.5 px-3 text-right text-white">Vend.</th>
                  <th className="py-2.5 px-3 text-right text-white">5 Dias</th>
                  <th className="py-2.5 px-3 text-right text-white">Ano</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedGts.map((g, idx) => {
                  const isTop3 = idx < 3;
                  return (
                    <tr
                      key={g.emailGt}
                      onClick={() => onSelectGt?.(g.emailGt)}
                      className={`hover:bg-blue-50/60 transition cursor-pointer ${
                        isTop3 ? 'bg-rose-50/30' : (idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white')
                      }`}
                    >
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-[11px] ${
                            isTop3 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {g.nomeGt || g.emailGt}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 font-medium">
                        {g.vendedoresCount}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-blue-700">
                        {g.ultimos5Dias === 0 ? (
                          <span className="text-emerald-600">0</span>
                        ) : (
                          g.ultimos5Dias
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {g.acumulado}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 text-left uppercase text-[11px] font-bold text-slate-800">
                    Total
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {allGts.reduce((sum, g) => sum + g.vendedoresCount, 0)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-blue-800">
                    {allGts.reduce((sum, g) => sum + g.ultimos5Dias, 0)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {allGts.reduce((sum, g) => sum + g.acumulado, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>* Clica num GT para filtrar a vista de equipa abaixo</span>
          <span className="font-semibold text-slate-500">Ordenado por Acumulado</span>
        </div>
      </div>

    </div>
  );
};
