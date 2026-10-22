import { Goal, Meeting, Task, CalendarEvent, PlanningBlock, TaskAllocation, TaskType, SdrScope, PlanningBlockType } from '../types';

/**
 * Welucci SDR Intelligence — Calculation & Routine Planning Engine
 * Rigorous formulas and adaptive day-schedule optimization tailored to Welucci B2B operation.
 */

export interface SdrKpiSummary {
  sdrId: string;
  sdrName: string;
  scope: string;
  pendingTasksCount: number;
  overdueTasksCount: number;
  todayTasksCount: number;
  workloadMinutes: number;
  availableCapacityMinutes: number;
  capacityUtilizationPercent: number;
  capacityStatus: 'CONFORTAVEL' | 'MODERADA' | 'ELEVADA' | 'SOBRECARGA';
  scheduledMeetingsCount: number; // In the period
  heldMeetingsCount: number;      // In the period
  cancelledMeetingsCount: number;
  noShowMeetingsCount: number;
  attendanceRatePercent: number;  // realizadas / elegiveis * 100
  dailyGoal: number;
  bookedTodayCount: number;       // meetings booked TODAY (D0)
  gapD0: number;                  // Math.max(0, dailyGoal - bookedTodayCount)
  attainmentPercent: number;      // bookedTodayCount / dailyGoal * 100
  paceRequiredPerHour: number;    // gapD0 / remainingHours
  hasSlaRisk: boolean;
  statusLabel: string;
}

export interface TeamKpiSummary {
  activeSdrsCount: number;
  totalPendingTasks: number;
  totalOverdueTasks: number;
  totalTodayTasks: number;
  totalWorkloadMinutes: number;
  totalCapacityMinutes: number;
  averageCapacityUtilization: number;
  totalScheduledMeetings: number;
  totalHeldMeetings: number;
  totalAttendanceRatePercent: number;
  teamDailyGoal: number;
  teamBookedToday: number;
  teamGapD0: number;
  teamAttainmentPercent: number;
  sdrsAtOperationalRiskCount: number;
}

/**
 * 1. GAP D0 Calculation:
 * D0 = current day.
 * Formula: GAP D0 = Math.max(0, dailyGoal - validBookingsCountToday)
 */
export function calculateGapD0(dailyGoal: number, validBookingsCountToday: number): number {
  if (dailyGoal <= 0) return 0;
  return Math.max(0, dailyGoal - validBookingsCountToday);
}

/**
 * 2. Attainment % (Atingimento da Meta):
 * Returns 0 if goal is 0, avoiding divide by zero.
 */
export function calculateAttainment(current: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.round((current / goal) * 100);
}

/**
 * 3. Attendance Rate (Taxa de Comparecimento):
 * Formula: held / (held + noShows + eligibleCancellations) * 100
 */
export function calculateAttendanceRate(held: number, noShows: number, cancellations: number): number {
  const eligible = held + noShows + cancellations;
  if (eligible <= 0) return 0;
  return Math.round((held / eligible) * 100);
}

/**
 * Helper to convert "HH:MM" string to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  // If ISO string, extract HH:mm
  if (timeStr.includes('T')) {
    const timePart = timeStr.split('T')[1]?.slice(0, 5);
    if (timePart) return timeToMinutes(timePart);
  }
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Helper to convert minutes from midnight to "HH:MM"
 */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Weekday identifier helper
 */
export type WeekdayInfo = {
  dayNumber: number; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  dayName: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'FIM_DE_SEMANA';
  label: string;
  isBiweeklyFriday: boolean;
  formattedDate: string;
  isWeekend: boolean;
};

export function getWeekdayInfo(dateStr: string = '2026-10-21'): WeekdayInfo {
  const [y, m, day] = dateStr.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, day || 1, 12, 0, 0);
  const dayNumber = d.getDay();
  const isWeekend = dayNumber === 0 || dayNumber === 6;
  
  const formattedDate = `${String(day || 1).padStart(2, '0')}/${String(m || 1).padStart(2, '0')}/${y || 2026}`;

  // Calculate biweekly week number
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
  const isBiweeklyFriday = dayNumber === 5 && (weekNumber % 2 === 0);

  let dayName: WeekdayInfo['dayName'] = 'TERCA';
  let label = 'Terça-feira';

  switch (dayNumber) {
    case 1:
      dayName = 'SEGUNDA';
      label = 'Segunda-feira';
      break;
    case 2:
      dayName = 'TERCA';
      label = 'Terça-feira';
      break;
    case 3:
      dayName = 'QUARTA';
      label = 'Quarta-feira';
      break;
    case 4:
      dayName = 'QUINTA';
      label = 'Quinta-feira';
      break;
    case 5:
      dayName = 'SEXTA';
      label = 'Sexta-feira';
      break;
    default:
      dayName = 'FIM_DE_SEMANA';
      label = dayNumber === 0 ? 'Domingo' : 'Sábado';
  }

  return { dayNumber, dayName, label, isBiweeklyFriday, formattedDate, isWeekend };
}

