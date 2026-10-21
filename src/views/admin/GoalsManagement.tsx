import React, { useState, useEffect } from 'react';
import { 
  Target, Shield, Check, AlertCircle, Save, RotateCcw, 
  HelpCircle, Eye, Users, Calendar, ArrowRight, Sparkles 
} from 'lucide-react';
import { Goal, SdrScope, User } from '../../types';
import { store } from '../../services/store';

interface SdrGoalDraft {
  sdrId: string;
  sdrName: string;
  scope: SdrScope;
  daily: number;
  weekly: number;
  monthly: number;
  expectedAttendanceRatePercent: number;
  validFrom: string;
  validUntil: string;
  notes: string;
}

export const GoalsManagement: React.FC = () => {
  const [teamDaily, setTeamDaily] = useState<number>(14);
  const [teamWeekly, setTeamWeekly] = useState<number>(70);
  const [teamMonthly, setTeamMonthly] = useState<number>(280);
  const [teamAttendance, setTeamAttendance] = useState<number>(75);
  const [teamValidFrom, setTeamValidFrom] = useState<string>('2026-10-01');
  const [teamValidUntil, setTeamValidUntil] = useState<string>('2026-10-31');
  const [teamNotes, setTeamNotes] = useState<string>('Meta comercial oficial estabelecida pela diretoria para o mês de outubro/2026.');

  const [sdrDrafts, setSdrDrafts] = useState<SdrGoalDraft[]>([]);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [previewSdrId, setPreviewSdrId] = useState<string>('user-sdr-1');

  const availableScopes: SdrScope[] = [
    'Inbound Qualificação',
    'Outbound Prospecção',
    'Enterprise / Contas Estratégicas',
    'Mid-Market',
    'Recuperação & Reengajamento',
  ];

  const loadData = () => {
    const teamGoal = store.getTeamGoal();
    setTeamDaily(teamGoal.dailyScheduledMeetings || 14);
    setTeamWeekly(teamGoal.weeklyScheduledMeetings || 70);
    setTeamMonthly(teamGoal.monthlyScheduledMeetings || 280);
    setTeamAttendance(teamGoal.expectedAttendanceRatePercent || 75);
    setTeamValidFrom(teamGoal.validFrom || '2026-10-01');
    setTeamValidUntil(teamGoal.validUntil || '2026-10-31');
    setTeamNotes(teamGoal.notes || '');

    const sdrs = store.getSdrUsers();
    const drafts: SdrGoalDraft[] = sdrs.map((sdr) => {
      const g = store.getSdrGoal(sdr.id);
      return {
        sdrId: sdr.id,
        sdrName: sdr.name,
        scope: sdr.scope || 'Outbound Prospecção',
        daily: g?.dailyScheduledMeetings || 4,
        weekly: g?.weeklyScheduledMeetings || 20,
        monthly: g?.monthlyScheduledMeetings || 80,
        expectedAttendanceRatePercent: g?.expectedAttendanceRatePercent || 75,
        validFrom: g?.validFrom || '2026-10-01',
        validUntil: g?.validUntil || '2026-10-31',
        notes: g?.notes || '',
      };
    });
    setSdrDrafts(drafts);
    if (drafts.length > 0) {
      setPreviewSdrId(drafts[0].sdrId);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateSdrDraft = (sdrId: string, field: keyof SdrGoalDraft, value: any) => {
    setSdrDrafts((prev) =>
      prev.map((d) => (d.sdrId === sdrId ? { ...d, [field]: value } : d))
    );
  };

  const sumSdrDailyGoals = sdrDrafts.reduce((acc, d) => acc + (Number(d.daily) || 0), 0);
  const isSumConsistent = sumSdrDailyGoals === teamDaily;

  const handleSaveAll = () => {
    store.saveTeamAndSdrGoals(
      {
        dailyScheduledMeetings: Number(teamDaily),
        weeklyScheduledMeetings: Number(teamWeekly),
        monthlyScheduledMeetings: Number(teamMonthly),
        expectedAttendanceRatePercent: Number(teamAttendance),
        validFrom: teamValidFrom,
        validUntil: teamValidUntil,
        notes: teamNotes,
      },
      sdrDrafts.map((d) => ({
        sdrId: d.sdrId,
        scope: d.scope,
        daily: Number(d.daily),
        weekly: Number(d.weekly),
        monthly: Number(d.monthly),
        expectedAttendanceRatePercent: Number(d.expectedAttendanceRatePercent),
        validFrom: d.validFrom,
        validUntil: d.validUntil,
        notes: d.notes,
      }))
    );

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const previewDraft = sdrDrafts.find((d) => d.sdrId === previewSdrId);
  const previewKpi = previewDraft ? store.getSdrKpiSummary(previewDraft.sdrId) : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="bg-white p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#14262d] text-[#d1d5d6]">
              <Target className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#14262d] tracking-tight">
                Gestão de Metas e Escopos da Equipe
              </h2>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Defina como Administrador as metas da equipe e o escopo de atuação de cada SDR/BDR. A equipe visualiza essas diretrizes em tempo real.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#d1d5d6] text-[#6a797c] hover:bg-[#f8fafb] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Descartar Alterações</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-[#14262d] text-white hover:bg-[#1c3640] shadow-sm transition-all"
          >
            <Save className="w-4 h-4 text-[#d1d5d6]" />
            <span>Salvar Metas e Escopos</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">
              Metas e escopos atualizados com sucesso no sistema e sincronizados com os painéis dos SDRs!
            </span>
          </div>
          <span className="text-[11px] text-emerald-600">Registro de auditoria gravado</span>
        </div>
      )}

      {/* Coherence KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
          <p className="text-[11px] font-semibold text-[#6a797c] uppercase tracking-wider">Meta Diária da Equipe</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#14262d]">{teamDaily}</span>
            <span className="text-xs text-[#6a797c]">reuniões/dia</span>
          </div>
          <p className="text-[11px] text-[#6a797c] mt-1">Consolidado da operação Welucci</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
          <p className="text-[11px] font-semibold text-[#6a797c] uppercase tracking-wider">Soma dos SDRs</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#14262d]">{sumSdrDailyGoals}</span>
            <span className="text-xs text-[#6a797c]">reuniões/dia</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {isSumConsistent ? (
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Metas 100% balanceadas
              </span>
            ) : (
              <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Diferença de {Math.abs(teamDaily - sumSdrDailyGoals)} reunião(ões)
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
          <p className="text-[11px] font-semibold text-[#6a797c] uppercase tracking-wider">Meta Semanal</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#14262d]">{teamWeekly}</span>
            <span className="text-xs text-[#6a797c]">agendamentos</span>
          </div>
          <p className="text-[11px] text-[#6a797c] mt-1">5 dias úteis de prospecção</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
          <p className="text-[11px] font-semibold text-[#6a797c] uppercase tracking-wider">Taxa de Comparecimento</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#14262d]">{teamAttendance}%</span>
            <span className="text-xs text-[#6a797c]">mínimo esperado</span>
          </div>
          <p className="text-[11px] text-[#6a797c] mt-1">Reuniões realizadas / agendadas</p>
        </div>
      </div>

      {/* SECTION 1: Meta Geral da Equipe */}
      <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#d1d5d6]/50 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#14262d]" />
            <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
              1. Meta Consolidada da Equipe Welucci
            </h3>
          </div>
          <span className="text-xs text-[#6a797c]">
            Aplicável a todos os SDRs e exibida nos painéis consolidados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#14262d] mb-1">
              Meta Diária da Equipe (Agendamentos D0)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={teamDaily}
                onChange={(e) => setTeamDaily(Number(e.target.value))}
                className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[#14262d] focus:outline-none focus:border-[#14262d]"
              />
              <span className="absolute right-3 top-2.5 text-xs text-[#6a797c]">reuniões</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14262d] mb-1">
              Meta Semanal da Equipe
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={teamWeekly}
                onChange={(e) => setTeamWeekly(Number(e.target.value))}
                className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[#14262d] focus:outline-none focus:border-[#14262d]"
              />
              <span className="absolute right-3 top-2.5 text-xs text-[#6a797c]">reuniões</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14262d] mb-1">
              Meta Mensal da Equipe
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={teamMonthly}
                onChange={(e) => setTeamMonthly(Number(e.target.value))}
                className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[#14262d] focus:outline-none focus:border-[#14262d]"
              />
              <span className="absolute right-3 top-2.5 text-xs text-[#6a797c]">reuniões</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14262d] mb-1">
              Meta Comparecimento / Realizadas (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                value={teamAttendance}
                onChange={(e) => setTeamAttendance(Number(e.target.value))}
                className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[#14262d] focus:outline-none focus:border-[#14262d]"
              />
              <span className="absolute right-3 top-2.5 text-xs text-[#6a797c]">%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[#14262d] mb-1">
              Data de Início da Vigência
            </label>
            <input
              type="date"
              value={teamValidFrom}
              onChange={(e) => setTeamValidFrom(e.target.value)}
              className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg px-3 py-2 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14262d] mb-1">
              Data de Término da Vigência
            </label>
            <input
              type="date"
              value={teamValidUntil}
              onChange={(e) => setTeamValidUntil(e.target.value)}
              className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg px-3 py-2 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14262d] mb-1">
              Instruções Gerais para a Equipe
            </label>
            <input
              type="text"
              value={teamNotes}
              onChange={(e) => setTeamNotes(e.target.value)}
              placeholder="Ex: Foco em cadências de follow-up e redução de No-Shows..."
              className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg px-3 py-2 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d]"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Metas e Escopos Individuais por SDR/BDR */}
      <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#d1d5d6]/50 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#14262d]" />
            <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
              2. Metas Individuais e Escopos de Atuação por SDR/BDR
            </h3>
          </div>
          <span className="text-xs text-[#6a797c]">
            Cada SDR/BDR visualiza exclusivamente suas próprias metas e escopos atribuídos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#d1d5d6] bg-[#f8fafb] text-[#14262d] font-semibold">
                <th className="py-3 px-3">SDR / BDR</th>
                <th className="py-3 px-3">Escopo de Atuação (Especialidade)</th>
                <th className="py-3 px-3 text-center">Meta Diária (D0)</th>
                <th className="py-3 px-3 text-center">Meta Semanal</th>
                <th className="py-3 px-3 text-center">Meta Mensal</th>
                <th className="py-3 px-3 text-center">Comparecimento (%)</th>
                <th className="py-3 px-3">Diretriz Estratégica do Escopo</th>
                <th className="py-3 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1d5d6]/50">
              {sdrDrafts.map((draft) => (
                <tr key={draft.sdrId} className="hover:bg-[#f8fafb]/80 transition-colors">
                  <td className="py-3 px-3 font-medium text-[#14262d]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#14262d] text-white flex items-center justify-center font-bold text-[10px]">
                        {draft.sdrName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-[#14262d]">{draft.sdrName}</p>
                        <p className="text-[10px] text-[#6a797c]">Expediente 09h às 19h</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <select
                      value={draft.scope}
                      onChange={(e) => handleUpdateSdrDraft(draft.sdrId, 'scope', e.target.value as SdrScope)}
                      className="bg-white border border-[#d1d5d6] text-[#14262d] text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#14262d] font-medium"
                    >
                      {availableScopes.map((scope) => (
                        <option key={scope} value={scope}>
                          {scope}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={draft.daily}
                      onChange={(e) => handleUpdateSdrDraft(draft.sdrId, 'daily', Number(e.target.value))}
                      className="w-16 text-center bg-white border border-[#d1d5d6] rounded-md py-1.5 font-mono font-bold text-[#14262d] focus:outline-none focus:border-[#14262d]"
                    />
                  </td>

                  <td className="py-3 px-3 text-center">
                    <input
                      type="number"
                      min="1"
                      value={draft.weekly}
                      onChange={(e) => handleUpdateSdrDraft(draft.sdrId, 'weekly', Number(e.target.value))}
                      className="w-16 text-center bg-white border border-[#d1d5d6] rounded-md py-1.5 font-mono text-[#14262d] focus:outline-none focus:border-[#14262d]"
                    />
                  </td>

                  <td className="py-3 px-3 text-center">
                    <input
                      type="number"
                      min="1"
                      value={draft.monthly}
                      onChange={(e) => handleUpdateSdrDraft(draft.sdrId, 'monthly', Number(e.target.value))}
                      className="w-20 text-center bg-white border border-[#d1d5d6] rounded-md py-1.5 font-mono text-[#14262d] focus:outline-none focus:border-[#14262d]"
                    />
                  </td>

                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={draft.expectedAttendanceRatePercent}
                        onChange={(e) => handleUpdateSdrDraft(draft.sdrId, 'expectedAttendanceRatePercent', Number(e.target.value))}
                        className="w-16 text-center bg-white border border-[#d1d5d6] rounded-md py-1.5 font-mono text-[#14262d] focus:outline-none focus:border-[#14262d]"
                      />
                      <span className="text-[#6a797c] font-medium">%</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <input
                      type="text"
                      value={draft.notes}
                      onChange={(e) => handleUpdateSdrDraft(draft.sdrId, 'notes', e.target.value)}
                      placeholder="Instruções para o SDR..."
                      className="w-full bg-white border border-[#d1d5d6] rounded-md px-2.5 py-1.5 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d]"
                    />
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setPreviewSdrId(draft.sdrId)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                        previewSdrId === draft.sdrId
                          ? 'bg-[#14262d] text-white font-medium'
                          : 'text-[#6a797c] hover:text-[#14262d] hover:bg-[#f8fafb]'
                      }`}
                    >
                      Visualizar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Preview em Tempo Real de Como o SDR Enxerga */}
      {previewDraft && previewKpi && (
        <div className="bg-[#14262d] text-white rounded-xl p-6 shadow-md border border-[#1e343c]">
          <div className="flex items-center justify-between border-b border-[#1e343c] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#d1d5d6]" />
              <h4 className="text-sm font-semibold tracking-wide text-white">
                Simulação em Tempo Real: Painel do SDR ({previewDraft.sdrName})
              </h4>
            </div>
            <span className="text-xs text-[#d1d5d6]/70">
              Escopo definido pelo Gestor: <strong className="text-white">{previewDraft.scope}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0e1d23] p-4 rounded-lg border border-[#1e343c]">
              <span className="text-[11px] text-[#d1d5d6]/80 font-medium uppercase">Meta Diária (D0)</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">{previewDraft.daily}</p>
              <p className="text-[11px] text-[#6a797c] mt-1">Definida pelo Administrador</p>
            </div>

            <div className="bg-[#0e1d23] p-4 rounded-lg border border-[#1e343c]">
              <span className="text-[11px] text-[#d1d5d6]/80 font-medium uppercase">Agendamentos D0 Hoje</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">{previewKpi.bookedTodayCount}</p>
              <p className="text-[11px] text-emerald-400 mt-1">Reuniões válidas criadas hoje</p>
            </div>

            <div className="bg-[#0e1d23] p-4 rounded-lg border border-[#1e343c]">
              <span className="text-[11px] text-[#d1d5d6]/80 font-medium uppercase">GAP D0 Faltante</span>
              <p className={`text-2xl font-bold font-mono mt-1 ${previewKpi.gapD0 > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {previewKpi.gapD0}
              </p>
              <p className="text-[11px] text-[#6a797c] mt-1">
                {previewKpi.gapD0 > 0 ? `Ritmo: ${previewKpi.paceRequiredPerHour}/h útil` : 'Meta do dia atingida!'}
              </p>
            </div>

            <div className="bg-[#0e1d23] p-4 rounded-lg border border-[#1e343c]">
              <span className="text-[11px] text-[#d1d5d6]/80 font-medium uppercase">Atingimento da Meta</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">{previewKpi.attainmentPercent}%</p>
              <div className="w-full bg-[#1e343c] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, previewKpi.attainmentPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {previewDraft.notes && (
            <div className="mt-4 p-3 bg-[#0e1d23]/60 rounded-lg border border-[#1e343c] text-xs text-[#d1d5d6]">
              <strong className="text-amber-300">Mensagem da Gestão para {previewDraft.sdrName}: </strong>
              {previewDraft.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
