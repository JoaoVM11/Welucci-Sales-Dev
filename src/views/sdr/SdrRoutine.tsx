import React, { useState, useEffect } from 'react';
import { 
  CalendarRange, Clock, CheckCircle2, AlertTriangle, 
  Sparkles, RefreshCw, ChevronLeft, ChevronRight, Phone, ArrowRight, 
  ExternalLink, Check, AlertCircle, Plus, Calendar, 
  Users, Trash2, ShieldCheck, Flame, BookOpen, Linkedin, 
  Volume2, CheckSquare, Coffee 
} from 'lucide-react';
import { User, PlanningBlock, Task, SdrScope, CalendarEvent } from '../../types';
import { store } from '../../services/store';
import { getWeekdayInfo } from '../../services/calculationEngine';

const stepDate = (currentDateStr: string, deltaDays: number): string => {
  try {
    const [y, m, d] = currentDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + deltaDays, 12, 0, 0);
    const nextY = dateObj.getFullYear();
    const nextM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nextD = String(dateObj.getDate()).padStart(2, '0');
    return `${nextY}-${nextM}-${nextD}`;
  } catch {
    return currentDateStr;
  }
};

interface SdrRoutineProps {
  currentUser: User;
  onCompleteTask: (taskId: string) => void;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

export const SdrRoutine: React.FC<SdrRoutineProps> = ({
  currentUser,
  onCompleteTask,
  selectedDate: propSelectedDate,
  onSelectDate,
}) => {
  // Day selection state for simulation & real inspection
  const [selectedDate, setSelectedDate] = useState<string>(
    propSelectedDate || store.getSelectedDate() || '2026-10-21'
  );

  // Sync state if prop changes from header
  useEffect(() => {
    if (propSelectedDate && propSelectedDate !== selectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  const handleDateChange = (dateStr: string) => {
    setSelectedDate(dateStr);
    store.setSelectedDate(dateStr);
    if (onSelectDate) onSelectDate(dateStr);
  };
  const [selectedScope, setSelectedScope] = useState<SdrScope>(
    currentUser.scope || 'Inbound Qualificação'
  );
  const [forceBiweeklyFriday, setForceBiweeklyFriday] = useState<boolean>(true);
  const [isAddingEvent, setIsAddingEvent] = useState<boolean>(false);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventStart, setEventStart] = useState<string>('15:30');
  const [eventEnd, setEventEnd] = useState<string>('16:30');
  const [autoAdjustAlert, setAutoAdjustAlert] = useState<string | null>(null);
  const [activeCallModalTask, setActiveCallModalTask] = useState<Task | null>(null);

  // If user is admin, allow switching between SDRs in the team
  const sdrUsers = store.getSdrUsers();
  const [selectedSdrId, setSelectedSdrId] = useState<string>(
    currentUser.role === 'ADMIN' ? (sdrUsers[0]?.id || currentUser.id) : currentUser.id
  );

  const activeSdr = store.getAllUsers().find(u => u.id === selectedSdrId) || currentUser;

  // Sync state with store updates
  const [, setTick] = useState(0);
  useEffect(() => {
    return store.subscribe(() => setTick(t => t + 1));
  }, []);

  const weekdayInfo = getWeekdayInfo(selectedDate);

  const blocks = store.getDailyPlan(activeSdr.id, selectedDate, {
    scope: selectedScope,
    forceBiweeklyFriday,
  });

  const tasks = store.getTasks({ ownerId: activeSdr.id });
  const kpi = store.getSdrKpiSummary(activeSdr.id, selectedDate);
  const calendarEvents = store.getCalendarEvents(activeSdr.id);

  // Simulated current time for "O que fazer AGORA"
  const simulatedCurrentTime = '10:15';
  const currentBlock = blocks.find(b => b.startsAt <= simulatedCurrentTime && b.endsAt > simulatedCurrentTime) || blocks[1] || blocks[0];
  const nextBlock = blocks.find(b => b.startsAt >= '12:00') || blocks[3] || blocks[0];

  // Handler for adding an ad-hoc calendar event (Teams / HubSpot)
  const handleAddCalendarEvent = (title?: string, start?: string, end?: string) => {
    const finalTitle = title || eventTitle.trim();
    const finalStart = start || eventStart;
    const finalEnd = end || eventEnd;

    if (!finalTitle) return;

    store.addCalendarEvent({
      externalEventId: `ms-event-${Date.now()}`,
      userId: activeSdr.id,
      title: finalTitle,
      startsAt: finalStart,
      endsAt: finalEnd,
      blocksAvailability: true,
      eventType: 'TRAINING',
      source: 'TEAMS',
      description: `Compromisso adicionado e sincronizado via Microsoft Teams. O motor adaptou automaticamente os intervalos da rotina diária.`,
    });

    setAutoAdjustAlert(`Rotina auto-ajustada! O motor redistribuiu a fila de espera, touch points obrigatórios e confirmações nos intervalos livres do expediente das 09h às 19h.`);
    setIsAddingEvent(false);
    setEventTitle('');
    setTimeout(() => setAutoAdjustAlert(null), 6000);
  };

  const handleRemoveEvent = (id: string, title: string) => {
    store.removeCalendarEvent(id);
    setAutoAdjustAlert(`Compromisso "${title}" removido. Capacidade operacional recalculada.`);
    setTimeout(() => setAutoAdjustAlert(null), 4000);
  };

  const handleDayPreset = (dateStr: string) => {
    handleDateChange(dateStr);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="bg-white p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-[#14262d] text-amber-300">
              <CalendarRange className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#14262d] tracking-tight">
                  Minha Rotina Operacional — {weekdayInfo.label} ({weekdayInfo.formattedDate})
                </h2>
                {selectedDate === '2026-10-21' ? (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                    Hoje
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-300">
                    Data Filtrada
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Rotina conectada à agenda da Welucci (Teams / HubSpot) com divisão em blocos de atividades competentes e auto-ajuste inteligente.
              </p>
            </div>
          </div>
        </div>

        {/* SDR Switcher (if Admin) or Scope indicator */}
        <div className="flex flex-wrap items-center gap-3">
          {currentUser.role === 'ADMIN' && (
            <div className="flex items-center gap-2 bg-[#f8fafb] px-3 py-1.5 rounded-lg border border-[#d1d5d6]/70 text-xs">
              <span className="font-semibold text-[#14262d]">SDR:</span>
              <select
                value={selectedSdrId}
                onChange={(e) => setSelectedSdrId(e.target.value)}
                className="bg-transparent font-medium text-[#14262d] focus:outline-none cursor-pointer"
              >
                {sdrUsers.map(sdr => (
                  <option key={sdr.id} value={sdr.id}>
                    {sdr.name} ({sdr.scope || 'SDR'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scope Selector: Inbound vs Outbound */}
          <div className="flex items-center bg-[#f8fafb] p-1 rounded-lg border border-[#d1d5d6]/70 text-xs">
            <button
              onClick={() => setSelectedScope('Inbound Qualificação')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                selectedScope === 'Inbound Qualificação'
                  ? 'bg-[#14262d] text-white shadow-xs'
                  : 'text-[#6a797c] hover:text-[#14262d]'
              }`}
            >
              Inbound (Qualificação)
            </button>
            <button
              onClick={() => setSelectedScope('Outbound Prospecção')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                selectedScope === 'Outbound Prospecção'
                  ? 'bg-[#14262d] text-white shadow-xs'
                  : 'text-[#6a797c] hover:text-[#14262d]'
              }`}
            >
              Outbound (Prospecção)
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Switcher Toolbar — Shows how rules adapt by day with Date Picker */}
      <div className="bg-[#14262d] text-white p-4 rounded-xl shadow-xs border border-[#1e343c] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Escolher Data da Rotina:
            </span>
          </div>

          {/* Interactive Date Picker & Steppers in SDR view */}
          <div className="flex items-center gap-1.5 bg-[#0e1d23] p-1 rounded-lg border border-[#1e343c]">
            <button
              type="button"
              onClick={() => handleDateChange('2026-10-21')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                selectedDate === '2026-10-21'
                  ? 'bg-amber-400 text-[#14262d] font-bold shadow-2xs'
                  : 'text-[#d1d5d6] hover:text-white'
              }`}
              title="Voltar para a rotina de hoje (21/10/2026)"
            >
              Hoje
            </button>

            <div className="flex items-center bg-[#14262d] rounded border border-[#223d47] px-1 py-0.5">
              <button
                type="button"
                onClick={() => handleDateChange(stepDate(selectedDate, -1))}
                title="Dia anterior"
                className="p-1 text-[#d1d5d6] hover:text-white hover:bg-[#1a333c] rounded cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && handleDateChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white px-1.5 focus:outline-none cursor-pointer"
                title="Selecione o dia que deseja ver a rotina"
              />
              <button
                type="button"
                onClick={() => handleDateChange(stepDate(selectedDate, 1))}
                title="Próximo dia"
                className="p-1 text-[#d1d5d6] hover:text-white hover:bg-[#1a333c] rounded cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Weekday Shortcut Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { date: '2026-10-19', label: 'Segunda', note: 'Reunião de Equipe 10h (Sem Daily)' },
            { date: '2026-10-20', label: 'Terça', note: 'Daily 09h30 + Cadência' },
            { date: '2026-10-21', label: 'Quarta', note: 'Daily 09h30 + Reunião de Trabalho 14h' },
            { date: '2026-10-22', label: 'Quinta', note: 'Daily 09h30 + Cadência' },
            { date: '2026-10-23', label: 'Sexta', note: 'Daily 09h30 + 1:1 Quinzenal 10h' },
          ].map(day => (
            <button
              key={day.date}
              onClick={() => handleDayPreset(day.date)}
              title={day.note}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedDate === day.date
                  ? 'bg-amber-400 text-[#14262d] shadow-sm font-bold ring-1 ring-amber-300'
                  : 'bg-[#0e1d23] text-[#d1d5d6] hover:bg-[#1a333c] hover:text-white border border-[#1e343c]'
              }`}
            >
              {day.label}
            </button>
          ))}

          {!['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'].includes(selectedDate) && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-400 text-[#14262d] border border-amber-300 shadow-2xs">
              📅 {weekdayInfo.label} ({weekdayInfo.formattedDate})
            </span>
          )}
        </div>
      </div>

      {/* Auto-Adjust Alert Banner */}
      {autoAdjustAlert && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-xl shadow-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900">
                {autoAdjustAlert}
              </p>
              <p className="text-[11px] text-emerald-700">
                A capacidade líquida e os horários de início e término dos blocos foram recalculados automaticamente.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAutoAdjustAlert(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Competencies Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedScope === 'Inbound Qualificação' ? (
          <>
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Fila & Novos Leads
                </span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-[#14262d] mt-2">Fila D-1 & Novos Leads</p>
              <p className="text-[11px] text-[#6a797c] mt-1 leading-snug">
                Responder leads que viraram o dia + resposta ultrarrápida (SLA &lt; 15 min) para novos leads.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-sky-600" /> Ligação Obrigatória
                </span>
                <Flame className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-sm font-bold text-[#14262d] mt-2">Touch Points da Cadência</p>
              <p className="text-[11px] text-[#6a797c] mt-1 leading-snug">
                Obrigatório realizar tentativa de ligação telefônica em cada Touch Point executado.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Show-Rate & Handoff
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-[#14262d] mt-2">Confirmações & Passagem</p>
              <p className="text-[11px] text-[#6a797c] mt-1 leading-snug">
                Confirmar todas as reuniões do dia e fazer passagem de bastão detalhada para o Closer.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Recuperação Ativa
                </span>
                <AlertTriangle className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-sm font-bold text-[#14262d] mt-2">No-Shows & Cancelados</p>
              <p className="text-[11px] text-[#6a797c] mt-1 leading-snug">
                Follow-up imediato com clientes que faltaram ou cancelaram sem data de reagendamento.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Prospecção Ativa
                </span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-[#14262d] mt-2">Ativar Novos Prospects</p>
              <p className="text-[11px] text-[#6a797c] mt-1 leading-snug">
                Pesquisa e ativação de novas contas e decisores da fila de prospecção fria.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-sky-600" /> Cold Call Obrigatória
                </span>
                <Flame className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-sm font-bold text-[#14262d] mt-2">Cadência Outbound</p>
              <p className="text-[11px] text-[#6a797c] mt-1 leading-snug">
                Seguir rigorosamente a cadência dos leads que já entraram no funil de prospecção.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                  <Linkedin className="w-3 h-3 text-blue-600" /> Social Selling
                </span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-[#14262d] mt-2">Social Selling no LinkedIn</p>
              <p className="text-[11px] text-[#6a797c] mt-1 leading-snug">
                Conexões direcionadas com C-levels, interações em publicações e mensagens via InMail.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Agendamento D0
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-[#14262d] mt-2">Conversão & Handoff</p>
              <p className="text-[11px] text-[#6a797c] mt-1 leading-snug">
                Qualificação BANT de decisores outbound e confirmação de presença com Closer.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Simulator: Inject Ad-hoc Calendar Event (Teams / HubSpot) */}
      <div className="bg-[#f8fafb] border border-[#d1d5d6]/70 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-[#14262d] text-amber-300">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-[#14262d]">
                Simulador de Conexão com Calendário Teams / HubSpot & Auto-Ajuste
              </h3>
            </div>
            <p className="text-xs text-[#6a797c] mt-0.5">
              Insira um compromisso avulso (treinamento, reunião de fechamento, All Hands) e veja o motor redistribuir os blocos em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleAddCalendarEvent('All Hands Welucci B2B', '11:00', '12:00')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#d1d5d6] text-[#14262d] hover:bg-slate-100 transition-colors"
            >
              + All Hands (11h-12h)
            </button>
            <button
              onClick={() => handleAddCalendarEvent('Treinamento: Técnicas de Objeção', '15:30', '16:30')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#d1d5d6] text-[#14262d] hover:bg-slate-100 transition-colors"
            >
              + Treinamento (15h30-16h30)
            </button>
            <button
              onClick={() => handleAddCalendarEvent('Reunião de Fechamento da Empresa', '17:00', '18:00')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#d1d5d6] text-[#14262d] hover:bg-slate-100 transition-colors"
            >
              + Fechamento (17h-18h)
            </button>
            <button
              onClick={() => setIsAddingEvent(!isAddingEvent)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#14262d] text-white hover:bg-[#1a333c] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Personalizar Evento</span>
            </button>
          </div>
        </div>

        {/* Custom Event Form */}
        {isAddingEvent && (
          <div className="p-4 bg-white rounded-lg border border-[#d1d5d6] space-y-3 animate-in fade-in">
            <h4 className="text-xs font-bold text-[#14262d] uppercase tracking-wide">
              Adicionar Compromisso Sincronizado do Microsoft Teams / Outlook
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-[#14262d] mb-1">Título do Compromisso</label>
                <input
                  type="text"
                  placeholder="Ex: Workshop Técnico com Closer ou All Hands"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-md px-3 py-1.5 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#14262d] mb-1">Início</label>
                <input
                  type="time"
                  value={eventStart}
                  onChange={(e) => setEventStart(e.target.value)}
                  className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-md px-3 py-1.5 text-xs font-mono text-[#14262d]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#14262d] mb-1">Término</label>
                <input
                  type="time"
                  value={eventEnd}
                  onChange={(e) => setEventEnd(e.target.value)}
                  className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-md px-3 py-1.5 text-xs font-mono text-[#14262d]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setIsAddingEvent(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#6a797c] hover:text-[#14262d]"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAddCalendarEvent()}
                className="px-4 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-2xs"
              >
                Sincronizar e Auto-Ajustar Rotina
              </button>
            </div>
          </div>
        )}
      </div>

      {/* What to do NOW vs NEXT Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AGORA */}
        <div className="bg-[#14262d] text-white p-5 rounded-xl border border-[#1e343c] shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e343c] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                O que fazer agora ({simulatedCurrentTime})
              </span>
            </div>
            <span className="text-xs font-mono text-[#d1d5d6]">
              {currentBlock.startsAt} – {currentBlock.endsAt}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-white tracking-tight">{currentBlock.title}</h4>
              {currentBlock.requiresMandatoryCall && (
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/30 flex items-center gap-1">
                  <Phone className="w-2.5 h-2.5" /> Ligação Obrigatória
                </span>
              )}
            </div>
            <p className="text-xs text-[#d1d5d6]/80 mt-1">
              {currentBlock.description || 'Execução focada na cadência do expediente.'}
            </p>
          </div>

          {/* Allocated tasks in this block */}
          <div className="space-y-2 pt-2">
            {currentBlock.allocations.length === 0 ? (
              <div className="p-3 bg-[#0e1d23] rounded-lg border border-[#1e343c] text-xs text-[#d1d5d6]/70 italic flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-300" />
                <span>Nenhuma tarefa de CRM pendente alocada (Horário reservado para compromisso ou intervalo).</span>
              </div>
            ) : (
              currentBlock.allocations.map((alloc) => {
                const task = tasks.find(t => t.id === alloc.taskId);
                if (!task) return null;

                return (
                  <div
                    key={alloc.id}
                    className="p-3 bg-[#0e1d23] border border-[#1e343c] rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{task.title}</span>
                        {task.requiresCall && (
                          <span className="bg-amber-400/20 text-amber-300 text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" /> Fazer Ligação
                          </span>
                        )}
                        {task.isWaitingQueue && (
                          <span className="bg-rose-400/20 text-rose-300 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                            Fila D-1
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#6a797c] flex items-center gap-2">
                        <span>{task.contactName} ({task.companyName})</span>
                        <span>·</span>
                        <span>{alloc.estimatedMinutes} min</span>
                        {task.contactPhone && (
                          <span className="text-[#d1d5d6] font-mono">{task.contactPhone}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.requiresCall && (
                        <button
                          onClick={() => setActiveCallModalTask(task)}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-400 text-[#14262d] hover:bg-amber-300 transition-colors flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Ligar</span>
                        </button>
                      )}
                      <button
                        onClick={() => onCompleteTask(task.id)}
                        className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                      >
                        Concluir
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SEGUIR */}
        <div className="bg-white p-5 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#d1d5d6]/50 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#6a797c]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#6a797c]">
                O que vem a seguir
              </span>
            </div>
            <span className="text-xs font-mono text-[#6a797c]">
              {nextBlock.startsAt} – {nextBlock.endsAt}
            </span>
          </div>

          <div>
            <h4 className="text-base font-bold text-[#14262d] tracking-tight">{nextBlock.title}</h4>
            <p className="text-xs text-[#6a797c] mt-1">
              {nextBlock.blockType === 'LUNCH'
                ? 'Intervalo obrigatório de 60 minutos para almoço e descanso.'
                : nextBlock.description || `Capacidade disponível: ${nextBlock.availableMinutes} minutos produtivos.`}
            </p>
          </div>

          <div className="p-3 bg-[#f8fafb] rounded-lg border border-[#d1d5d6]/50 text-xs text-[#6a797c] space-y-1">
            <p className="font-semibold text-[#14262d]">💡 Diretriz Oficial Welucci Sales Dev:</p>
            <p className="leading-relaxed">
              {weekdayInfo.dayName === 'SEGUNDA' && 'Segunda-feira focada em zerar a fila de espera e alinhar estratégia semanal na reunião das 10h.'}
              {weekdayInfo.dayName === 'QUARTA' && 'Quarta-feira com Reunião de Trabalho às 14h. Mantenha os touch points concentrados pela manhã e final da tarde.'}
              {weekdayInfo.dayName === 'SEXTA' && 'Sexta-feira com Daily às 09h30 e 1:1 quinzenal na sequência às 10h. Acelere as confirmações da tarde para bater a meta semanal.'}
              {(weekdayInfo.dayName === 'TERCA' || weekdayInfo.dayName === 'QUINTA') && 'Dias nobres de máxima produtividade. Foco absoluto em atingir o GAP D0 antes das 17h00.'}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline of All Blocks of the Day */}
      <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#d1d5d6]/50 pb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
                Cronograma Completo do Expediente — {weekdayInfo.label} ({selectedDate})
              </h3>
              {blocks.some(b => b.isAdaptiveAdjusted) && (
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-amber-300">
                  <Sparkles className="w-2.5 h-2.5" /> Auto-Ajustado
                </span>
              )}
            </div>
            <p className="text-xs text-[#6a797c] mt-0.5">
              Jornada das 09h00 às 19h00 dividida em blocos adaptativos com priorização de SLA e ligação obrigatória.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono font-bold text-[#14262d]">
              {blocks.filter(b => b.category !== 'CALENDAR_FIXED' && b.category !== 'LUNCH').length} blocos operacionais
            </span>
            <span>·</span>
            <span className="text-[#6a797c]">
              {blocks.reduce((acc, b) => acc + b.allocations.length, 0)} tarefas alocadas
            </span>
          </div>
        </div>

        {/* Blocks list */}
        <div className="space-y-3">
          {blocks.map((block) => {
            const isFixed = block.category === 'CALENDAR_FIXED' || block.blockType === 'LUNCH' || block.category === 'CALENDAR_ORGANIC';
            const isActive = block.id === currentBlock.id;
            const isCallBlock = block.requiresMandatoryCall;

            return (
              <div
                key={block.id}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'border-[#14262d] bg-[#f8fafb] shadow-xs ring-1 ring-[#14262d]'
                    : block.isAdaptiveAdjusted
                    ? 'border-amber-300/80 bg-amber-50/20'
                    : isFixed
                    ? 'border-[#d1d5d6]/60 bg-slate-50/80'
                    : 'border-[#d1d5d6]/70 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#14262d] bg-white px-2.5 py-1 rounded border border-[#d1d5d6]">
                      {block.startsAt} – {block.endsAt}
                    </span>
                    <span className="font-bold text-sm text-[#14262d]">{block.title}</span>

                    {isActive && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Em Andamento
                      </span>
                    )}

                    {isCallBlock && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 text-amber-700" /> Ligação Obrigatória
                      </span>
                    )}

                    {block.isAdaptiveAdjusted && (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-semibold px-1.5 py-0.2 rounded" title={block.adjustmentReason}>
                        Ajustado
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#6a797c]">
                    {!isFixed && (
                      <>
                        <span>{block.allocations.length} lead(s) alocado(s)</span>
                        <span>·</span>
                        <span>Carga: <strong className="text-[#14262d] font-mono">{block.allocatedMinutes}m</strong> / {block.availableMinutes}m</span>
                      </>
                    )}
                    {isFixed && (
                      <span className="italic text-[11px] text-[#6a797c] flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Compromisso reservado na agenda
                      </span>
                    )}
                  </div>
                </div>

                {block.description && (
                  <p className="text-xs text-[#6a797c] mt-1 pl-1">
                    {block.description}
                  </p>
                )}

                {/* Sub-tasks in this block */}
                {block.allocations.length > 0 && (
                  <div className="mt-3 pl-3 border-l-2 border-[#14262d]/20 space-y-2">
                    {block.allocations.map((alloc) => {
                      const t = tasks.find(tsk => tsk.id === alloc.taskId);
                      if (!t) return null;

                      return (
                        <div
                          key={alloc.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[#f8fafb] border border-[#d1d5d6]/50 gap-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[#6a797c] text-[11px] font-bold">{alloc.allocationOrder}.</span>
                            <span className="font-semibold text-[#14262d]">{t.title}</span>
                            <span className="text-[#6a797c] text-[11px]">({t.contactName} · {t.companyName})</span>
                            
                            {t.requiresCall && (
                              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded border border-amber-300 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" /> Fazer Ligação
                              </span>
                            )}

                            {t.isWaitingQueue && (
                              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                                Fila D-1
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono text-[11px] text-[#6a797c]">{alloc.estimatedMinutes} min</span>
                            
                            {t.requiresCall && (
                              <button
                                onClick={() => setActiveCallModalTask(t)}
                                className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 underline flex items-center gap-1 cursor-pointer"
                              >
                                <Phone className="w-3 h-3" /> Ligar
                              </button>
                            )}

                            <button
                              onClick={() => onCompleteTask(t.id)}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                            >
                              Concluir
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Call Dialog Modal (Ligação Obrigatória) */}
      {activeCallModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#d1d5d6] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#d1d5d6]/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-amber-100 text-amber-800">
                  <Phone className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-[#14262d]">
                    Executar Ligação Obrigatória
                  </h3>
                  <p className="text-xs text-[#6a797c]">
                    Diretriz Welucci: Todo Touch Point exige tentativa de ligação telefônica.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCallModalTask(null)}
                className="text-[#6a797c] hover:text-[#14262d] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-[#f8fafb] rounded-xl border border-[#d1d5d6]/70 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#6a797c]">Contato:</span>
                <span className="font-bold text-[#14262d]">{activeCallModalTask.contactName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#6a797c]">Empresa:</span>
                <span className="font-bold text-[#14262d]">{activeCallModalTask.companyName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#6a797c]">Telefone:</span>
                <span className="font-mono font-bold text-[#14262d] text-sm">
                  {activeCallModalTask.contactPhone || '+55 11 98822-1100'}
                </span>
              </div>
              {activeCallModalTask.callNotes && (
                <div className="pt-2 border-t border-[#d1d5d6]/50">
                  <span className="text-[11px] font-semibold text-[#6a797c]">Notas de Abordagem:</span>
                  <p className="text-xs text-[#14262d] mt-0.5">{activeCallModalTask.callNotes}</p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#14262d]">Resultado da Chamada:</label>
              <textarea
                placeholder="Insira as anotações da ligação para sincronizar com o histórico do contato no HubSpot..."
                rows={3}
                className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg p-3 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveCallModalTask(null)}
                className="px-4 py-2 text-xs font-semibold text-[#6a797c] hover:text-[#14262d]"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  onCompleteTask(activeCallModalTask.id);
                  setActiveCallModalTask(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Registrar Ligação & Concluir Tarefa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