/**
 * 4. Productive Capacity (Capacidade Disponível):
 * Workday minutes (09:00 to 19:00 = 600 min) - calendar commitments - lunch (60 min) - safety margin (10%).
 */
export function calculateAvailableCapacityMinutes(
  events: CalendarEvent[],
  workdayStartHour: number = 9,
  workdayEndHour: number = 19,
  lunchMinutes: number = 60,
  safetyMarginPercent: number = 10
): number {
  const grossMinutes = (workdayEndHour - workdayStartHour) * 60; // 600 min
  
  let calendarBlockedMinutes = 0;
  for (const ev of events) {
    if (ev.blocksAvailability && ev.eventType !== 'LUNCH_BREAK') {
      const startMin = timeToMinutes(ev.startsAt);
      const endMin = timeToMinutes(ev.endsAt);
      const duration = endMin - startMin;
      if (duration > 0) {
        calendarBlockedMinutes += duration;
      }
    }
  }

  const netMinutes = grossMinutes - lunchMinutes - calendarBlockedMinutes;
  if (netMinutes <= 0) return 0;

  const safetyDiscount = Math.round(netMinutes * (safetyMarginPercent / 100));
  return Math.max(0, netMinutes - safetyDiscount);
}

/**
 * 5. Workload (Carga Operacional):
 * Sum of estimated durations for tasks due today or overdue.
 */
export function calculateWorkloadMinutes(tasks: Task[]): number {
  return tasks
    .filter(t => t.status !== 'COMPLETED')
    .reduce((acc, t) => acc + (t.estimatedDurationMinutes || 10), 0);
}

/**
 * 6. Capacity Utilization %:
 */
export function calculateCapacityUtilization(workloadMinutes: number, capacityMinutes: number): {
  percent: number;
  status: 'CONFORTAVEL' | 'MODERADA' | 'ELEVADA' | 'SOBRECARGA';
} {
  if (capacityMinutes <= 0) {
    return { percent: 100, status: 'SOBRECARGA' };
  }
  const percent = Math.round((workloadMinutes / capacityMinutes) * 100);
  if (percent <= 70) return { percent, status: 'CONFORTAVEL' };
  if (percent <= 90) return { percent, status: 'MODERADA' };
  if (percent <= 100) return { percent, status: 'ELEVADA' };
  return { percent, status: 'SOBRECARGA' };
}

/**
 * 7. Pace Required per remaining hour:
 */
export function calculatePaceRequired(gapD0: number, currentHour: number = 10, workdayEndHour: number = 19): number {
  if (gapD0 <= 0) return 0;
  const remainingHours = Math.max(0, workdayEndHour - currentHour);
  if (remainingHours <= 0) return gapD0;
  return Number((gapD0 / remainingHours).toFixed(1));
}

/**
 * 8. Prioritize Tasks according to Welucci Sales Dev B2B core competencies:
 * - 1. Fila de espera que virou o dia (D-1) & Novos Leads do dia (SLA Crítico)
 * - 2. Confirmações de reuniões do dia e Passagem de Bastão (Handoff Closer)
 * - 3. Touch Points com LIGAÇÃO OBRIGATÓRIA
 * - 4. Recuperação de No-Shows e Cancelados sem reagendamento
 * - 5. Ativação de novos prospects (Outbound)
 * - 6. Cadência Outbound & Follow-ups
 * - 7. Social Selling no LinkedIn
 * - 8. Administrativo
 */
