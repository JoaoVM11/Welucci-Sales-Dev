import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Filter, Search, Calendar, CheckCircle2 } from 'lucide-react';
import { store } from '../../services/store';

export const ReportsView: React.FC = () => {
  const [filterSdr, setFilterSdr] = useState<string>('ALL');
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = store.subscribe(() => setTick(t => t + 1));
    return () => unsub();
  }, []);

  const sdrs = store.getSdrUsers();
  const teamKpi = store.getTeamKpiSummary();
  const isDemo = store.getIsDemoMode();
  const selectedDate = store.getSelectedDate();

  const handleDownloadCsv = () => {
    const csvContent = store.exportTeamDataToCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `welucci_relatorio_produtividade_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSdrs = filterSdr === 'ALL' ? sdrs : sdrs.filter(s => s.id === filterSdr);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 sm:p-2.5 rounded-lg bg-[#14262d] text-[#d1d5d6] shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-amber-300" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#14262d] tracking-tight">
                  Relatórios Comerciais e Exportação
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-[#14262d] border border-[#d1d5d6]">
                  {selectedDate}
                </span>
              </div>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Consolidado de produtividade, taxa de comparecimento, atingimento de metas e GAP D0 com exportação compatível com Excel/Sheets.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#14262d] text-white hover:bg-[#1c3640] transition-colors shadow-xs cursor-pointer w-full sm:w-auto"
        >
          <Download className="w-4 h-4 text-amber-300" />
          <span>Exportar Relatório CSV</span>
        </button>
      </div>

      {/* Filter and Environment Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[#14262d]">Filtrar por SDR:</span>
          <select
            value={filterSdr}
            onChange={(e) => setFilterSdr(e.target.value)}
            className="bg-[#f8fafb] border border-[#d1d5d6] rounded-md px-3 py-1.5 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d]"
          >
            <option value="ALL">Toda a Equipe SDR ({sdrs.length})</option>
            {sdrs.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.scope})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-[#6a797c]">
          <span>Camada de Dados:</span>
          <span className="font-semibold text-[#14262d]">
            {isDemo ? 'Demonstração (Simulado Welucci)' : 'Produção Conectada'}
          </span>
        </div>
      </div>

      {/* Detailed Report Table */}
      <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#d1d5d6]/50 pb-3">
          <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
            Tabela Consolidada de Desempenho e Metas
          </h3>
          <span className="text-[11px] text-[#6a797c] hidden sm:inline">
            Status operacional do dia {selectedDate}
          </span>
        </div>

        {/* Mobile Swipe Notice */}
        <div className="block sm:hidden text-[10px] font-semibold text-[#6a797c] text-right">
          (Deslize para ver colunas ➔)
        </div>

        <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead>
              <tr className="border-b border-[#d1d5d6] bg-[#f8fafb] text-[#14262d] font-semibold">
                <th className="py-3 px-3">SDR</th>
                <th className="py-3 px-3">Escopo</th>
                <th className="py-3 px-3 text-center">Meta D0</th>
                <th className="py-3 px-3 text-center">Agendados D0</th>
                <th className="py-3 px-3 text-center">GAP D0</th>
                <th className="py-3 px-3 text-center">Atingimento</th>
                <th className="py-3 px-3 text-center">Tarefas Atrasadas</th>
                <th className="py-3 px-3 text-center">Carga (min)</th>
                <th className="py-3 px-3 text-center">Capacidade (min)</th>
                <th className="py-3 px-3 text-center">Utilização</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1d5d6]/50">
              {filteredSdrs.map(sdr => {
                const kpi = store.getSdrKpiSummary(sdr.id);
                return (
                  <tr key={sdr.id} className="hover:bg-[#f8fafb] transition-colors">
                    <td className="py-3 px-3 font-semibold text-[#14262d]">{sdr.name}</td>
                    <td className="py-3 px-3 text-[#6a797c]">{sdr.scope}</td>
                    <td className="py-3 px-3 text-center font-mono">{kpi.dailyGoal}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">{kpi.bookedTodayCount}</td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded font-bold ${kpi.gapD0 > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {kpi.gapD0}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-[#14262d]">{kpi.attainmentPercent}%</td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span className={kpi.overdueTasksCount > 0 ? 'text-rose-600 font-bold' : 'text-[#6a797c]'}>
                        {kpi.overdueTasksCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{kpi.workloadMinutes}m</td>
                    <td className="py-3 px-3 text-center font-mono">{kpi.availableCapacityMinutes}m</td>
                    <td className="py-3 px-3 text-center font-mono font-semibold">{kpi.capacityUtilizationPercent}%</td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#14262d]">
                        {kpi.statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
