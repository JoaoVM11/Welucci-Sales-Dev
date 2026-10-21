import React, { useState } from 'react';
import { 
  CalendarCheck2, HelpCircle, CheckCircle2, 
  XCircle, UserX, TrendingUp, Calendar, ArrowUpRight 
} from 'lucide-react';
import { store } from '../../services/store';

export const MeetingsAnalysis: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<string>('Hoje');
  const meetings = store.getMeetings();
  const sdrs = store.getSdrUsers();

  const scheduled = meetings.filter(m => m.status === 'SCHEDULED');
  const held = meetings.filter(m => m.status === 'HELD');
  const cancelled = meetings.filter(m => m.status === 'CANCELLED');
  const noShow = meetings.filter(m => m.status === 'NO_SHOW');

  // Attendance Rate = held / (held + noShows + cancelled) * 100
  const eligible = held.length + noShow.length + cancelled.length;
  const attendanceRate = eligible > 0 ? Math.round((held.length / eligible) * 100) : 0;
  const noShowRate = eligible > 0 ? Math.round((noShow.length / eligible) * 100) : 0;
  const cancellationRate = eligible > 0 ? Math.round((cancelled.length / eligible) * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="bg-white p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#14262d] text-[#d1d5d6]">
              <CalendarCheck2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#14262d] tracking-tight">
                Módulo de Reuniões: Agendadas vs Realizadas
              </h2>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Diferenciação obrigatória entre agendamento, realização, cancelamento e no-show com dados oficiais do HubSpot CRM.
              </p>
            </div>
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex items-center bg-[#f8fafb] p-1 rounded-lg border border-[#d1d5d6] text-xs">
          {['Hoje', 'Esta Semana', 'Este Mês', 'Mês Anterior'].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRange(r)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                selectedRange === r
                  ? 'bg-[#14262d] text-white shadow-xs'
                  : 'text-[#6a797c] hover:text-[#14262d]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-[#6a797c] tracking-wider">Agendadas</span>
            <CalendarCheck2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#14262d] mt-2">{meetings.length}</p>
          <p className="text-[11px] text-[#6a797c] mt-1">{scheduled.length} futuras ativas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-[#6a797c] tracking-wider">Realizadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-2">{held.length}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">{attendanceRate}% comparecimento</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-[#6a797c] tracking-wider">No-Shows</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-600 mt-2">{noShow.length}</p>
          <p className="text-[11px] text-rose-700 font-medium mt-1">{noShowRate}% do total elegível</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-[#6a797c] tracking-wider">Canceladas</span>
            <XCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-2">{cancelled.length}</p>
          <p className="text-[11px] text-[#6a797c] mt-1">{cancellationRate}% cancelamento</p>
        </div>
      </div>

      {/* Regra de Cálculo Tooltip Box */}
      <div className="bg-[#f8fafb] border border-[#d1d5d6] p-4 rounded-xl text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#14262d]">
          <HelpCircle className="w-4 h-4 text-[#6a797c]" />
          <span>Diretriz Oficial de Cálculo da Taxa de Comparecimento da Welucci</span>
        </div>
        <p className="text-[#6a797c] leading-relaxed">
          <strong>Fórmula:</strong> Taxa de Comparecimento = (Reuniões Realizadas ÷ Reuniões Elegíveis) × 100.
          Reuniões com data futura são estritamente <em>desconsideradas</em> do denominador para não distorcer negativamente os indicadores. Reuniões canceladas ou com ausência do lead (No-Show) são encaminhadas automaticamente para a esteira de tarefas de recuperação do SDR.
        </p>
      </div>

      {/* Tabela de Reuniões por SDR */}
      <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide border-b border-[#d1d5d6]/50 pb-3">
          Conversão e Comparecimento por SDR
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#d1d5d6] bg-[#f8fafb] text-[#14262d] font-semibold">
                <th className="py-3 px-3">SDR</th>
                <th className="py-3 px-3 text-center">Agendadas</th>
                <th className="py-3 px-3 text-center">Realizadas</th>
                <th className="py-3 px-3 text-center">Canceladas</th>
                <th className="py-3 px-3 text-center">No-Shows</th>
                <th className="py-3 px-3 text-center">Taxa de Comparecimento</th>
                <th className="py-3 px-3 text-center">Meta Agendamento</th>
                <th className="py-3 px-3 text-center">% Meta Atingida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1d5d6]/50">
              {sdrs.map((sdr) => {
                const sdrMeetings = meetings.filter(m => m.ownerId === sdr.id);
                const sHeld = sdrMeetings.filter(m => m.status === 'HELD').length;
                const sCancelled = sdrMeetings.filter(m => m.status === 'CANCELLED').length;
                const sNoShow = sdrMeetings.filter(m => m.status === 'NO_SHOW').length;
                const sEligible = sHeld + sCancelled + sNoShow;
                const sRate = sEligible > 0 ? Math.round((sHeld / sEligible) * 100) : 0;
                const g = store.getSdrGoal(sdr.id);
                const dailyGoal = g?.dailyScheduledMeetings || 4;
                const bookedD0 = sdrMeetings.filter(m => m.bookedAt === '2026-10-21').length;
                const attainment = Math.round((bookedD0 / dailyGoal) * 100);

                return (
                  <tr key={sdr.id} className="hover:bg-[#f8fafb]">
                    <td className="py-3 px-3 font-medium text-[#14262d]">
                      <p className="font-semibold">{sdr.name}</p>
                      <p className="text-[10px] text-[#6a797c]">{sdr.scope}</p>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{sdrMeetings.length}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">{sHeld}</td>
                    <td className="py-3 px-3 text-center font-mono text-amber-600">{sCancelled}</td>
                    <td className="py-3 px-3 text-center font-mono text-rose-600">{sNoShow}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-[#14262d]">{sRate}%</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{dailyGoal}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">
                      {attainment}%
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
