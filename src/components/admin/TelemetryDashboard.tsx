import React, { useState } from 'react';
import { 
  PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, 
  Clock, Zap, Calendar, User, Users, CheckCircle2, 
  AlertTriangle, Filter, ChevronRight, ArrowUpRight, 
  Flame, BarChart3, TrendingUp, Sparkles, AlertCircle, 
  HelpCircle, Timer, ShieldCheck, Check, Search, CalendarCheck2
} from 'lucide-react';
import { store } from '../../services/store';
import { CallOutcome, CallRecord } from '../../types';

interface TelemetryDashboardProps {
  embedded?: boolean; // When true, fits seamlessly inside AdminOverview
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({ embedded = false }) => {
  // Active Tab inside Telemetry
  const [activeTab, setActiveTab] = useState<'CALLS' | 'SPEED_TO_LEAD' | 'TASKS_CADENCE'>('CALLS');
  const [sdrFilter, setSdrFilter] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sdrs = store.getSdrUsers();
  const summary = store.getAdminTelemetrySummary(sdrFilter !== 'ALL' ? sdrFilter : undefined);
  const callRecords = store.getCallRecords({ 
    sdrId: sdrFilter !== 'ALL' ? sdrFilter : undefined,
    outcome: outcomeFilter !== 'ALL' ? outcomeFilter : undefined,
  });
  const speedItems = store.getLeadScheduleSpeedItems({
    sdrId: sdrFilter !== 'ALL' ? sdrFilter : undefined,
  });
  const cadenceRelations = store.getLeadTaskCadenceRelations({
    sdrId: sdrFilter !== 'ALL' ? sdrFilter : undefined,
  });

  const filteredCalls = callRecords.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.contactName.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q) ||
      c.contactPhone.includes(q) ||
      c.notes?.toLowerCase().includes(q)
    );
  });

  const filteredSpeed = speedItems.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.contactName.toLowerCase().includes(q) ||
      s.companyName.toLowerCase().includes(q)
    );
  });

  const filteredCadence = cadenceRelations.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.contactName.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q)
    );
  });

  const getOutcomeBadgeStyle = (outcome: CallOutcome) => {
    switch (outcome) {
      case 'CONNECTED_SCHEDULED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      case 'CONNECTED_FOLLOWUP':
        return 'bg-sky-50 text-sky-800 border-sky-300';
      case 'CONNECTED_NO_FIT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'NO_ANSWER':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'VOICEMAIL':
        return 'bg-orange-50 text-orange-800 border-orange-300';
      case 'BUSY_REJECTED':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      case 'INVALID_NUMBER':
        return 'bg-red-100 text-red-900 border-red-300 font-semibold';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className={`space-y-6 ${embedded ? '' : 'p-4 sm:p-6 max-w-7xl mx-auto'}`}>
      {/* Header Container */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 sm:p-2.5 rounded-lg bg-[#14262d] text-white shrink-0">
              <PhoneCall className="w-5 h-5 text-amber-300" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#14262d] tracking-tight">
                  Telemetria Avançada da Gestão Comercial
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                  Tempo Real
                </span>
              </div>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Volume de ligações (atendidas vs discadas e desfechos), relação de tempo para agendar desde a chegada do lead e análise de tarefas por data de criação.
              </p>
            </div>
          </div>
        </div>

        {/* Global SDR Filter */}
        <div className="flex items-center gap-2 bg-[#f8fafb] px-3 py-1.5 rounded-lg border border-[#d1d5d6] text-xs">
          <Filter className="w-3.5 h-3.5 text-[#6a797c]" />
          <span className="font-semibold text-[#14262d]">Filtrar SDR:</span>
          <select
            value={sdrFilter}
            onChange={(e) => setSdrFilter(e.target.value)}
            className="bg-transparent font-semibold text-[#14262d] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Toda a Equipe ({sdrs.length} SDRs)</option>
            {sdrs.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.scope})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3 Main Functional Tabs */}
      <div className="flex flex-wrap border-b border-[#d1d5d6] gap-2 sm:gap-3">
        <button
          onClick={() => setActiveTab('CALLS')}
          className={`flex items-center gap-2 px-4 py-2.5 sm:py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'CALLS'
              ? 'border-[#14262d] text-[#14262d] bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-[#6a797c] hover:text-[#14262d]'
          }`}
        >
          <PhoneCall className={`w-4 h-4 ${activeTab === 'CALLS' ? 'text-amber-500' : ''}`} />
          <span>Volume de Chamadas (Atendidas x Discadas)</span>
          <span className="text-[10px] bg-slate-100 text-[#6a797c] px-2 py-0.5 rounded-full font-mono font-normal">
            {summary.totalCallsDialed}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SPEED_TO_LEAD')}
          className={`flex items-center gap-2 px-4 py-2.5 sm:py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'SPEED_TO_LEAD'
              ? 'border-[#14262d] text-[#14262d] bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-[#6a797c] hover:text-[#14262d]'
          }`}
        >
          <Timer className={`w-4 h-4 ${activeTab === 'SPEED_TO_LEAD' ? 'text-amber-500' : ''}`} />
          <span>Tempo para Agendar (Desde a Chegada)</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-semibold">
            {summary.avgTimeToScheduleFormatted} méd.
          </span>
        </button>

        <button
          onClick={() => setActiveTab('TASKS_CADENCE')}
          className={`flex items-center gap-2 px-4 py-2.5 sm:py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'TASKS_CADENCE'
              ? 'border-[#14262d] text-[#14262d] bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-[#6a797c] hover:text-[#14262d]'
          }`}
        >
          <BarChart3 className={`w-4 h-4 ${activeTab === 'TASKS_CADENCE' ? 'text-amber-500' : ''}`} />
          <span>Tarefas vs Data de Criação do Lead</span>
          <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-mono font-semibold">
            SLA {summary.avgFirstTouchSlaMinutes}m
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* ABA 1: VOLUME DE CHAMADAS, ATENDIDAS X DISCADAS & DESFECHOS */}
      {/* ======================================================== */}
      {activeTab === 'CALLS' && (
        <div className="space-y-6">
          {/* KPI Ribbon de Chamadas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Total Discadas */}
            <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider block">
                Total Discadas
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#14262d]">{summary.totalCallsDialed}</span>
                <span className="text-xs text-[#6a797c]">ligações</span>
              </div>
              <p className="text-[11px] text-[#6a797c]">Tentativas de contato ativas</p>
            </div>

            {/* Total Atendidas */}
            <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider block">
                Atendidas (Conectadas)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-600">{summary.totalCallsConnected}</span>
                <span className="text-xs text-emerald-700 font-semibold">conversa real</span>
              </div>
              <p className="text-[11px] text-[#6a797c]">Decisores que atenderam a ligação</p>
            </div>

            {/* Taxa de Atendimento / Conexão */}
            <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider block">
                Atendidas x Discadas
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#14262d]">{summary.connectRatePercent}%</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  {summary.connectRatePercent >= 40 ? 'Alta Conexão' : 'Normal'}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, summary.connectRatePercent)}%` }}
                />
              </div>
            </div>

            {/* Reuniões Agendadas via Chamada */}
            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs space-y-1 bg-gradient-to-br from-white to-emerald-50/30">
              <span className="text-[11px] font-bold uppercase text-emerald-900 tracking-wider block">
                Agendadas na Chamada
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-700">{summary.callsScheduledCount}</span>
                <span className="text-xs text-emerald-800 font-semibold">reuniões marcadas</span>
              </div>
              <p className="text-[11px] text-emerald-700">Conversão de {summary.totalCallsConnected > 0 ? Math.round((summary.callsScheduledCount / summary.totalCallsConnected) * 100) : 0}% das atendidas</p>
            </div>

            {/* Tempo Falado */}
            <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider block">
                Tempo Total Falado
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#14262d]">{summary.totalTalkTimeMinutes}m</span>
                <span className="text-xs text-[#6a797c]">~{Math.floor(summary.avgTalkTimeSeconds / 60)}m {summary.avgTalkTimeSeconds % 60}s / call</span>
              </div>
              <p className="text-[11px] text-[#6a797c]">Tempo líquido de conversa</p>
            </div>
          </div>

          {/* Gráfico Visual: Distribuição de Desfechos e Resultados da Chamada */}
          <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#d1d5d6]/50 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
                  Resultado e Desfecho das Chamadas Telefônicas
                </h3>
                <p className="text-xs text-[#6a797c] mt-0.5">
                  Classificação das {summary.totalCallsDialed} ligações registradas entre conversas produtivas, follow-ups e tentativas não atendidas.
                </p>
              </div>
              <span className="text-xs font-mono text-[#14262d] bg-[#f8fafb] px-3 py-1 rounded-md border border-[#d1d5d6]">
                Conectadas: <strong>{summary.totalCallsConnected}</strong> ({summary.connectRatePercent}%) · Não Atendidas: <strong>{summary.totalCallsDialed - summary.totalCallsConnected}</strong>
              </span>
            </div>

            {/* Barras de Desfecho */}
            <div className="space-y-3">
              {summary.outcomesBreakdown.map((item) => (
                <div key={item.outcome} className="space-y-1 p-2.5 rounded-lg bg-[#f8fafb]/60 border border-[#d1d5d6]/40 hover:bg-[#f8fafb] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        item.outcome === 'CONNECTED_SCHEDULED' ? 'bg-emerald-500' :
                        item.outcome === 'CONNECTED_FOLLOWUP' ? 'bg-sky-500' :
                        item.outcome === 'CONNECTED_NO_FIT' ? 'bg-slate-400' :
                        item.outcome === 'NO_ANSWER' ? 'bg-amber-500' :
                        item.outcome === 'VOICEMAIL' ? 'bg-orange-500' :
                        item.outcome === 'BUSY_REJECTED' ? 'bg-rose-500' : 'bg-red-600'
                      }`} />
                      <span className="font-semibold text-[#14262d]">{item.label}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        item.isConnected ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {item.isConnected ? 'Conectada' : 'Não Conectou'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-[#14262d] font-bold">{item.count} ligações</span>
                      <span className="text-[#6a797c]">({item.percent}%)</span>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.outcome === 'CONNECTED_SCHEDULED' ? 'bg-emerald-500' :
                        item.outcome === 'CONNECTED_FOLLOWUP' ? 'bg-sky-500' :
                        item.outcome === 'CONNECTED_NO_FIT' ? 'bg-slate-400' :
                        item.outcome === 'NO_ANSWER' ? 'bg-amber-500' :
                        item.outcome === 'VOICEMAIL' ? 'bg-orange-500' :
                        item.outcome === 'BUSY_REJECTED' ? 'bg-rose-500' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.max(3, item.percent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabela de SDR: Comparativo de Discagem */}
          <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-4 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide border-b border-[#d1d5d6]/50 pb-3">
              Performance de Chamadas por SDR
            </h3>

            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#d1d5d6] bg-[#f8fafb] text-[#14262d] font-semibold">
                    <th className="py-3 px-3">SDR & Especialidade</th>
                    <th className="py-3 px-3 text-center">Discadas</th>
                    <th className="py-3 px-3 text-center">Atendidas</th>
                    <th className="py-3 px-3 text-center">Taxa de Conexão</th>
                    <th className="py-3 px-3 text-center">Agendadas via Call</th>
                    <th className="py-3 px-3 text-center">Conversão Call ➔ Reunião</th>
                    <th className="py-3 px-3 text-center">Tempo Médio/Call</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1d5d6]/50">
                  {sdrs.map(sdr => {
                    const sdrCalls = store.getCallRecords({ sdrId: sdr.id });
                    const dialed = sdrCalls.length;
                    const connected = sdrCalls.filter(c => c.status === 'CONNECTED').length;
                    const connRate = dialed > 0 ? Math.round((connected / dialed) * 100) : 0;
                    const scheduled = sdrCalls.filter(c => c.outcome === 'CONNECTED_SCHEDULED').length;
                    const schedRate = connected > 0 ? Math.round((scheduled / connected) * 100) : 0;
                    const totalSecs = sdrCalls.filter(c => c.status === 'CONNECTED').reduce((a, b) => a + b.durationSeconds, 0);
                    const avgSecs = connected > 0 ? Math.round(totalSecs / connected) : 0;

                    return (
                      <tr key={sdr.id} className="hover:bg-[#f8fafb] transition-colors">
                        <td className="py-3 px-3 font-semibold text-[#14262d]">
                          <p>{sdr.name}</p>
                          <p className="text-[10px] text-[#6a797c] font-normal">{sdr.scope}</p>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-[#14262d]">{dialed}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">{connected}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-bold text-[#14262d]">{connRate}%</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">
                          {scheduled}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-600">
                          {schedRate}%
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[#6a797c]">
                          {Math.floor(avgSecs / 60)}m {avgSecs % 60}s
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Histórico Recente de Ligações */}
          <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d1d5d6]/50 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
                  Registro Individual de Ligações Executadas
                </h3>
                <p className="text-xs text-[#6a797c] mt-0.5">
                  Auditoria de contatos telefônicos com gravação e notas do SDR.
                </p>
              </div>

              {/* Filtro por Resultado */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={outcomeFilter}
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                  className="bg-[#f8fafb] border border-[#d1d5d6] rounded-md px-2.5 py-1 text-xs text-[#14262d] font-semibold"
                >
                  <option value="ALL">Todos os Desfechos</option>
                  <option value="CONNECTED_SCHEDULED">Agendadas</option>
                  <option value="CONNECTED_FOLLOWUP">Follow-up</option>
                  <option value="CONNECTED_NO_FIT">Sem Perfil</option>
                  <option value="NO_ANSWER">Não Atende</option>
                  <option value="VOICEMAIL">Caixa Postal</option>
                  <option value="BUSY_REJECTED">Ocupado/Recusada</option>
                </select>

                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar lead ou empresa..."
                    className="bg-[#f8fafb] border border-[#d1d5d6] rounded-md px-3 py-1 text-xs text-[#14262d] w-48 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#d1d5d6] bg-[#f8fafb] text-[#14262d] font-semibold">
                    <th className="py-2.5 px-3">Lead / Empresa</th>
                    <th className="py-2.5 px-3">Telefone</th>
                    <th className="py-2.5 px-3">SDR</th>
                    <th className="py-2.5 px-3 text-center">Horário</th>
                    <th className="py-2.5 px-3 text-center">Duração</th>
                    <th className="py-2.5 px-3">Resultado da Chamada</th>
                    <th className="py-2.5 px-3">Notas Operacionais</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1d5d6]/50">
                  {filteredCalls.map(c => (
                    <tr key={c.id} className="hover:bg-[#f8fafb] transition-colors">
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-[#14262d]">{c.contactName}</p>
                        <p className="text-[10px] text-[#6a797c]">{c.companyName}</p>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#14262d]">
                        {c.contactPhone}
                      </td>
                      <td className="py-2.5 px-3 text-[#14262d] font-medium">
                        {c.sdrName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#6a797c]">
                        {new Date(c.calledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {c.durationSeconds > 0 ? `${Math.floor(c.durationSeconds / 60)}m ${c.durationSeconds % 60}s` : '0s'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded border inline-block ${getOutcomeBadgeStyle(c.outcome)}`}>
                          {c.outcomeLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#6a797c] text-[11px] max-w-xs truncate" title={c.notes}>
                        {c.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: TEMPO PARA AGENDAR UM LEAD DESDE QUE ELE CHEGOU    */}
      {/* ======================================================== */}
      {activeTab === 'SPEED_TO_LEAD' && (
        <div className="space-y-6">
          {/* KPI Ribbon Speed to Lead */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider block">
                Tempo Médio até o Agendamento
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-700">{summary.avgTimeToScheduleFormatted}</span>
                <span className="text-xs text-[#6a797c]">da chegada ao agendamento</span>
              </div>
              <p className="text-[11px] text-[#6a797c]">Média ponderada da equipe</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider block">
                Mediana de Tempo
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#14262d]">{summary.medianTimeToScheduleMinutes}m</span>
                <span className="text-xs text-[#6a797c]">ponto central</span>
              </div>
              <p className="text-[11px] text-[#6a797c]">Elimina distorção de cadências longas</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-emerald-200 shadow-xs space-y-1 bg-gradient-to-br from-white to-emerald-50/30">
              <span className="text-[11px] font-bold uppercase text-emerald-900 tracking-wider block">
                Recorde de Velocidade (SLA Ouro)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-700">{summary.fastestTimeToScheduleFormatted}</span>
                <span className="text-xs text-emerald-800 font-semibold">agendamento relâmpago</span>
              </div>
              <p className="text-[11px] text-emerald-700">Lead atendido e qualificado imediatamente</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider block">
                Agendamentos no Dia 0 (Mesmo Dia)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#14262d]">62.5%</span>
                <span className="text-xs text-emerald-700 font-semibold">resolutividade D0</span>
              </div>
              <p className="text-[11px] text-[#6a797c]">Convertidos antes da virada do expediente</p>
            </div>
          </div>

          {/* Faixas de Distribuição de Velocidade */}
          <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-[#d1d5d6]/50 pb-3">
              <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
                Distribuição por Faixas de Tempo até o Agendamento
              </h3>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Quanto mais rápido o primeiro contato após a criação do lead, até 7x maior é a probabilidade de fechar a reunião.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {summary.speedDistribution.map((item) => (
                <div key={item.category} className="p-4 rounded-xl border border-[#d1d5d6]/70 bg-[#f8fafb]/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#14262d]">{item.label}</span>
                    <span className="text-xs font-mono font-bold text-[#14262d] bg-white px-2 py-0.5 rounded border border-[#d1d5d6]">
                      {item.count} leads ({item.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        item.category === 'SPEED_ULTRA_FAST' ? 'bg-emerald-500' :
                        item.category === 'SPEED_SAME_DAY' ? 'bg-sky-500' :
                        item.category === 'SPEED_NEXT_DAY' ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(5, item.percent)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#6a797c] leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabela Detalhada: Relação Chegada do Lead vs Data de Agendamento */}
          <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d1d5d6]/50 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
                  Rastreabilidade Individual: Da Entrada do Lead ao Agendamento
                </h3>
                <p className="text-xs text-[#6a797c] mt-0.5">
                  Tempo exato decorrido entre a geração do lead no CRM e o momento da marcação da reunião.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#d1d5d6] bg-[#f8fafb] text-[#14262d] font-semibold">
                    <th className="py-2.5 px-3">Lead & Empresa</th>
                    <th className="py-2.5 px-3">Canal de Origem</th>
                    <th className="py-2.5 px-3">SDR Responsável</th>
                    <th className="py-2.5 px-3 text-center">Data/Hora Chegada</th>
                    <th className="py-2.5 px-3 text-center">Data/Hora Agendado</th>
                    <th className="py-2.5 px-3 text-center">Tempo até Agendar</th>
                    <th className="py-2.5 px-3">Faixa de Velocidade</th>
                    <th className="py-2.5 px-3 text-center">Data da Reunião</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1d5d6]/50">
                  {filteredSpeed.map(s => (
                    <tr key={s.leadId} className="hover:bg-[#f8fafb] transition-colors">
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-[#14262d]">{s.contactName}</p>
                        <p className="text-[10px] text-[#6a797c]">{s.companyName}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-semibold bg-slate-100 text-[#14262d] px-2 py-0.5 rounded border border-slate-200">
                          {s.channel === 'INBOUND_FORM' ? 'Inbound Form' : 'Outbound Cadência'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#14262d] font-medium">
                        {s.sdrName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#6a797c]">
                        {new Date(s.leadCreatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {' '}
                        {new Date(s.leadCreatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#14262d] font-medium">
                        {new Date(s.scheduledAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {' '}
                        {new Date(s.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40">
                        {s.timeToScheduleFormatted}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded border inline-block ${
                          s.speedCategory === 'SPEED_ULTRA_FAST' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' :
                          s.speedCategory === 'SPEED_SAME_DAY' ? 'bg-sky-50 text-sky-800 border-sky-300 font-semibold' :
                          s.speedCategory === 'SPEED_NEXT_DAY' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {s.speedCategoryLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#14262d]">
                        {new Date(s.meetingDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {new Date(s.meetingDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 3: A RELAÇÃO DAS TAREFAS VS A DATA DE CRIAÇÃO DO LEAD */}
      {/* ======================================================== */}
      {activeTab === 'TASKS_CADENCE' && (
        <div className="space-y-6">
          {/* KPI Ribbon de Cadência vs Idade do Lead */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider block">
                SLA Médio do 1º Toque
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-700">{summary.avgFirstTouchSlaMinutes} min</span>
                <span className="text-xs text-emerald-800 font-semibold">Meta &lt; 15m</span>
              </div>
              <p className="text-[11px] text-[#6a797c]">Tempo da criação do lead até o 1º contato</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider block">
                Conformidade do SLA D0
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#14262d]">{summary.firstTouchSlaCompliancePercent}%</span>
                <span className="text-xs text-emerald-700 font-semibold">cumpridos</span>
              </div>
              <p className="text-[11px] text-[#6a797c]">Leads contatados na janela prioritária</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider block">
                Tarefas Executadas no D0
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#14262d]">
                  {summary.tasksByLeadAgeDistribution.find(d => d.ageBucket === 'D0')?.completedCount || 0}
                </span>
                <span className="text-xs text-[#6a797c]">toques imediatos</span>
              </div>
              <p className="text-[11px] text-[#6a797c]">Ações no mesmo dia de entrada do lead</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider block">
                Risco de Esfriamento (&gt; 48h)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-amber-600">2 leads</span>
                <span className="text-xs text-amber-700 font-semibold">requer follow-up</span>
              </div>
              <p className="text-[11px] text-[#6a797c]">Necessitam reengajamento ativo</p>
            </div>
          </div>

          {/* Distribuição de Tarefas por Idade do Lead (Buckets D0, D+1, D+2, D+3, D+5+) */}
          <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-[#d1d5d6]/50 pb-3">
              <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
                Volume de Tarefas por Idade do Lead (Dias de Vida no CRM)
              </h3>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Acompanhe como a cadência distribui tarefas entre o primeiro dia de chegada (D0) e os dias subsequentes de nutrição comercial.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {summary.tasksByLeadAgeDistribution.map(b => (
                <div key={b.ageBucket} className="p-3.5 rounded-xl border border-[#d1d5d6]/70 bg-[#f8fafb]/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#14262d]">{b.label}</span>
                    <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-[#d1d5d6]">
                      {b.leadsCount} leads
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-bold font-mono text-[#14262d]">{b.tasksCount}</span>
                    <span className="text-[11px] text-[#6a797c]">tarefas totais</span>
                  </div>

                  <div className="text-[11px] space-y-1 pt-1 border-t border-[#d1d5d6]/40">
                    <div className="flex justify-between text-emerald-700">
                      <span>Concluídas:</span>
                      <span className="font-mono font-bold">{b.completedCount}</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>Atrasadas:</span>
                      <span className="font-mono font-bold">{b.overdueCount}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#6a797c] pt-1">{b.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabela de Relação: Leads, Idade e Linha do Tempo de Tarefas */}
          <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d1d5d6]/50 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
                  Linha do Tempo: Tarefas Executadas vs Idade do Lead
                </h3>
                <p className="text-xs text-[#6a797c] mt-0.5">
                  Cada tarefa rastreada com o tempo de vida do lead no momento em que a ação foi disparada.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#d1d5d6] bg-[#f8fafb] text-[#14262d] font-semibold">
                    <th className="py-2.5 px-3">Lead & Empresa</th>
                    <th className="py-2.5 px-3">SDR</th>
                    <th className="py-2.5 px-3 text-center">Data de Criação</th>
                    <th className="py-2.5 px-3 text-center">Idade do Lead</th>
                    <th className="py-2.5 px-3 text-center">SLA 1º Toque</th>
                    <th className="py-2.5 px-3 text-center">Fase da Cadência</th>
                    <th className="py-2.5 px-3">Linha do Tempo de Tarefas (Momento de Vida)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1d5d6]/50">
                  {filteredCadence.map(cad => (
                    <tr key={cad.leadId} className="hover:bg-[#f8fafb] transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-[#14262d]">{cad.contactName}</p>
                        <p className="text-[10px] text-[#6a797c]">{cad.companyName}</p>
                      </td>
                      <td className="py-3 px-3 font-medium text-[#14262d]">
                        {cad.sdrName}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[#6a797c]">
                        {new Date(cad.leadCreatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {' '}
                        {new Date(cad.leadCreatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold text-[#14262d]">
                          {cad.leadAgeDays === 0 ? `${cad.leadAgeHours}h (D0)` : `${cad.leadAgeDays}d ${cad.leadAgeHours % 24}h`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border inline-block ${
                          cad.firstTouchSlaStatus === 'MET'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}>
                          {cad.firstTouchSlaMinutes} min {cad.firstTouchSlaStatus === 'MET' ? '✓' : '⚠'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-semibold bg-slate-100 text-[#14262d] px-2 py-0.5 rounded border border-slate-200">
                          {cad.cadenceStageLabel}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                          {cad.tasksList.map(t => (
                            <div 
                              key={t.id}
                              className={`px-2 py-1 rounded text-[10px] border flex items-center gap-1 ${
                                t.status === 'COMPLETED' 
                                  ? 'bg-emerald-50/80 text-emerald-900 border-emerald-200' 
                                  : 'bg-white text-[#14262d] border-[#d1d5d6]'
                              }`}
                              title={`${t.title} (${t.leadAgeWhenDue})`}
                            >
                              <span className="font-bold font-mono text-[9px] text-[#6a797c]">{t.leadAgeWhenDue}:</span>
                              <span className="truncate max-w-[120px]">{t.title}</span>
                              {t.status === 'COMPLETED' && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