export function prioritizeTasks(tasks: Task[]): Task[] {
  const priorityRank: Record<TaskType, number> = {
    WAITING_QUEUE_LEAD: 1,
    NEW_LEAD: 2,
    CONFIRMATION: 3,
    HANDOFF: 4,
    TOUCH_POINT: 5,
    OVERDUE_FOLLOWUP: 6,
    NO_SHOW_RECOVERY: 7,
    CANCELLED_RECOVERY: 8,
    PROSPECT_ACTIVATION: 9,
    OUTBOUND_CADENCE: 10,
    SOCIAL_SELLING: 11,
    ADMINISTRATIVE: 12,
  };

  return [...tasks].sort((a, b) => {
    // Critical SLA first
    if (a.priority === 'CRITICAL_SLA' && b.priority !== 'CRITICAL_SLA') return -1;
    if (b.priority === 'CRITICAL_SLA' && a.priority !== 'CRITICAL_SLA') return 1;

    // Overdue next
    const now = new Date().toISOString();
    const aOverdue = a.dueAt < now && a.status !== 'COMPLETED';
    const bOverdue = b.dueAt < now && b.status !== 'COMPLETED';
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Rank by competency type
    const rankA = priorityRank[a.taskType] ?? 99;
    const rankB = priorityRank[b.taskType] ?? 99;
    return rankA - rankB;
  });
}

/**
 * Definition of a block template for routine building
 */
export interface RoutineBlockBlueprint {
  id?: string;
  start: string;
  end: string;
  type: PlanningBlockType;
  title: string;
  description: string;
  category: 'INBOUND' | 'OUTBOUND' | 'CALENDAR_FIXED' | 'CALENDAR_ORGANIC' | 'LUNCH';
  requiresMandatoryCall?: boolean;
  targetTaskTypes?: TaskType[];
}

/**
 * Get the Ideal Welucci Blueprint for a specific day of week
 * Reflects exact user instructions:
 * - Expediente: 09:00 às 19:00
 * - Daily todos os dias às 09:30 (máximo até 10:00)
 * - Segunda-feira: Reunião de equipe às 10:00 (NESSE DIA NÃO TEM DAILY!)
 * - Quarta-feira: Reunião de Trabalho às 14:00
 * - Sexta-feira: 1:1 às 10:00 (a cada quinze dias), com daily normal às 09:30 e 1:1 na sequência
 */
