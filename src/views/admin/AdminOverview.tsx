import React, { useState } from 'react';
import { 
  Users, CheckCircle2, Clock, CalendarCheck2, 
  Target, AlertTriangle, ArrowUpDown, ChevronRight, 
  HelpCircle, AlertCircle, ArrowUpRight, ShieldAlert 
} from 'lucide-react';
import { store } from '../../services/store';
import { SdrKpiSummary, TeamKpiSummary } from '../../services/calculationEngine';
import { AiInsightsBanner } from '../../components/ai/AiInsightsBanner';

interface AdminOverviewProps {
  onSelectSdr: (sdrId: string) => void;
  onNavigateToGoals: () => void;
  onOpenCopilot?: () => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ 
  onSelectSdr, 
  onNavigateToGoals,
  onOpenCopilot,
}) => {
  const [sortField, setSortField] = useState<'overdue' | 'capacity' | 'gap' | 'attainment' | 'pending'>('overdue');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const teamKpi = store.getTeamKpiSummary();
  const sdrs = store.getSdrUsers();
  const alerts = store.getAlerts();

  const sdrSummaries: SdrKpiSummary[] = sdrs.map((sdr) => store.getSdrKpiSummary(sdr.id));

  // Sorting logic
  const sortedSummaries = [...sdrSummaries].sort((a, b) => {
    let diff = 0;
    if (sortField === 'overdue') diff = b.overdueTasksCount - a.overdueTasksCount;
    else if (sortField === 'capacity') diff = b.capacityUtilizationPercent - a.capacityUtilizationPercent;
    else if (sortField === 'gap') diff = b.gapD0 - a.gapD0;
    else if (sortField === 'attainment') diff = a.attainmentPercent - b.attainmentPercent;
    else if (sortField === 'pending') diff = b.pendingTasksCount - a.pendingTasksCount;
    return sortAsc ? -diff : diff;
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Gemini AI Strategic Operational Insights */}
      {onOpenCopilot && (
        <AiInsightsBanner onOpenCopilot={onOpenCopilot} />
      )}

      {/* Top Banner / Goal Quick CTA */}
      <div className="bg-gradient-to-r from-[#14262d] to-[#1c3640] text-white p-5 rounded-xl border border-[#1e343c] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white/10 text-white">
            <Target className="w-5 h-5 text-[#d1d5d6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white">
                Meta Geral da Equipe: {teamKpi.teamDailyGoal} Reuniões D0
              </h2>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                Vigência Ativa
              </span>
            </div>
            <p className="text-xs text-[#d1d5d6]/80 mt-0.5">
              Agendados hoje: <strong className="text-white font-mono">{teamKpi.teamBookedToday}</strong> · GAP Restante: <strong className="text-amber-300 font-mono">{teamKpi.teamGapD0}</strong> · Atingimento: <strong className="text-white font-mono">{teamKpi.teamAttainmentPercent}%</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onNavigateToGoals}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white text-[#14262d] hover:bg-[#d1d5d6] transition-colors shrink-0 shadow-xs"
          >
            <span>Gerenciar Metas & Escopos</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6.1 Cards de Indicadores Consolidados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* SDRs Ativos */}
        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs relative group hover:border-[#14262d] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">SDRs Ativos</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#14262d]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#14262d] mt-2">
            {teamKpi.activeSdrsCount}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#6a797c] mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Equipe 100% alocada</span>
          </div>
        </div>

        {/* Tarefas Pendentes */}
        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs relative group hover:border-[#14262d] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">Tarefas Pendentes</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#14262d] mt-2">
            {teamKpi.totalPendingTasks}
          </div>
          <p className="text-[11px] text-[#6a797c] mt-1">
            <strong className="text-amber-600 font-mono">{teamKpi.totalOverdueTasks}</strong> atrasadas · {teamKpi.totalTodayTasks} hoje
          </p>
        </div>

        {/* Carga vs Capacidade */}
        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs relative group hover:border-[#14262d] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">Ocupação Carga</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#14262d] mt-2">
            {teamKpi.averageCapacityUtilization}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div 
              className={`h-full ${teamKpi.averageCapacityUtilization > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min(100, teamKpi.averageCapacityUtilization)}%` }} 
            />
          </div>
          <p className="text-[10px] text-[#6a797c] mt-1 font-mono">
            {teamKpi.totalWorkloadMinutes}m carga / {teamKpi.totalCapacityMinutes}m livres
          </p>
        </div>

        {/* Reuniões Agendadas vs Realizadas */}
        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs relative group hover:border-[#14262d] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">Reuniões</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#14262d] mt-2">
            {teamKpi.totalScheduledMeetings}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {teamKpi.totalHeldMeetings} realizadas ({teamKpi.totalAttendanceRatePercent}%)
          </p>
        </div>

        {/* GAP D0 da Equipe */}
        <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-xs relative group bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-800 tracking-wider">GAP D0 Equipe</span>
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-800 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-2">
            {teamKpi.teamGapD0}
          </div>
          <p className="text-[11px] text-[#6a797c] mt-1">
            Meta: {teamKpi.teamBookedToday}/{teamKpi.teamDailyGoal} agendamentos
          </p>
        </div>
      </div>

      {/* 6.2 Quadro de Saúde Operacional da Equipe */}
      <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d1d5d6]/50 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
                Quadro de Saúde Operacional da Equipe SDR
              </h3>
              <span className="text-[10px] text-[#6a797c] md:hidden">
                (Deslize ➔)
              </span>
            </div>
            <p className="text-xs text-[#6a797c] mt-0.5">
              Acompanhamento individual de carga, pendências, agendamentos D0 e riscos de SLA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#6a797c] font-medium">Ordenar:</span>
            <button
              onClick={() => handleSort('overdue')}
              className={`px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                sortField === 'overdue' ? 'bg-[#14262d] text-white border-[#14262d]' : 'bg-[#f8fafb] text-[#6a797c] border-[#d1d5d6]'
              }`}
            >
              Atrasos
            </button>
            <button
              onClick={() => handleSort('gap')}
              className={`px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                sortField === 'gap' ? 'bg-[#14262d] text-white border-[#14262d]' : 'bg-[#f8fafb] text-[#6a797c] border-[#d1d5d6]'
              }`}
            >
              GAP D0
            </button>
            <button
              onClick={() => handleSort('capacity')}
              className={`px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                sortField === 'capacity' ? 'bg-[#14262d] text-white border-[#14262d]' : 'bg-[#f8fafb] text-[#6a797c] border-[#d1d5d6]'
              }`}
            >
              Carga %
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#d1d5d6] bg-[#f8fafb] text-[#14262d] font-semibold">
                <th className="py-3 px-3">SDR & Escopo</th>
                <th className="py-3 px-3 text-center">Pendentes</th>
                <th className="py-3 px-3 text-center">Atrasadas</th>
                <th className="py-3 px-3 text-center">Vencem Hoje</th>
                <th className="py-3 px-3 text-center">Carga (min)</th>
                <th className="py-3 px-3 text-center">Capacidade</th>
                <th className="py-3 px-3 text-center">Utilização</th>
                <th className="py-3 px-3 text-center">Meta D0</th>
                <th className="py-3 px-3 text-center">Agendados D0</th>
                <th className="py-3 px-3 text-center">GAP D0</th>
                <th className="py-3 px-3 text-center">Status Operacional</th>
                <th className="py-3 px-3 text-right">Detalhe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1d5d6]/50">
              {sortedSummaries.map((sdr) => {
                const isOverloaded = sdr.capacityStatus === 'SOBRECARGA';
                const hasDelay = sdr.overdueTasksCount > 0;

                return (
                  <tr
                    key={sdr.sdrId}
                    onClick={() => onSelectSdr(sdr.sdrId)}
                    className="hover:bg-[#f8fafb] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-medium text-[#14262d]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#14262d] text-white flex items-center justify-center font-bold text-[10px]">
                          {sdr.sdrName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-[#14262d]">{sdr.sdrName}</p>
                          <p className="text-[10px] text-[#6a797c]">{sdr.scope}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-medium">{sdr.pendingTasksCount}</td>

                    <td className="py-3 px-3 text-center font-mono">
                      <span className={hasDelay ? 'text-rose-600 font-bold' : 'text-[#6a797c]'}>
                        {sdr.overdueTasksCount}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-[#14262d]">{sdr.todayTasksCount}</td>

                    <td className="py-3 px-3 text-center font-mono text-[#14262d]">{sdr.workloadMinutes}m</td>

                    <td className="py-3 px-3 text-center font-mono text-[#6a797c]">{sdr.availableCapacityMinutes}m</td>

                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOverloaded ? 'bg-rose-500' : sdr.capacityUtilizationPercent > 90 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, sdr.capacityUtilizationPercent)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-semibold">
                          {sdr.capacityUtilizationPercent}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-semibold text-[#14262d]">{sdr.dailyGoal}</td>

                    <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-600">
                      {sdr.bookedTodayCount}
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        sdr.gapD0 > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {sdr.gapD0}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        sdr.capacityStatus === 'SOBRECARGA'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : sdr.hasSlaRisk
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {sdr.statusLabel}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <ChevronRight className="w-4 h-4 text-[#6a797c] inline" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6.3 Alertas Prioritários da Gestão */}
      <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-[#d1d5d6]/50 pb-3">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
            Alertas Operacionais Prioritários
          </h3>
          <span className="text-xs text-[#6a797c]">
            Desvios de SLA, sobrecargas e riscos de não cumprimento do GAP diário
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border text-xs space-y-2 ${
                alert.severity === 'CRITICAL'
                  ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                  : alert.severity === 'WARNING'
                  ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {alert.title}
                </span>
                {alert.sdrName && (
                  <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border font-semibold">
                    {alert.sdrName}
                  </span>
                )}
              </div>

              <p className="text-[11px] leading-relaxed">
                <strong>Motivo:</strong> {alert.reason}
              </p>

              <p className="text-[11px] leading-relaxed text-[#6a797c]">
                <strong>Impacto:</strong> {alert.estimatedImpact}
              </p>

              <div className="pt-1 border-t border-black/5 text-[11px] font-semibold text-[#14262d]">
                <strong>Ação Recomendada:</strong> {alert.recommendedAction}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
