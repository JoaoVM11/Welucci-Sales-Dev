import React from 'react';
import { Target, Shield, CheckCircle2, AlertCircle, ArrowUpRight, Calendar, Users } from 'lucide-react';
import { User } from '../../types';
import { store } from '../../services/store';

interface SdrGoalsProps {
  currentUser: User;
}

export const SdrGoals: React.FC<SdrGoalsProps> = ({ currentUser }) => {
  const kpi = store.getSdrKpiSummary(currentUser.id);
  const sdrGoal = store.getSdrGoal(currentUser.id);
  const teamGoal = store.getTeamGoal();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#14262d] text-[#d1d5d6]">
              <Target className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#14262d] tracking-tight">
                Minhas Metas & Escopo Definido
              </h2>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Diretrizes estabelecidas pela liderança comercial para seu perfil de atuação na operação Welucci.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#6a797c] bg-[#f8fafb] px-3 py-1.5 rounded-lg border border-[#d1d5d6]">
          <Calendar className="w-3.5 h-3.5" />
          <span>Vigência: <strong>{sdrGoal?.validFrom || '01/10/2026'} a {sdrGoal?.validUntil || '31/10/2026'}</strong></span>
        </div>
      </div>

      {/* Scope Card */}
      <div className="bg-[#14262d] text-white p-6 rounded-xl border border-[#1e343c] shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e343c] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Escopo de Atuação Atribuído pela Gestão
            </h3>
          </div>
          <span className="text-xs text-[#d1d5d6]/80 font-mono">
            Atualizado por: {sdrGoal?.updatedBy || 'Renan Rocha (Gestor)'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0e1d23] p-4 rounded-lg border border-[#1e343c]">
            <span className="text-[11px] text-[#6a797c] font-semibold uppercase">Especialidade / Foco</span>
            <p className="text-lg font-bold text-white mt-1">{currentUser.scope || 'Prospecção Geral'}</p>
          </div>

          <div className="bg-[#0e1d23] p-4 rounded-lg border border-[#1e343c]">
            <span className="text-[11px] text-[#6a797c] font-semibold uppercase">Expediente Oficial</span>
            <p className="text-lg font-bold text-white mt-1 font-mono">09:00 às 19:00 (Seg a Sex)</p>
          </div>

          <div className="bg-[#0e1d23] p-4 rounded-lg border border-[#1e343c]">
            <span className="text-[11px] text-[#6a797c] font-semibold uppercase">Contribuição na Equipe</span>
            <p className="text-lg font-bold text-white mt-1 font-mono">
              {kpi.dailyGoal} de {teamGoal.dailyScheduledMeetings} ({Math.round((kpi.dailyGoal / teamGoal.dailyScheduledMeetings) * 100)}%)
            </p>
          </div>
        </div>

        {sdrGoal?.notes && (
          <div className="p-3 bg-[#0e1d23]/80 rounded-lg border border-[#1e343c] text-xs text-[#d1d5d6]">
            <strong className="text-amber-300">Instruções Estratégicas da Liderança: </strong>
            {sdrGoal.notes}
          </div>
        )}
      </div>

      {/* Target Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Meta Diária */}
        <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#d1d5d6]/40 pb-2.5">
            <span className="text-xs font-bold uppercase text-[#14262d]">Meta Diária (D0)</span>
            <span className="text-xs font-mono font-bold text-emerald-600">{kpi.attainmentPercent}%</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[#14262d]">{kpi.bookedTodayCount}</span>
            <span className="text-xs text-[#6a797c]">de {kpi.dailyGoal} agendamentos</span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, kpi.attainmentPercent)}%` }}
            />
          </div>

          <p className="text-[11px] text-[#6a797c]">
            {kpi.gapD0 > 0 ? `Faltam ${kpi.gapD0} agendamento(s) hoje.` : 'Parabéns, meta diária atingida!'}
          </p>
        </div>

        {/* Meta Semanal */}
        <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#d1d5d6]/40 pb-2.5">
            <span className="text-xs font-bold uppercase text-[#14262d]">Meta Semanal</span>
            <span className="text-xs font-mono font-bold text-blue-600">5 dias úteis</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[#14262d]">{sdrGoal?.weeklyScheduledMeetings || 20}</span>
            <span className="text-xs text-[#6a797c]">reuniões</span>
          </div>

          <p className="text-[11px] text-[#6a797c]">
            Base de cálculo: {(sdrGoal?.weeklyScheduledMeetings || 20) / 5} agendamentos por dia útil.
          </p>
        </div>

        {/* Meta Mensal */}
        <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#d1d5d6]/40 pb-2.5">
            <span className="text-xs font-bold uppercase text-[#14262d]">Meta Mensal</span>
            <span className="text-xs font-mono font-bold text-purple-600">Outubro/2026</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[#14262d]">{sdrGoal?.monthlyScheduledMeetings || 80}</span>
            <span className="text-xs text-[#6a797c]">reuniões agendadas</span>
          </div>

          <p className="text-[11px] text-[#6a797c]">
            Meta de comparecimento esperada: <strong>{sdrGoal?.expectedAttendanceRatePercent || 75}%</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