export function getIdealDayBlueprints(
  dayName: WeekdayInfo['dayName'],
  isBiweeklyFriday: boolean = true,
  scope: 'INBOUND' | 'OUTBOUND' | 'ALL' = 'INBOUND'
): RoutineBlockBlueprint[] {
  // Monday: NO Daily at 09:30; Team Meeting at 10:00
  if (dayName === 'SEGUNDA') {
    return [
      {
        start: '09:00', end: '10:00',
        type: 'WAITING_QUEUE_AND_NEW_LEADS',
        title: 'Fila de Espera (Viraram o Dia) & Novos Leads',
        description: 'Responder leads do backlog acumulado no fim de semana e novos leads inbound matinais com SLA ágil.',
        category: 'INBOUND',
        targetTaskTypes: ['WAITING_QUEUE_LEAD', 'NEW_LEAD', 'OVERDUE_FOLLOWUP']
      },
      {
        start: '10:00', end: '11:00',
        type: 'FIXED_TEAM_MEETING',
        title: 'Reunião de Equipe Welucci (Semana Comercial)',
        description: 'Alinhamento geral com João V. Batista. Na segunda-feira não há daily matinal, reunião direta às 10h.',
        category: 'CALENDAR_FIXED'
      },
      {
        start: '11:00', end: '12:00',
        type: 'TOUCH_POINTS',
        title: 'Touch Points de Cadência (📞 Ligação Obrigatória)',
        description: 'Execução de follow-ups em cadência ativa. Cada Touch Point exige obrigatoriamente uma tentativa de ligação telefônica.',
        category: 'INBOUND',
        requiresMandatoryCall: true,
        targetTaskTypes: ['TOUCH_POINT', 'OVERDUE_FOLLOWUP', 'OUTBOUND_CADENCE']
      },
      {
        start: '12:00', end: '13:00',
        type: 'LUNCH',
        title: 'Intervalo de Almoço',
        description: 'Pausa obrigatória de 60 minutos para descanso da equipe comercial.',
        category: 'LUNCH'
      },
      {
        start: '13:00', end: '14:30',
        type: 'CONFIRMATIONS_AND_HANDOFF',
        title: 'Confirmação de Reuniões & Passagem de Bastão (Closer)',
        description: 'Confirmar os clientes com reunião agendada no dia e enviar briefing qualificado (handoff) aos Closers.',
        category: 'INBOUND',
        targetTaskTypes: ['CONFIRMATION', 'HANDOFF']
      },
      {
        start: '14:30', end: '16:30',
        type: 'TOUCH_POINTS',
        title: 'Bloco Intenso de Touch Points (📞 Ligação Obrigatória)',
        description: 'Segunda rodada de cadência telefônica e mensagens para decisores B2B.',
        category: 'INBOUND',
        requiresMandatoryCall: true,
        targetTaskTypes: ['TOUCH_POINT', 'OUTBOUND_CADENCE']
      },
      {
        start: '16:30', end: '18:00',
        type: 'RECOVERY_NO_SHOW',
        title: 'Follow-up de No-Shows & Reuniões Canceladas',
        description: 'Contato ativo com clientes que deram no-show ou cancelaram reuniões sem data de reagendamento acordada.',
        category: 'INBOUND',
        targetTaskTypes: ['NO_SHOW_RECOVERY', 'CANCELLED_RECOVERY']
      },
      {
        start: '18:00', end: '19:00',
        type: scope === 'OUTBOUND' ? 'SOCIAL_SELLING' : 'WAITING_QUEUE_AND_NEW_LEADS',
        title: scope === 'OUTBOUND' ? 'Social Selling no LinkedIn & Prospecção' : 'Triagem Final & Fechamento de Leads do Dia',
        description: 'Atendimento dos últimos leads do dia no CRM HubSpot e planejamento do D+1.',
        category: scope === 'OUTBOUND' ? 'OUTBOUND' : 'INBOUND',
        targetTaskTypes: ['SOCIAL_SELLING', 'PROSPECT_ACTIVATION', 'NEW_LEAD']
      }
    ];
  }

  // Wednesday: Daily at 09:30; Work Meeting at 14:00
  if (dayName === 'QUARTA') {
    return [
      {
        start: '09:00', end: '09:30',
        type: 'WAITING_QUEUE_AND_NEW_LEADS',
        title: 'Fila de Espera D-1 & Novos Leads',
        description: 'Resposta prioritária a leads que viraram o dia e novas conversões do site.',
        category: 'INBOUND',
        targetTaskTypes: ['WAITING_QUEUE_LEAD', 'NEW_LEAD']
      },
      {
        start: '09:30', end: '10:00',
        type: 'FIXED_DAILY',
        title: 'Daily Matinal da Operação (09h30 às 10h00)',
        description: 'Revisão diária de agendamentos D0, pipeline e desbloqueio de obstáculos.',
        category: 'CALENDAR_FIXED'
      },
      {
        start: '10:00', end: '12:00',
        type: 'TOUCH_POINTS',
        title: 'Touch Points Matinais (📞 Ligação Obrigatória)',
        description: 'Janela nobre de cadência. Ligação telefônica mandatória em cada Touch Point executado.',
        category: 'INBOUND',
        requiresMandatoryCall: true,
        targetTaskTypes: ['TOUCH_POINT', 'OUTBOUND_CADENCE']
      },
      {
        start: '12:00', end: '13:00',
        type: 'LUNCH',
        title: 'Intervalo de Almoço',
        description: 'Horário padrão de almoço.',
        category: 'LUNCH'
      },
      {
        start: '13:00', end: '14:00',
        type: 'CONFIRMATIONS_AND_HANDOFF',
        title: 'Confirmação de Reuniões & Handoff ao Closer',
        description: 'Confirmações do período da tarde e repasse de bastão técnico.',
        category: 'INBOUND',
        targetTaskTypes: ['CONFIRMATION', 'HANDOFF']
      },
      {
        start: '14:00', end: '15:00',
        type: 'FIXED_WORK_MEETING',
        title: 'Reunião de Trabalho Welucci (Quarta-feira 14h)',
        description: 'Encontro operacional semanal para alinhamento tático e estudos de caso de vendas.',
        category: 'CALENDAR_FIXED'
      },
      {
        start: '15:00', end: '16:30',
        type: 'TOUCH_POINTS',
        title: 'Touch Points Vespertinos (📞 Ligação Obrigatória)',
        description: 'Continuação da cadência ativa com chamadas e WhatsApp comercial.',
        category: 'INBOUND',
        requiresMandatoryCall: true,
        targetTaskTypes: ['TOUCH_POINT']
      },
      {
        start: '16:30', end: '17:45',
        type: 'RECOVERY_NO_SHOW',
        title: 'Recuperação de No-Shows & Cancelados',
        description: 'Reengajamento de contatos que não compareceram à reunião marcada.',
        category: 'INBOUND',
        targetTaskTypes: ['NO_SHOW_RECOVERY', 'CANCELLED_RECOVERY']
      },
      {
        start: '17:45', end: '19:00',
        type: scope === 'OUTBOUND' ? 'SOCIAL_SELLING' : 'PROSPECT_ACTIVATION',
        title: scope === 'OUTBOUND' ? 'Social Selling no LinkedIn' : 'Ativação de Novos Prospects & Encerramento',
        description: 'Mapeamento de decisores no LinkedIn e organização das tarefas do próximo dia.',
        category: 'OUTBOUND',
        targetTaskTypes: ['SOCIAL_SELLING', 'PROSPECT_ACTIVATION']
      }
    ];
  }

  // Friday: Daily at 09:30; 1:1 at 10:00 (biweekly)
  if (dayName === 'SEXTA') {
    const blocks: RoutineBlockBlueprint[] = [
      {
        start: '09:00', end: '09:30',
        type: 'WAITING_QUEUE_AND_NEW_LEADS',
        title: 'Fila de Espera D-1 & Novos Leads',
        description: 'Zerando a fila de espera do fechamento de quinta-feira e leads da madrugada.',
        category: 'INBOUND',
        targetTaskTypes: ['WAITING_QUEUE_LEAD', 'NEW_LEAD']
      },
      {
        start: '09:30', end: '10:00',
        type: 'FIXED_DAILY',
        title: 'Daily Matinal da Operação (09h30 às 10h00)',
        description: 'Daily normal da sexta-feira com alinhamento de metas da semana.',
        category: 'CALENDAR_FIXED'
      }
    ];

    if (isBiweeklyFriday) {
      blocks.push({
        start: '10:00', end: '10:45',
        type: 'FIXED_ONE_ON_ONE',
        title: '1:1 com João V. Batista (Quinzenal)',
        description: 'Reunião individual de feedback, metas e desenvolvimento com o Coordenador.',
        category: 'CALENDAR_FIXED'
      });
      blocks.push({
        start: '10:45', end: '12:00',
        type: 'TOUCH_POINTS',
        title: 'Touch Points Matinais (📞 Ligação Obrigatória)',
        description: 'Ligação mandatória em cada Touch Point após a reunião de 1:1.',
        category: 'INBOUND',
        requiresMandatoryCall: true,
        targetTaskTypes: ['TOUCH_POINT', 'OUTBOUND_CADENCE']
      });
    } else {
      blocks.push({
        start: '10:00', end: '12:00',
        type: 'TOUCH_POINTS',
        title: 'Touch Points Matinais (📞 Ligação Obrigatória)',
        description: 'Janela estendida de cadência telefônica matinal.',
        category: 'INBOUND',
        requiresMandatoryCall: true,
        targetTaskTypes: ['TOUCH_POINT', 'OUTBOUND_CADENCE']
      });
    }

    blocks.push(
      {
        start: '12:00', end: '13:00',
        type: 'LUNCH',
        title: 'Intervalo de Almoço',
        description: 'Horário de almoço da sexta-feira.',
        category: 'LUNCH'
      },
      {
        start: '13:00', end: '14:30',
        type: 'CONFIRMATIONS_AND_HANDOFF',
        title: 'Confirmação de Reuniões & Passagem de Bastão',
        description: 'Garantir que todas as reuniões de sexta e de segunda-feira estejam confirmadas.',
        category: 'INBOUND',
        targetTaskTypes: ['CONFIRMATION', 'HANDOFF']
      },
      {
        start: '14:30', end: '16:30',
        type: 'TOUCH_POINTS',
        title: 'Touch Points Vespertinos (📞 Ligação Obrigatória)',
        description: 'Aceleração final de ligações para atingimento da meta semanal.',
        category: 'INBOUND',
        requiresMandatoryCall: true,
        targetTaskTypes: ['TOUCH_POINT']
      },
      {
        start: '16:30', end: '17:45',
        type: 'RECOVERY_NO_SHOW',
        title: 'Recuperação de No-Shows da Semana',
        description: 'Recuperar contatos que não compareceram durante a semana.',
        category: 'INBOUND',
        targetTaskTypes: ['NO_SHOW_RECOVERY', 'CANCELLED_RECOVERY']
      },
      {
        start: '17:45', end: '19:00',
        type: 'SOCIAL_SELLING',
        title: 'Social Selling no LinkedIn & Fechamento Semanal',
        description: 'Conexões estratégicas B2B no LinkedIn e consolidação de registros no CRM.',
        category: 'OUTBOUND',
        targetTaskTypes: ['SOCIAL_SELLING', 'ADMINISTRATIVE']
      }
    );

    return blocks;
  }

  // Tuesday & Thursday: Standard Daily at 09:30, maximum focus on pipeline execution
  return [
    {
      start: '09:00', end: '09:30',
      type: 'WAITING_QUEUE_AND_NEW_LEADS',
      title: 'Fila de Espera D-1 & Novos Leads',
      description: 'Responder os leads da fila de espera que viraram o dia e atender novos leads inbound com SLA rápido.',
      category: 'INBOUND',
      targetTaskTypes: ['WAITING_QUEUE_LEAD', 'NEW_LEAD']
    },
    {
      start: '09:30', end: '10:00',
      type: 'FIXED_DAILY',
      title: 'Daily Matinal da Operação (09h30 às 10h00)',
      description: 'Alinhamento com a equipe sobre metas do dia, agendamentos D0 e direcionamento de esforço.',
      category: 'CALENDAR_FIXED'
    },
    {
      start: '10:00', end: '12:00',
      type: 'TOUCH_POINTS',
      title: 'Bloco Nobre de Touch Points (📞 Ligação Obrigatória)',
      description: 'Execução intensiva da cadência de follow-up. Toda tarefa inclui ligação mandatória.',
      category: 'INBOUND',
      requiresMandatoryCall: true,
      targetTaskTypes: ['TOUCH_POINT', 'OUTBOUND_CADENCE']
    },
    {
      start: '12:00', end: '13:00',
      type: 'LUNCH',
      title: 'Intervalo de Almoço',
      description: 'Intervalo de 60 minutos.',
      category: 'LUNCH'
    },
    {
      start: '13:00', end: '14:15',
      type: 'CONFIRMATIONS_AND_HANDOFF',
      title: 'Confirmação de Reuniões do Dia & Passagem de Bastão ao Closer',
      description: 'Confirmar a presença dos prospects do dia e alinhar expectativas e perfil com o Closer responsável.',
      category: 'INBOUND',
      targetTaskTypes: ['CONFIRMATION', 'HANDOFF']
    },
    {
      start: '14:15', end: '16:15',
      type: 'TOUCH_POINTS',
      title: 'Cadência & Touch Points Vespertinos (📞 Ligação Obrigatória)',
      description: 'Segundo pico de contato telefônico e disparos de cadência personalizada.',
      category: 'INBOUND',
      requiresMandatoryCall: true,
      targetTaskTypes: ['TOUCH_POINT']
    },
    {
      start: '16:15', end: '17:30',
      type: 'RECOVERY_NO_SHOW',
      title: 'Follow-up de No-Shows & Reuniões Canceladas',
      description: 'Contato com clientes que faltaram ou cancelaram para resgatar o agendamento no funil.',
      category: 'INBOUND',
      targetTaskTypes: ['NO_SHOW_RECOVERY', 'CANCELLED_RECOVERY']
    },
    {
      start: '17:30', end: '19:00',
      type: scope === 'OUTBOUND' ? 'SOCIAL_SELLING' : 'PROSPECT_ACTIVATION',
      title: scope === 'OUTBOUND' ? 'Social Selling no LinkedIn & Prospecção Ativa' : 'Ativação de Novos Prospects & Rescaldo D0',
      description: 'Ativar novas contas da fila de prospecção, conexões via LinkedIn e registros finais no HubSpot.',
      category: scope === 'OUTBOUND' ? 'OUTBOUND' : 'INBOUND',
      targetTaskTypes: ['PROSPECT_ACTIVATION', 'SOCIAL_SELLING', 'NEW_LEAD']
    }
  ];
}

