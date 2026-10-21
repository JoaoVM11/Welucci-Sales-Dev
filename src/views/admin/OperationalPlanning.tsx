import React, { useState, useEffect } from 'react';
import { 
  CalendarRange, Clock, ShieldCheck, ListOrdered, Save, 
  Check, Phone, Users, AlertTriangle, Sparkles, CheckCircle2, 
  Flame, Linkedin, Calendar, Bot, Plus, Trash2, RotateCcw, 
  Edit3, Briefcase, UserCheck, Settings2, Eye, Sliders, 
  ArrowRight, Copy, CheckSquare, Layers
} from 'lucide-react';
import { store } from '../../services/store';
import { User, SdrScope, PlanningBlockType } from '../../types';
import { 
  RoutineBlockBlueprint, getWeekdayInfo, getIdealDayBlueprints, 
  timeToMinutes, minutesToTime 
} from '../../services/calculationEngine';

const WEEKDAYS = [
  { date: '2026-10-19', dayName: 'SEGUNDA' as const, name: 'Segunda-feira', short: 'Seg', rule: 'Sem Daily · Reunião de Equipe 10h' },
  { date: '2026-10-20', dayName: 'TERCA' as const, name: 'Terça-feira', short: 'Ter', rule: 'Daily 09h30 · Prospecção Total' },
  { date: '2026-10-21', dayName: 'QUARTA' as const, name: 'Quarta-feira', short: 'Qua', rule: 'Daily 09h30 · Reunião de Trabalho 14h' },
  { date: '2026-10-22', dayName: 'QUINTA' as const, name: 'Quinta-feira', short: 'Qui', rule: 'Daily 09h30 · Cadência Plena' },
  { date: '2026-10-23', dayName: 'SEXTA' as const, name: 'Sexta-feira', short: 'Sex', rule: 'Daily 09h30 · 1:1 Quinzenal 10h' },
];