/**
 * 9. Daily Routine Planner Algorithm with Calendar Auto-Adjustment:
 * Takes SDR tasks and all calendar events (including ad-hoc corporate events, Teams meetings,
 * trainings, All Hands, monthly closing), identifies blocked periods, and dynamically rebalances
 * the operational blocks into free windows, packing tasks without exceeding capacities.
 */
export function generateDailyPlan(
  userId: string,
  planDate: string = '2026-10-21',
  tasks: Task[],
  calendarEvents: CalendarEvent[],
  options?: {
    scope?: SdrScope;
    forceBiweeklyFriday?: boolean;
    customBlueprints?: RoutineBlockBlueprint[];
  }
): PlanningBlock[] {
  const weekday = getWeekdayInfo(planDate);
  const isBiweekly = options?.forceBiweeklyFriday !== undefined ? options.forceBiweeklyFriday : weekday.isBiweeklyFriday;
  const isOutbound = options?.scope === 'Outbound Prospecção';

  // 1. Get baseline blueprint for this weekday (or use custom blueprints if defined for this user/scope)
  const baselineBlueprints = (options?.customBlueprints && options.customBlueprints.length > 0)
    ? options.customBlueprints
    : getIdealDayBlueprints(
        weekday.dayName,
        isBiweekly,
        isOutbound ? 'OUTBOUND' : 'INBOUND'
      );

  // 2. Identify all external/ad-hoc events for this SDR or ALL on this date
  const adhocEvents = calendarEvents.filter(ev => {
    // Check if event targets this SDR or ALL
    if (ev.userId !== 'ALL' && ev.userId !== userId) return false;
    
    // Ignore routine template meetings already baked into the blueprint
    if (ev.eventType === 'DAILY' || ev.eventType === 'TEAM_MEETING' || ev.eventType === 'WORK_MEETING' || ev.eventType === 'ONE_ON_ONE' || ev.eventType === 'LUNCH_BREAK') {
      return false;
    }

    // Check if event is active on planDate (matches ISO date or single recurrence)
    if (ev.startsAt.includes('T') && !ev.startsAt.startsWith(planDate)) {
      return false;
    }

    return ev.blocksAvailability;
  });

  // 3. If there are ad-hoc blocking events (e.g. All Hands, Treinamento, Fechamento),
  // dynamically auto-adjust the schedule!
  const finalBlocks: PlanningBlock[] = [];
  const sortedTasks = prioritizeTasks(tasks.filter(t => t.ownerId === userId && t.status !== 'COMPLETED'));
  const unassignedTasks = [...sortedTasks];

  let blockSequence = 1;

  for (const bp of baselineBlueprints) {
    const bpStartMins = timeToMinutes(bp.start);
    const bpEndMins = timeToMinutes(bp.end);
    const bpDuration = bpEndMins - bpStartMins;

    // Check if an ad-hoc calendar event intersects with this blueprint block
    const intersectingEvent = adhocEvents.find(ev => {
      const evStart = timeToMinutes(ev.startsAt);
      const evEnd = timeToMinutes(ev.endsAt);
      return Math.max(bpStartMins, evStart) < Math.min(bpEndMins, evEnd);
    });

    if (intersectingEvent) {
      const evStart = timeToMinutes(intersectingEvent.startsAt);
      const evEnd = timeToMinutes(intersectingEvent.endsAt);

      // Insert pre-event residual operational block if >= 20 mins
      if (evStart > bpStartMins + 20 && bp.category !== 'CALENDAR_FIXED' && bp.category !== 'LUNCH') {
        const preDuration = evStart - bpStartMins;
        const availableMins = Math.round(preDuration * 0.9);
        const { allocatedMins, allocations } = packTasksIntoBlock(
          `block-${userId}-${planDate}-${blockSequence}`,
          unassignedTasks,
          availableMins,
          bp.title,
          bp.targetTaskTypes
        );

        finalBlocks.push({
          id: `block-${userId}-${planDate}-${blockSequence++}`,
          userId,
          planDate,
          startsAt: minutesToTime(bpStartMins),
          endsAt: minutesToTime(evStart),
          availableMinutes: availableMins,
          allocatedMinutes: allocatedMins,
          blockType: bp.type,
          title: `${bp.title} (Ajustado)`,
          description: `Horário adaptado automaticamente para acomodar compromisso: ${intersectingEvent.title}.`,
          category: bp.category,
          requiresMandatoryCall: bp.requiresMandatoryCall,
          status: 'SCHEDULED',
          allocations,
          isAdaptiveAdjusted: true,
          adjustmentReason: `Intervalo reduzido para acomodar "${intersectingEvent.title}" (${minutesToTime(evStart)} - ${minutesToTime(evEnd)}) sincronizado via Teams/HubSpot.`
        });
      }

      // Insert the ad-hoc calendar event as a blocked commitment block
      finalBlocks.push({
        id: `block-${userId}-${planDate}-${blockSequence++}`,
        userId,
        planDate,
        startsAt: minutesToTime(evStart),
        endsAt: minutesToTime(evEnd),
        availableMinutes: 0,
        allocatedMinutes: 0,
        blockType: 'CALENDAR_EVENT',
        title: `📅 ${intersectingEvent.title}`,
        description: intersectingEvent.description || `Compromisso sincronizado via Microsoft Teams / HubSpot (${intersectingEvent.source || 'M365'}).`,
        category: 'CALENDAR_ORGANIC',
        status: 'SCHEDULED',
        allocations: [],
        isAdaptiveAdjusted: true,
        adjustmentReason: `Compromisso externo/orgânico bloqueando capacidade produtiva.`
      });

      // Insert post-event residual operational block if >= 25 mins
      if (bpEndMins > evEnd + 20 && bp.category !== 'CALENDAR_FIXED' && bp.category !== 'LUNCH') {
        const postDuration = bpEndMins - evEnd;
        const availableMins = Math.round(postDuration * 0.9);
        const { allocatedMins, allocations } = packTasksIntoBlock(
          `block-${userId}-${planDate}-${blockSequence}`,
          unassignedTasks,
          availableMins,
          bp.title,
          bp.targetTaskTypes
        );

        finalBlocks.push({
          id: `block-${userId}-${planDate}-${blockSequence++}`,
          userId,
          planDate,
          startsAt: minutesToTime(evEnd),
          endsAt: minutesToTime(bpEndMins),
          availableMinutes: availableMins,
          allocatedMinutes: allocatedMins,
          blockType: bp.type,
          title: `${bp.title} (Continuação)`,
          description: `Retomada da atividade após compromisso de agenda.`,
          category: bp.category,
          requiresMandatoryCall: bp.requiresMandatoryCall,
          status: 'SCHEDULED',
          allocations,
          isAdaptiveAdjusted: true,
          adjustmentReason: `Horário redistribuído após término de "${intersectingEvent.title}".`
        });
      }
    } else {
      // Standard blueprint block without intersection
      const isFixed = bp.category === 'CALENDAR_FIXED' || bp.category === 'LUNCH';
      const availableMins = isFixed ? 0 : Math.round(bpDuration * 0.9);
      
      let allocatedMins = 0;
      let allocations: TaskAllocation[] = [];

      if (!isFixed) {
        const packed = packTasksIntoBlock(
          `block-${userId}-${planDate}-${blockSequence}`,
          unassignedTasks,
          availableMins,
          bp.title,
          bp.targetTaskTypes
        );
        allocatedMins = packed.allocatedMins;
        allocations = packed.allocations;
      }

      finalBlocks.push({
        id: `block-${userId}-${planDate}-${blockSequence++}`,
        userId,
        planDate,
        startsAt: bp.start,
        endsAt: bp.end,
        availableMinutes: availableMins,
        allocatedMinutes: allocatedMins,
        blockType: bp.type,
        title: bp.title,
        description: bp.description,
        category: bp.category,
        requiresMandatoryCall: bp.requiresMandatoryCall,
        status: 'SCHEDULED',
        allocations,
        isAdaptiveAdjusted: false
      });
    }
  }

  // Sort blocks chronologically
  return finalBlocks.sort((a, b) => timeToMinutes(a.startsAt) - timeToMinutes(b.startsAt));
}

/**
 * Helper to pack candidate tasks into a block up to capacity
 */
function packTasksIntoBlock(
  blockId: string,
  unassignedTasks: Task[],
  availableMinutes: number,
  blockTitle: string,
  preferredTypes?: TaskType[]
): { allocatedMins: number; allocations: TaskAllocation[] } {
  let allocatedMins = 0;
  const allocations: TaskAllocation[] = [];

  // 1. First pass: tasks that match preferred types for this block
  if (preferredTypes && preferredTypes.length > 0) {
    for (let i = 0; i < unassignedTasks.length; i++) {
      const candidate = unassignedTasks[i];
      if (preferredTypes.includes(candidate.taskType)) {
        const duration = candidate.estimatedDurationMinutes || 10;
        if (allocatedMins + duration <= availableMinutes) {
          allocations.push({
            id: `alloc-${candidate.id}-${Date.now()}-${i}`,
            taskId: candidate.id,
            planningBlockId: blockId,
            allocationOrder: allocations.length + 1,
            estimatedMinutes: duration,
            recommendationStatus: 'ACCEPTED',
            rationale: `Alocação priorizada para o bloco '${blockTitle}'. Compatível com a competência operacional.`
          });
          allocatedMins += duration;
          unassignedTasks.splice(i, 1);
          i--;
        }
      }
    }
  }

  // 2. Second pass: other remaining pending tasks if block still has capacity
  for (let i = 0; i < unassignedTasks.length; i++) {
    const candidate = unassignedTasks[i];
    const duration = candidate.estimatedDurationMinutes || 10;
    if (allocatedMins + duration <= availableMinutes) {
      allocations.push({
        id: `alloc-${candidate.id}-${Date.now()}-${i}`,
        taskId: candidate.id,
        planningBlockId: blockId,
        allocationOrder: allocations.length + 1,
        estimatedMinutes: duration,
        recommendationStatus: 'ACCEPTED',
        rationale: `Alocado no bloco '${blockTitle}' por capacidade residual líquida disponível.`
      });
      allocatedMins += duration;
      unassignedTasks.splice(i, 1);
      i--;
    }
  }

  return { allocatedMins, allocations };
}