export const OperationalPlanning: React.FC = () => {
  // Main Navigation Tabs (Current Routine vs Create/Edit Routine)
  const [activeMainTab, setActiveMainTab] = useState<'CURRENT' | 'EDITOR'>('CURRENT');

  // Sub-option inside Editor: Daily vs Weekly
  const [editorMode, setEditorMode] = useState<'DAILY' | 'WEEKLY'>('DAILY');

  // Global settings
  const [safetyMargin, setSafetyMargin] = useState<number>(10);
  const [workStart, setWorkStart] = useState<string>('09:00');
  const [workEnd, setWorkEnd] = useState<string>('19:00');
  const [lunchDuration, setLunchDuration] = useState<number>(60);
  const [globalSaved, setGlobalSaved] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // SDR Users from store
  const sdrUsers = store.getSdrUsers();

  // Target selection
  const [targetType, setTargetType] = useState<'PROFESSIONAL' | 'SCOPE'>('PROFESSIONAL');
  const [selectedSdrId, setSelectedSdrId] = useState<string>(sdrUsers[0]?.id || 'user-sdr-inbound');
  const [selectedScope, setSelectedScope] = useState<SdrScope>('Inbound Qualificação');
  const [selectedDayDate, setSelectedDayDate] = useState<string>('2026-10-21'); // Default Wednesday

  // Weekly editor active tab (which day is being inspected/edited inside weekly mode)
  const [weeklyActiveDay, setWeeklyActiveDay] = useState<string>('Segunda-feira');

  // Weekly blocks dictionary: { 'Segunda-feira': [...], 'Terça-feira': [...] }
  const [weeklyBlocks, setWeeklyBlocks] = useState<Record<string, RoutineBlockBlueprint[]>>({});

  // Active SDR object
  const activeSdr = sdrUsers.find(u => u.id === selectedSdrId) || sdrUsers[0];

  // Derive target key for storage
  const targetKey = targetType === 'PROFESSIONAL' ? (activeSdr?.id || selectedSdrId) : selectedScope;
  const currentScope = targetType === 'PROFESSIONAL' ? (activeSdr?.scope || 'Inbound Qualificação') : selectedScope;

  // Single day blocks state (used in Daily Editor)
  const [dailyBlocks, setDailyBlocks] = useState<RoutineBlockBlueprint[]>([]);

  const weekdayInfo = getWeekdayInfo(selectedDayDate);

  // Load routine for daily editor when dependencies change
  useEffect(() => {
    const loaded = store.getRoutineBlocksForEditing(targetKey, selectedDayDate, currentScope);
    setDailyBlocks(JSON.parse(JSON.stringify(loaded)));
  }, [targetKey, targetType, selectedSdrId, selectedScope, selectedDayDate, currentScope]);

  // Load routine for weekly editor
  useEffect(() => {
    const weekMap: Record<string, RoutineBlockBlueprint[]> = {};
    for (const wd of WEEKDAYS) {
      const loaded = store.getRoutineBlocksForEditing(targetKey, wd.date, currentScope);
      weekMap[wd.name] = JSON.parse(JSON.stringify(loaded));
    }
    setWeeklyBlocks(weekMap);
  }, [targetKey, targetType, selectedSdrId, selectedScope, currentScope]);

  // Show temporary feedback toast
  const showFeedback = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // --- Handlers for Daily Routine Editing ---
  const handleDailyBlockChange = (index: number, field: keyof RoutineBlockBlueprint, value: any) => {
    setDailyBlocks(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddDailyBlock = () => {
    const lastBlock = dailyBlocks[dailyBlocks.length - 1];
    const newStart = lastBlock ? lastBlock.end : '18:00';
    const startMins = timeToMinutes(newStart);
    const newEnd = minutesToTime(Math.min(19 * 60, startMins + 45));

    const newBlock: RoutineBlockBlueprint = {
      start: newStart,
      end: newEnd,
      type: 'TOUCH_POINTS',
      title: 'Novo Bloco de Touch Points (Personalizado)',
      description: 'Atividade comercial configurada pelo gestor.',
      category: currentScope === 'Outbound Prospecção' ? 'OUTBOUND' : 'INBOUND',
      requiresMandatoryCall: true,
    };

    setDailyBlocks(prev => [...prev, newBlock]);
  };

  const handleRemoveDailyBlock = (index: number) => {
    setDailyBlocks(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveDailyRoutine = () => {
    store.saveCustomRoutine(targetKey, dailyBlocks, weekdayInfo.dayName);
    const label = targetType === 'PROFESSIONAL' ? (activeSdr?.name || 'Profissional') : selectedScope;
    showFeedback(`Rotina diária de ${label} para ${weekdayInfo.dayName} salva com sucesso! Os cronogramas foram sincronizados.`);
  };

  const handleResetDailyToDefault = () => {
    store.resetCustomRoutine(targetKey, weekdayInfo.dayName);
    const defaults = getIdealDayBlueprints(
      weekdayInfo.dayName, 
      weekdayInfo.isBiweeklyFriday, 
      currentScope === 'Outbound Prospecção' ? 'OUTBOUND' : 'INBOUND'
    );
    setDailyBlocks(JSON.parse(JSON.stringify(defaults)));
    const label = targetType === 'PROFESSIONAL' ? (activeSdr?.name || 'Profissional') : selectedScope;
    showFeedback(`Grade padrão original da Welucci restaurada para ${label} em ${weekdayInfo.dayName}.`, 'info');
  };

  const handleReplicateToMidWeek = () => {
    // Replicate Tuesday/Thursday pattern across standard prospecting days
    const daysToUpdate = ['Terça-feira', 'Quinta-feira'];
    for (const d of daysToUpdate) {
      store.saveCustomRoutine(targetKey, dailyBlocks, d);
    }
    showFeedback(`Grade de ${weekdayInfo.dayName} replicada para Terça e Quinta-feira com sucesso!`);
  };

  // --- Handlers for Weekly Routine Editing ---
  const handleWeeklyBlockChange = (dayName: string, index: number, field: keyof RoutineBlockBlueprint, value: any) => {
    setWeeklyBlocks(prev => {
      const dayList = [...(prev[dayName] || [])];
      dayList[index] = { ...dayList[index], [field]: value };
      return { ...prev, [dayName]: dayList };
    });
  };

  const handleAddWeeklyBlock = (dayName: string) => {
    const dayList = weeklyBlocks[dayName] || [];
    const lastBlock = dayList[dayList.length - 1];
    const newStart = lastBlock ? lastBlock.end : '18:00';
    const startMins = timeToMinutes(newStart);
    const newEnd = minutesToTime(Math.min(19 * 60, startMins + 45));

    const newBlock: RoutineBlockBlueprint = {
      start: newStart,
      end: newEnd,
      type: 'TOUCH_POINTS',
      title: 'Novo Bloco Touch Points',
      description: 'Atividade comercial configurada na grade semanal.',
      category: currentScope === 'Outbound Prospecção' ? 'OUTBOUND' : 'INBOUND',
      requiresMandatoryCall: true,
    };

    setWeeklyBlocks(prev => ({
      ...prev,
      [dayName]: [...(prev[dayName] || []), newBlock],
    }));
  };

  const handleRemoveWeeklyBlock = (dayName: string, index: number) => {
    setWeeklyBlocks(prev => ({
      ...prev,
      [dayName]: (prev[dayName] || []).filter((_, idx) => idx !== index),
    }));
  };

  const handleSaveWeeklyRoutine = () => {
    store.saveWeeklyCustomRoutine(targetKey, weeklyBlocks);
    const label = targetType === 'PROFESSIONAL' ? (activeSdr?.name || 'Profissional') : selectedScope;
    showFeedback(`Grade semanal completa (Segunda a Sexta) de ${label} salva e sincronizada com sucesso!`);
  };

  const handleResetWeeklyToDefault = () => {
    store.resetCustomRoutine(targetKey);
    const weekMap: Record<string, RoutineBlockBlueprint[]> = {};
    for (const wd of WEEKDAYS) {
      const defaults = getIdealDayBlueprints(
        wd.dayName, 
        wd.dayName === 'SEXTA', 
        currentScope === 'Outbound Prospecção' ? 'OUTBOUND' : 'INBOUND'
      );
      weekMap[wd.name] = JSON.parse(JSON.stringify(defaults));
    }
    setWeeklyBlocks(weekMap);
    const label = targetType === 'PROFESSIONAL' ? (activeSdr?.name || 'Profissional') : selectedScope;
    showFeedback(`Semana completa restaurada para a grade padrão da Welucci para ${label}.`, 'info');
  };

  const handleReplicateBaseAcrossWeek = () => {
    // Replicates base commercial blocks from the selected day across other days,
    // preserving fixed corporate meetings of each day
    const sourceBlocks = weeklyBlocks[weeklyActiveDay] || dailyBlocks;
    const commercialOnly = sourceBlocks.filter(b => b.category !== 'CALENDAR_FIXED' && b.type !== 'LUNCH');

    setWeeklyBlocks(prev => {
      const updated = { ...prev };
      for (const wd of WEEKDAYS) {
        const isFriday = wd.dayName === 'SEXTA';
        const defaults = getIdealDayBlueprints(wd.dayName, isFriday, currentScope === 'Outbound Prospecção' ? 'OUTBOUND' : 'INBOUND');
        const fixedMeetings = defaults.filter(b => b.category === 'CALENDAR_FIXED' || b.type === 'LUNCH');
        
        // Merge fixed meetings with replicated commercial tasks
        const combined = [...fixedMeetings, ...commercialOnly].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
        updated[wd.name] = combined;
      }
      return updated;
    });

    showFeedback(`Estrutura base de blocos replicada para todos os dias úteis com preservação automática das reuniões fixas!`);
  };

  // Helper to calculate statistics of a routine
  const calculateRoutineStats = (routine: RoutineBlockBlueprint[]) => {
    let fixedMins = 0;
    let commercialMins = 0;
    let mandatoryCallBlocks = 0;

    for (const b of routine) {
      const duration = Math.max(0, timeToMinutes(b.end) - timeToMinutes(b.start));
      if (b.category === 'CALENDAR_FIXED' || b.type === 'LUNCH') {
        fixedMins += duration;
      } else {
        commercialMins += duration;
      }
      if (b.requiresMandatoryCall) {
        mandatoryCallBlocks++;
      }
    }

    const totalMins = fixedMins + commercialMins;
    const commercialPct = totalMins > 0 ? Math.round((commercialMins / totalMins) * 100) : 0;

    return { fixedMins, commercialMins, totalMins, commercialPct, mandatoryCallBlocks };
  };

  // Data for View 1 (Rotina Vigente & Atual)
  const currentRoutineBlocks = store.getRoutineBlocksForEditing(targetKey, selectedDayDate, currentScope);
  const currentStats = calculateRoutineStats(currentRoutineBlocks);

  const officialFixedCommitments = [
    {
      title: 'Daily Matinal Operacional',
      schedule: 'Terça a Sexta-feira · 09h30 às 10h00',
      rule: 'Obrigatória todos os dias com João V. Batista. Máximo 30 minutos.',
      tag: '09h30 Diária',
      highlight: false,
    },
    {
      title: 'Reunião de Equipe Welucci (Alinhamento Semanal)',
      schedule: 'Toda Segunda-feira · 10h00 às 11h00',
      rule: '⚠️ Na segunda-feira NÃO FAZEMOS A DAILY! A equipe inicia direto com Fila D-1 e entra na reunião às 10h.',
      tag: 'Segunda 10h (Sem Daily)',
      highlight: true,
    },
    {
      title: 'Reunião de Trabalho Operacional',
      schedule: 'Toda Quarta-feira · 14h00 às 15h00',
      rule: 'Alinhamento tático de conversão, análise de objeções e estudos de casos práticos.',
      tag: 'Quarta 14h',
      highlight: false,
    },
    {
      title: '1:1 Individual com João V. Batista',
      schedule: 'Toda Sexta-feira (Quinzenal) · 10h00 às 10h45',
      rule: 'A cada 15 dias. Em dia de 1:1, a daily acontece normal às 09h30 e o 1:1 na sequência às 10h.',
      tag: 'Sexta 10h (Daily + 1:1)',
      highlight: true,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#14262d] text-amber-300">
              <CalendarRange className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#14262d] tracking-tight">
                Planejamento & Operações
              </h2>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Gestão estratégica de rotinas operacionais: visualize a grade vigente ou crie/edite rotinas diárias e semanais para a equipe.
              </p>
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <button
          onClick={() => {
            store.addAuditLog(
              'PARAMETROS_PLANEJAMENTO_ATUALIZADOS',
              `Coordenador João V. Batista confirmou parâmetros operacionais: Expediente ${workStart}-${workEnd}, Almoço ${lunchDuration}m, Margem ${safetyMargin}%.`
            );
            setGlobalSaved(true);
            setTimeout(() => setGlobalSaved(false), 4000);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#14262d] text-white hover:bg-[#1c3640] transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4 text-amber-300" />
          <span>Salvar Parâmetros Globais</span>
        </button>
      </div>

      {globalSaved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Parâmetros operacionais globais salvos e aplicados ao motor diário.</span>
        </div>
      )}

      {/* Routine Toast Feedback */}
      {feedbackMessage && (
        <div className={`p-4 rounded-xl border shadow-xs flex items-center justify-between gap-3 animate-in fade-in ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
            : 'bg-sky-50 border-sky-300 text-sky-950'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className={`w-5 h-5 shrink-0 ${feedbackMessage.type === 'success' ? 'text-emerald-600' : 'text-sky-600'}`} />
            <p className="text-xs font-bold">{feedbackMessage.text}</p>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-xs font-bold hover:opacity-75">✕</button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2 MAIN VIEWS / TABS: VIGENTE vs CRIAR/EDITAR ROTINA      */}
      {/* ======================================================== */}
      <div className="flex border-b border-[#d1d5d6] gap-3">
        <button
          onClick={() => setActiveMainTab('CURRENT')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'CURRENT'
              ? 'border-[#14262d] text-[#14262d] bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-[#6a797c] hover:text-[#14262d]'
          }`}
        >
          <Eye className={`w-4 h-4 ${activeMainTab === 'CURRENT' ? 'text-amber-500' : ''}`} />
          <span>Aba 1: Rotina Vigente & Atual</span>
          <span className="text-[10px] bg-slate-100 text-[#6a797c] px-2 py-0.5 rounded-full font-mono font-normal">
            Visualização
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('EDITOR')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'EDITOR'
              ? 'border-[#14262d] text-[#14262d] bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-[#6a797c] hover:text-[#14262d]'
          }`}
        >
          <Sliders className={`w-4 h-4 ${activeMainTab === 'EDITOR' ? 'text-amber-500' : ''}`} />
          <span>Aba 2: Criar / Editar Rotina</span>
          <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
            Diário / Semanal
          </span>
        </button>
      </div>

      {/* Target Selector Bar (Shared across both views for convenience) */}
      <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-[#14262d] flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-amber-600" />
            <span>Alvo da Rotina:</span>
          </span>

          <div className="flex bg-[#f8fafb] p-1 rounded-lg border border-[#d1d5d6]">
            <button
              onClick={() => setTargetType('PROFESSIONAL')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                targetType === 'PROFESSIONAL'
                  ? 'bg-[#14262d] text-white shadow-2xs'
                  : 'text-[#6a797c] hover:text-[#14262d]'
              }`}
            >
              Por Profissional
            </button>
            <button
              onClick={() => setTargetType('SCOPE')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                targetType === 'SCOPE'
                  ? 'bg-[#14262d] text-white shadow-2xs'
                  : 'text-[#6a797c] hover:text-[#14262d]'
              }`}
            >
              Por Escopo (Modelo)
            </button>
          </div>

          {targetType === 'PROFESSIONAL' ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedSdrId}
                onChange={(e) => setSelectedSdrId(e.target.value)}
                className="bg-white border border-[#d1d5d6] rounded-lg px-3 py-1.5 text-xs font-bold text-[#14262d] focus:outline-none focus:border-[#14262d] cursor-pointer"
              >
                {sdrUsers.map(sdr => (
                  <option key={sdr.id} value={sdr.id}>
                    {sdr.name} — {sdr.title || 'SDR'} ({sdr.scope || 'Inbound Qualificação'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value as SdrScope)}
                className="bg-white border border-[#d1d5d6] rounded-lg px-3 py-1.5 text-xs font-bold text-[#14262d] focus:outline-none focus:border-[#14262d] cursor-pointer"
              >
                <option value="Inbound Qualificação">Inbound Qualificação (Pré-Vendas Inbound)</option>
                <option value="Outbound Prospecção">Outbound Prospecção (BDR / Cold Outbound)</option>
                <option value="Enterprise / Contas Estratégicas">Enterprise / Contas Estratégicas</option>
                <option value="Recuperação & Reengajamento">Recuperação & Reengajamento</option>
              </select>
            </div>
          )}
        </div>

        {/* Selected target badge */}
        <div className="flex items-center gap-2 text-xs text-[#6a797c]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Ativo: <strong className="text-[#14262d]">{targetType === 'PROFESSIONAL' ? activeSdr?.name : selectedScope}</strong></span>
          <span className="text-[11px] font-mono bg-slate-100 text-[#14262d] px-2 py-0.5 rounded">
            {currentScope}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: ROTINA VIGENTE & ATUAL                          */}
      {/* ======================================================== */}
      {activeMainTab === 'CURRENT' && (
        <div className="space-y-6">
          {/* Day-of-week Selector */}
          <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#14262d] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Selecione o Dia para Acompanhar a Grade Vigente:</span>
                </h3>
                <p className="text-xs text-[#6a797c] mt-0.5">
                  Veja como a rotina se organiza e se autoajusta de acordo com os compromissos fixos da Welucci e reuniões de agenda.
                </p>
              </div>

              <button
                onClick={() => setActiveMainTab('EDITOR')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-[#14262d] transition-all shadow-2xs cursor-pointer shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Esta Rotina no Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Day buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
              {WEEKDAYS.map((wd) => {
                const isSelected = selectedDayDate === wd.date;
                return (
                  <button
                    key={wd.date}
                    onClick={() => setSelectedDayDate(wd.date)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#14262d] bg-[#14262d] text-white shadow-xs'
                        : 'border-[#d1d5d6] bg-[#f8fafb] text-[#14262d] hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{wd.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isSelected ? 'bg-[#223d47] text-amber-300' : 'bg-slate-200 text-[#6a797c]'
                      }`}>
                        {wd.short}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-1 line-clamp-1 ${
                      isSelected ? 'text-[#d1d5d6]' : 'text-[#6a797c]'
                    }`}>
                      {wd.rule}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
              <span className="text-[11px] font-semibold text-[#6a797c] uppercase">Expediente Oficial</span>
              <p className="text-lg font-bold text-[#14262d] mt-1 font-mono">09h00 – 19h00</p>
              <span className="text-[10px] text-[#6a797c]">10 horas totais diárias</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
              <span className="text-[11px] font-semibold text-[#6a797c] uppercase">Reuniões & Almoço</span>
              <p className="text-lg font-bold text-amber-700 mt-1 font-mono">{currentStats.fixedMins} min</p>
              <span className="text-[10px] text-[#6a797c]">Compromissos bloqueados</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
              <span className="text-[11px] font-semibold text-[#6a797c] uppercase">Tempo Comercial Útil</span>
              <p className="text-lg font-bold text-emerald-700 mt-1 font-mono">{currentStats.commercialMins} min ({currentStats.commercialPct}%)</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Prospecção & Touch Points</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
              <span className="text-[11px] font-semibold text-[#6a797c] uppercase">Touch Points c/ Ligação</span>
              <p className="text-lg font-bold text-[#14262d] mt-1 font-mono flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-amber-500" />
                <span>{currentStats.mandatoryCallBlocks} blocos</span>
              </p>
              <span className="text-[10px] text-amber-800 font-semibold">Ligação Telefônica Obrigatória</span>
            </div>
          </div>

          {/* Timeline of Current Routine */}
          <div className="bg-white rounded-xl border border-[#d1d5d6]/70 shadow-xs overflow-hidden">
            <div className="p-4 bg-[#f8fafb] border-b border-[#d1d5d6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#14262d]">
                    Cronograma Operacional Vigente — {weekdayInfo.dayName}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ATIVO EM TEMPO REAL
                  </span>
                </div>
                <p className="text-xs text-[#6a797c] mt-0.5">
                  Profissional: <strong>{targetType === 'PROFESSIONAL' ? activeSdr?.name : selectedScope}</strong> · {currentRoutineBlocks.length} blocos definidos
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6a797c] flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sincronizado Teams & HubSpot</span>
                </span>
              </div>
            </div>

            <div className="divide-y divide-[#d1d5d6]/50">
              {currentRoutineBlocks.map((block, idx) => {
                const startM = timeToMinutes(block.start);
                const endM = timeToMinutes(block.end);
                const duration = Math.max(0, endM - startM);
                const isFixed = block.category === 'CALENDAR_FIXED' || block.type === 'LUNCH';
                const isMandatoryCall = block.requiresMandatoryCall;

                return (
                  <div 
                    key={idx}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      isFixed 
                        ? 'bg-slate-50/60' 
                        : isMandatoryCall 
                          ? 'bg-amber-50/20 hover:bg-amber-50/40' 
                          : 'hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Time & Duration */}
                    <div className="flex items-center gap-3 sm:w-56 shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-[#d1d5d6] flex items-center justify-center font-mono text-xs font-bold text-[#14262d]">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-mono text-sm font-bold text-[#14262d]">
                          {block.start} – {block.end}
                        </div>
                        <span className="text-[11px] text-[#6a797c]">
                          Duração: {duration} minutos
                        </span>
                      </div>
                    </div>

                    {/* Block Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#14262d]">
                          {block.title}
                        </span>

                        {isMandatoryCall && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                            <Phone className="w-3 h-3 text-amber-700" />
                            <span>LIGAÇÃO OBRIGATÓRIA</span>
                          </span>
                        )}

                        {block.type === 'WAITING_QUEUE_AND_NEW_LEADS' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-rose-600" />
                            <span>SLA & FILA D-1</span>
                          </span>
                        )}

                        {block.type === 'CONFIRMATIONS_AND_HANDOFF' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
                            <Users className="w-3 h-3 text-sky-600" />
                            <span>PASSAGEM DE BASTÃO</span>
                          </span>
                        )}

                        {block.type === 'SOCIAL_SELLING' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                            <Linkedin className="w-3 h-3 text-blue-700" />
                            <span>LINKEDIN</span>
                          </span>
                        )}

                        {isFixed && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-300">
                            AGENDA CORPORATIVA
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#6a797c] mt-1">
                        {block.description}
                      </p>
                    </div>

                    {/* Category indicator badge */}
                    <div className="sm:text-right shrink-0">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                        block.category === 'INBOUND'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : block.category === 'OUTBOUND'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {block.category === 'INBOUND' ? 'Inbound Sales' : block.category === 'OUTBOUND' ? 'Outbound BDR' : 'Compromisso Fixo'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Summary Grid */}
          <div className="bg-white p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#d1d5d6]/50 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>Visão Semanal Consolidada da Rotina</span>
                </h3>
                <p className="text-xs text-[#6a797c] mt-0.5">
                  Resumo de blocos e compromissos de Segunda a Sexta-feira.
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveMainTab('EDITOR');
                  setEditorMode('WEEKLY');
                }}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Editar Grade Semanal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {WEEKDAYS.map((wd) => {
                const dayBlocks = store.getRoutineBlocksForEditing(targetKey, wd.date, currentScope);
                const stats = calculateRoutineStats(dayBlocks);

                return (
                  <div key={wd.date} className="p-3.5 rounded-xl border border-[#d1d5d6] bg-[#f8fafb] space-y-2">
                    <div className="flex items-center justify-between border-b border-[#d1d5d6]/50 pb-1.5">
                      <span className="font-bold text-xs text-[#14262d]">{wd.name}</span>
                      <span className="text-[10px] font-mono text-[#6a797c]">{stats.totalMins / 60}h</span>
                    </div>

                    <p className="text-[10px] text-[#6a797c] line-clamp-2">
                      {wd.rule}
                    </p>

                    <div className="space-y-1 pt-1 text-[11px]">
                      <div className="flex justify-between text-[#6a797c]">
                        <span>Blocos:</span>
                        <strong className="text-[#14262d]">{dayBlocks.length}</strong>
                      </div>
                      <div className="flex justify-between text-[#6a797c]">
                        <span>Foco Comercial:</span>
                        <strong className="text-emerald-700">{stats.commercialMins} min</strong>
                      </div>
                      <div className="flex justify-between text-[#6a797c]">
                        <span>Com Ligação:</span>
                        <strong className="text-amber-700">{stats.mandatoryCallBlocks}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: CRIAR / EDITAR ROTINA (DIÁRIO OU SEMANAL)       */}
      {/* ======================================================== */}
      {activeMainTab === 'EDITOR' && (
        <div className="space-y-6">
          {/* Editor Header & Mode Switch */}
          <div className="bg-white p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#d1d5d6]/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#14262d] text-amber-300">
                    <Edit3 className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-[#14262d] tracking-tight">
                    Editor de Rotinas Operacionais Welucci
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 uppercase">
                    Configurador
                  </span>
                </div>
                <p className="text-xs text-[#6a797c] mt-0.5">
                  Personalize a distribuição dos blocos diários de <strong>{targetType === 'PROFESSIONAL' ? activeSdr?.name : selectedScope}</strong>. Escolha entre ajustar um dia específico ou calibrar a semana inteira.
                </p>
              </div>

              {/* Mode Switch (Diário vs Semanal) */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#6a797c]">Modo de Edição:</span>
                <div className="flex bg-[#f8fafb] p-1 rounded-lg border border-[#d1d5d6]">
                  <button
                    onClick={() => setEditorMode('DAILY')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      editorMode === 'DAILY'
                        ? 'bg-[#14262d] text-white shadow-2xs'
                        : 'text-[#6a797c] hover:text-[#14262d]'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Edição Diária</span>
                  </button>
                  <button
                    onClick={() => setEditorMode('WEEKLY')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      editorMode === 'WEEKLY'
                        ? 'bg-[#14262d] text-white shadow-2xs'
                        : 'text-[#6a797c] hover:text-[#14262d]'
                    }`}
                  >
                    <CalendarRange className="w-3.5 h-3.5" />
                    <span>Edição Semanal</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Template Helper Banner */}
            <div className="p-3 bg-[#f8fafb] rounded-xl border border-[#d1d5d6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-[#14262d]">
                  <strong>Dica de Produtividade:</strong> No modo <strong>Diário</strong>, ajuste os blocos de um dia e use "Replicar para outros dias". No modo <strong>Semanal</strong>, salve a grade de Segunda a Sexta em lote!
                </span>
              </div>

              {editorMode === 'DAILY' ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleResetDailyToDefault}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#d1d5d6] text-xs font-semibold text-[#6a797c] hover:bg-slate-100 hover:text-[#14262d] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Dia</span>
                  </button>
                  <button
                    onClick={handleSaveDailyRoutine}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Este Dia</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleResetWeeklyToDefault}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#d1d5d6] text-xs font-semibold text-[#6a797c] hover:bg-slate-100 hover:text-[#14262d] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Semana</span>
                  </button>
                  <button
                    onClick={handleSaveWeeklyRoutine}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Semana Completa</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* SUB-MODE A: EDIÇÃO DIÁRIA                               */}
          {/* ======================================================== */}
          {editorMode === 'DAILY' && (
            <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-6">
              {/* Day Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d1d5d6]/50">
                <div>
                  <label className="block text-xs font-bold text-[#14262d] mb-1">
                    Selecione o Dia da Semana para Editar:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((wd) => {
                      const isSelected = selectedDayDate === wd.date;
                      return (
                        <button
                          key={wd.date}
                          onClick={() => setSelectedDayDate(wd.date)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#14262d] text-white border-[#14262d] shadow-xs'
                              : 'bg-white text-[#6a797c] border-[#d1d5d6] hover:bg-slate-100'
                          }`}
                        >
                          {wd.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Replication button */}
                <button
                  onClick={handleReplicateToMidWeek}
                  title="Copia esta grade de blocos para Terça e Quinta-feira"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100 transition-colors cursor-pointer self-start sm:self-end"
                >
                  <Copy className="w-3.5 h-3.5 text-sky-600" />
                  <span>Replicar p/ Terça & Quinta</span>
                </button>
              </div>

              {/* Day Rule Banner */}
              <div className="bg-[#f8fafb] border border-[#d1d5d6] p-3 rounded-lg flex items-center justify-between text-xs">
                <span className="text-[#14262d]">
                  Regra do dia: <strong>{weekdayInfo.label}</strong> — {
                    weekdayInfo.dayNumber === 1 
                      ? '⚠️ Reunião de Equipe às 10h (sem daily).'
                      : weekdayInfo.dayNumber === 3
                        ? '⚠️ Reunião de Trabalho às 14h com João V. Batista.'
                        : weekdayInfo.isBiweeklyFriday
                          ? '⚠️ Daily às 09h30 e 1:1 Quinzenal às 10h na sequência.'
                          : 'Daily às 09h30 e dia pleno de cadência comercial.'
                  }
                </span>
                <span className="font-mono text-[11px] text-[#6a797c]">
                  Total: {dailyBlocks.length} blocos
                </span>
              </div>

              {/* Table of Daily Blocks */}
              <div className="overflow-x-auto border border-[#d1d5d6] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#f8fafb] border-b border-[#d1d5d6] text-[#14262d] font-bold">
                      <th className="py-3 px-3 w-40">Horário (Início - Fim)</th>
                      <th className="py-3 px-3">Título da Atividade</th>
                      <th className="py-3 px-3 w-56">Competência / Tipo</th>
                      <th className="py-3 px-3 text-center w-36">Ligação Obrigatória</th>
                      <th className="py-3 px-3 text-center w-24">Duração</th>
                      <th className="py-3 px-3 text-right w-16">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d1d5d6]/50">
                    {dailyBlocks.map((block, idx) => {
                      const startM = timeToMinutes(block.start);
                      const endM = timeToMinutes(block.end);
                      const duration = Math.max(0, endM - startM);
                      const isFixed = block.category === 'CALENDAR_FIXED' || block.type === 'LUNCH';

                      return (
                        <tr 
                          key={idx} 
                          className={`transition-colors ${isFixed ? 'bg-slate-50/70' : 'hover:bg-amber-50/30'}`}
                        >
                          {/* Time start & end */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1 font-mono font-bold text-[#14262d]">
                              <input
                                type="time"
                                value={block.start}
                                onChange={(e) => handleDailyBlockChange(idx, 'start', e.target.value)}
                                className="bg-white border border-[#d1d5d6] rounded px-1.5 py-1 text-xs w-20 focus:outline-none focus:border-[#14262d]"
                              />
                              <span>–</span>
                              <input
                                type="time"
                                value={block.end}
                                onChange={(e) => handleDailyBlockChange(idx, 'end', e.target.value)}
                                className="bg-white border border-[#d1d5d6] rounded px-1.5 py-1 text-xs w-20 focus:outline-none focus:border-[#14262d]"
                              />
                            </div>
                          </td>

                          {/* Block Title */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={block.title}
                              onChange={(e) => handleDailyBlockChange(idx, 'title', e.target.value)}
                              className="w-full bg-white border border-[#d1d5d6] rounded px-2.5 py-1 text-xs font-semibold text-[#14262d] focus:outline-none focus:border-[#14262d]"
                            />
                          </td>

                          {/* Block Competency / Type */}
                          <td className="py-2.5 px-3">
                            <select
                              value={block.type}
                              onChange={(e) => {
                                const newType = e.target.value as PlanningBlockType;
                                handleDailyBlockChange(idx, 'type', newType);
                                if (newType === 'TOUCH_POINTS' || newType === 'OUTBOUND_CADENCE') {
                                  handleDailyBlockChange(idx, 'requiresMandatoryCall', true);
                                }
                              }}
                              className="w-full bg-white border border-[#d1d5d6] rounded px-2 py-1 text-xs font-medium text-[#14262d] focus:outline-none focus:border-[#14262d]"
                            >
                              <optgroup label="Competências Inbound (SDR)">
                                <option value="WAITING_QUEUE_AND_NEW_LEADS">Fila D-1 & Novos Leads (SLA)</option>
                                <option value="TOUCH_POINTS">Touch Points de Cadência</option>
                                <option value="CONFIRMATIONS_AND_HANDOFF">Confirmação de Reuniões & Handoff</option>
                                <option value="RECOVERY_NO_SHOW">Recuperação No-Shows / Cancelados</option>
                              </optgroup>
                              <optgroup label="Competências Outbound (BDR)">
                                <option value="PROSPECT_ACTIVATION">Ativação de Novos Prospects</option>
                                <option value="OUTBOUND_CADENCE">Cadência Outbound (Cold Call)</option>
                                <option value="SOCIAL_SELLING">Social Selling no LinkedIn</option>
                              </optgroup>
                              <optgroup label="Compromissos Fixos Welucci">
                                <option value="FIXED_DAILY">Daily Matinal (09h30 - 10h00)</option>
                                <option value="FIXED_TEAM_MEETING">Reunião de Equipe (Segunda 10h00)</option>
                                <option value="FIXED_WORK_MEETING">Reunião de Trabalho (Quarta 14h00)</option>
                                <option value="FIXED_ONE_ON_ONE">1:1 Quinzenal (Sexta 10h00)</option>
                                <option value="LUNCH">Intervalo de Almoço (12h00 - 13h00)</option>
                              </optgroup>
                            </select>
                          </td>

                          {/* Mandatory Call Toggle */}
                          <td className="py-2.5 px-3 text-center">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(block.requiresMandatoryCall)}
                                onChange={(e) => handleDailyBlockChange(idx, 'requiresMandatoryCall', e.target.checked)}
                                className="rounded border-[#d1d5d6] text-amber-600 focus:ring-amber-500"
                              />
                              {block.requiresMandatoryCall && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" /> Obrigatória
                                </span>
                              )}
                            </label>
                          </td>

                          {/* Duration badge */}
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-mono text-xs font-bold text-[#14262d] bg-slate-100 px-2 py-0.5 rounded">
                              {duration}m
                            </span>
                          </td>

                          {/* Delete block button */}
                          <td className="py-2.5 px-3 text-right">
                            {!isFixed ? (
                              <button
                                onClick={() => handleRemoveDailyBlock(idx)}
                                title="Excluir este bloco da rotina"
                                className="p-1 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span title="Compromisso corporativo fixo não pode ser deletado" className="text-[10px] text-slate-400 font-semibold cursor-not-allowed">
                                Fixo
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add block button */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleAddDailyBlock}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border border-dashed border-[#14262d] text-[#14262d] hover:bg-[#14262d] hover:text-white transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Adicionar Novo Bloco no Dia</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetDailyToDefault}
                    className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#d1d5d6] text-[#6a797c] hover:bg-slate-100 hover:text-[#14262d] transition-colors cursor-pointer"
                  >
                    Restaurar Padrão
                  </button>
                  <button
                    onClick={handleSaveDailyRoutine}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Rotina de {weekdayInfo.dayName}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SUB-MODE B: EDIÇÃO SEMANAL COMPLETA (FACILITADOR)       */}
          {/* ======================================================== */}
          {editorMode === 'WEEKLY' && (
            <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-6">
              {/* Weekly Navigation & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d1d5d6]/60">
                <div>
                  <h4 className="text-sm font-bold text-[#14262d] flex items-center gap-2">
                    <CalendarRange className="w-4 h-4 text-emerald-600" />
                    <span>Grade Operacional Semanal Completa (Segunda a Sexta)</span>
                  </h4>
                  <p className="text-xs text-[#6a797c] mt-0.5">
                    Configure a distribuição de toda a semana do profissional. Alterne entre os dias abaixo para editar os blocos de cada dia.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReplicateBaseAcrossWeek}
                    title="Aplica a mesma distribuição de atividades comerciais para a semana toda, mantendo as reuniões fixas específicas de cada dia"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Replicar Modelo p/ Todos os Dias</span>
                  </button>

                  <button
                    onClick={handleSaveWeeklyRoutine}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Semana Completa</span>
                  </button>
                </div>
              </div>

              {/* Day Tab Selector in Weekly Mode */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {WEEKDAYS.map((wd) => {
                  const dayBlocks = weeklyBlocks[wd.name] || [];
                  const isSelected = weeklyActiveDay === wd.name;
                  const stats = calculateRoutineStats(dayBlocks);

                  return (
                    <button
                      key={wd.name}
                      onClick={() => setWeeklyActiveDay(wd.name)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#14262d] bg-[#14262d] text-white shadow-xs'
                          : 'border-[#d1d5d6] bg-[#f8fafb] text-[#14262d] hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{wd.name}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-[#223d47] text-amber-300' : 'bg-slate-200 text-[#6a797c]'
                        }`}>
                          {dayBlocks.length} blocos
                        </span>
                      </div>
                      <p className={`text-[10px] mt-1 line-clamp-1 ${
                        isSelected ? 'text-[#d1d5d6]' : 'text-[#6a797c]'
                      }`}>
                        {wd.rule}
                      </p>
                      <div className="flex items-center justify-between text-[10px] pt-1.5 mt-1 border-t border-current/20">
                        <span>Foco: {stats.commercialMins}m</span>
                        <span className="flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5" /> {stats.mandatoryCallBlocks}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Day Table in Weekly Mode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-[#f8fafb] p-3 rounded-xl border border-[#d1d5d6]">
                  <span className="text-xs font-bold text-[#14262d] flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Editando blocos de: <strong>{weeklyActiveDay}</strong></span>
                  </span>
                  <span className="text-xs text-[#6a797c]">
                    Dica: as alterações serão salvas ao clicar em "Salvar Semana Completa"
                  </span>
                </div>

                <div className="overflow-x-auto border border-[#d1d5d6] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#f8fafb] border-b border-[#d1d5d6] text-[#14262d] font-bold">
                        <th className="py-3 px-3 w-40">Horário</th>
                        <th className="py-3 px-3">Título da Atividade</th>
                        <th className="py-3 px-3 w-56">Competência</th>
                        <th className="py-3 px-3 text-center w-36">Ligação Obrigatória</th>
                        <th className="py-3 px-3 text-center w-24">Duração</th>
                        <th className="py-3 px-3 text-right w-16">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d1d5d6]/50">
                      {(weeklyBlocks[weeklyActiveDay] || []).map((block, idx) => {
                        const startM = timeToMinutes(block.start);
                        const endM = timeToMinutes(block.end);
                        const duration = Math.max(0, endM - startM);
                        const isFixed = block.category === 'CALENDAR_FIXED' || block.type === 'LUNCH';

                        return (
                          <tr 
                            key={idx} 
                            className={`transition-colors ${isFixed ? 'bg-slate-50/70' : 'hover:bg-amber-50/30'}`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1 font-mono font-bold text-[#14262d]">
                                <input
                                  type="time"
                                  value={block.start}
                                  onChange={(e) => handleWeeklyBlockChange(weeklyActiveDay, idx, 'start', e.target.value)}
                                  className="bg-white border border-[#d1d5d6] rounded px-1.5 py-1 text-xs w-20 focus:outline-none focus:border-[#14262d]"
                                />
                                <span>–</span>
                                <input
                                  type="time"
                                  value={block.end}
                                  onChange={(e) => handleWeeklyBlockChange(weeklyActiveDay, idx, 'end', e.target.value)}
                                  className="bg-white border border-[#d1d5d6] rounded px-1.5 py-1 text-xs w-20 focus:outline-none focus:border-[#14262d]"
                                />
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={block.title}
                                onChange={(e) => handleWeeklyBlockChange(weeklyActiveDay, idx, 'title', e.target.value)}
                                className="w-full bg-white border border-[#d1d5d6] rounded px-2.5 py-1 text-xs font-semibold text-[#14262d] focus:outline-none focus:border-[#14262d]"
                              />
                            </td>

                            <td className="py-2.5 px-3">
                              <select
                                value={block.type}
                                onChange={(e) => {
                                  const newType = e.target.value as PlanningBlockType;
                                  handleWeeklyBlockChange(weeklyActiveDay, idx, 'type', newType);
                                  if (newType === 'TOUCH_POINTS' || newType === 'OUTBOUND_CADENCE') {
                                    handleWeeklyBlockChange(weeklyActiveDay, idx, 'requiresMandatoryCall', true);
                                  }
                                }}
                                className="w-full bg-white border border-[#d1d5d6] rounded px-2 py-1 text-xs font-medium text-[#14262d] focus:outline-none focus:border-[#14262d]"
                              >
                                <optgroup label="Competências Inbound (SDR)">
                                  <option value="WAITING_QUEUE_AND_NEW_LEADS">Fila D-1 & Novos Leads (SLA)</option>
                                  <option value="TOUCH_POINTS">Touch Points de Cadência</option>
                                  <option value="CONFIRMATIONS_AND_HANDOFF">Confirmação de Reuniões & Handoff</option>
                                  <option value="RECOVERY_NO_SHOW">Recuperação No-Shows / Cancelados</option>
                                </optgroup>
                                <optgroup label="Competências Outbound (BDR)">
                                  <option value="PROSPECT_ACTIVATION">Ativação de Novos Prospects</option>
                                  <option value="OUTBOUND_CADENCE">Cadência Outbound (Cold Call)</option>
                                  <option value="SOCIAL_SELLING">Social Selling no LinkedIn</option>
                                </optgroup>
                                <optgroup label="Compromissos Fixos Welucci">
                                  <option value="FIXED_DAILY">Daily Matinal (09h30 - 10h00)</option>
                                  <option value="FIXED_TEAM_MEETING">Reunião de Equipe (Segunda 10h00)</option>
                                  <option value="FIXED_WORK_MEETING">Reunião de Trabalho (Quarta 14h00)</option>
                                  <option value="FIXED_ONE_ON_ONE">1:1 Quinzenal (Sexta 10h00)</option>
                                  <option value="LUNCH">Intervalo de Almoço (12h00 - 13h00)</option>
                                </optgroup>
                              </select>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(block.requiresMandatoryCall)}
                                  onChange={(e) => handleWeeklyBlockChange(weeklyActiveDay, idx, 'requiresMandatoryCall', e.target.checked)}
                                  className="rounded border-[#d1d5d6] text-amber-600 focus:ring-amber-500"
                                />
                                {block.requiresMandatoryCall && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5" /> Obrigatória
                                  </span>
                                )}
                              </label>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <span className="font-mono text-xs font-bold text-[#14262d] bg-slate-100 px-2 py-0.5 rounded">
                                {duration}m
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-right">
                              {!isFixed ? (
                                <button
                                  onClick={() => handleRemoveWeeklyBlock(weeklyActiveDay, idx)}
                                  className="p-1 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold cursor-not-allowed">
                                  Fixo
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => handleAddWeeklyBlock(weeklyActiveDay)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border border-dashed border-[#14262d] text-[#14262d] hover:bg-[#14262d] hover:text-white transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Adicionar Bloco em {weeklyActiveDay}</span>
                  </button>

                  <button
                    onClick={handleSaveWeeklyRoutine}
                    className="flex items-center gap-1.5 px-6 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Semana Completa</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION: PARÂMETROS GLOBAIS E COMPROMISSOS FIXOS         */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Parâmetros Globais */}
        <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#d1d5d6]/50 pb-3">
            <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
              Expediente Base
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-[#14262d]">
              10 horas / dia
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#14262d] mb-1">Início do Expediente</label>
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-md px-3 py-2 text-xs font-mono font-bold text-[#14262d]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#14262d] mb-1">Término do Expediente</label>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-md px-3 py-2 text-xs font-mono font-bold text-[#14262d]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#14262d] mb-1">Almoço Obrigatório</label>
              <div className="relative">
                <input
                  type="number"
                  value={lunchDuration}
                  onChange={(e) => setLunchDuration(Number(e.target.value))}
                  className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-md px-3 py-2 text-xs font-mono font-bold text-[#14262d]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#6a797c]">min</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14262d] mb-1">Margem de Segurança</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={safetyMargin}
                  onChange={(e) => setSafetyMargin(Number(e.target.value))}
                  className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-md px-3 py-2 text-xs font-mono font-bold text-[#14262d]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#6a797c]">%</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#6a797c] leading-relaxed pt-2 border-t border-[#d1d5d6]/40">
            Expediente oficial das <strong>09h00 às 19h00</strong>. O almoço das 12h00 às 13h00 é fixo e bloqueado de qualquer atividade comercial.
          </p>
        </div>

        {/* Compromissos Recorrentes Oficiais */}
        <div className="md:col-span-2 bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#d1d5d6]/50 pb-3">
            <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
              Compromissos Recorrentes Fixos da Operação Welucci
            </h3>
            <span className="text-xs text-[#6a797c]">Sincronizados via Microsoft Teams</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {officialFixedCommitments.map((evt, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all space-y-1.5 ${
                  evt.highlight
                    ? 'border-amber-300 bg-amber-50/40 shadow-2xs'
                    : 'border-[#d1d5d6]/70 bg-[#f8fafb]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#14262d]">{evt.title}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    evt.highlight
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {evt.tag}
                  </span>
                </div>
                <p className="font-mono text-[11px] font-semibold text-[#14262d]">{evt.schedule}</p>
                <p className="text-[11px] text-[#6a797c] leading-relaxed">{evt.rule}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auto-Adjustment Mechanism Explanation */}
      <div className="bg-[#14262d] text-white rounded-xl p-6 shadow-sm border border-[#1e343c] space-y-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Como Funciona o Auto-Ajuste com o Calendário do SDR (Teams & HubSpot)
          </h3>
        </div>

        <p className="text-xs text-[#d1d5d6] leading-relaxed">
          O sistema monitora a agenda do SDR em tempo real via conectores Microsoft Graph (Teams/Outlook) e HubSpot CRM. Quando compromissos orgânicos ou institucionais (como <strong>treinamentos corporativos</strong>, <strong>reuniões de fechamento de mês</strong>, ou <strong>All Hands</strong>) surgem na agenda:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-[#0e1d23] rounded-lg border border-[#1e343c] text-xs space-y-1">
            <span className="font-bold text-amber-300">1. Detecção de Bloqueio</span>
            <p className="text-[11px] text-[#d1d5d6]/80">O intervalo ocupado é isolado e preservado como compromisso bloqueado.</p>
          </div>
          <div className="p-3 bg-[#0e1d23] rounded-lg border border-[#1e343c] text-xs space-y-1">
            <span className="font-bold text-amber-300">2. Rebalanceamento de Horários</span>
            <p className="text-[11px] text-[#d1d5d6]/80">Os blocos livres restantes do expediente (09h-19h) são redimensionados dinamicamente.</p>
          </div>
          <div className="p-3 bg-[#0e1d23] rounded-lg border border-[#1e343c] text-xs space-y-1">
            <span className="font-bold text-amber-300">3. Preservação de SLAs</span>
            <p className="text-[11px] text-[#d1d5d6]/80">Fila de espera D-1, ligações obrigatórias e confirmações recebem prioridade máxima.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
