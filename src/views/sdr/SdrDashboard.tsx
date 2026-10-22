import React from 'react';
import { 
  Target, CalendarCheck2, Clock, CheckCircle2, 
  AlertCircle, ArrowRight, Phone, ExternalLink, 
  CalendarRange, Sparkles, TrendingUp, Shield 
} from 'lucide-react';
import { User, Task } from '../../types';
import { store } from '../../services/store';

interface SdrDashboardProps {
  currentUser: User;
  onNavigateToRoutine: () => void;
  onNavigateToTasks: () => void;
  onNavigateToMeetings: () => void;
  onCompleteTask: (taskId: string) => void;
  selectedDate?: string;
}

export const SdrDashboard: React.FC<SdrDashboardProps> = ({
  currentUser,
  onNavigateToRoutine,
  onNavigateToTasks,
  onNavigateToMeetings,
  onCompleteTask,
  selectedDate,
}) => {
  const activeDate = selectedDate || store.getSelectedDate() || '2026-10-21';
  const kpi = store.getSdrKpiSummary(currentUser.id, activeDate);
  const sdrGoal = store.getSdrGoal(currentUser.id);
  const allTasks = store.getTasks({ ownerId: currentUser.id });
  const notifications = store.getNotifications(currentUser.id).filter(n => !n.read);

  const overdueTasks = allTasks.filter(t => t.status !== 'COMPLETED' && t.dueAt < `${activeDate}T00:00:00`);
  const todayTasks = allTasks.filter(t => t.status !== 'COMPLETED' && t.dueAt.startsWith(activeDate));
  const futureTasks = allTasks.filter(t => t.status !== 'COMPLETED' && t.dueAt > `${activeDate}T23:59:59`);

  // Pace message calculation based on rigorous math
  const getPaceMessage = () => {
    if (kpi.gapD0 === 0) {
      return {
        label: 'Meta Diária Atingida!',
        desc: 'Excelente execução! Você atingiu sua meta diária de agendamentos D0.',
        color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        badge: 'bg-emerald-500 text-white',
      };
    }
    if (kpi.paceRequiredPerHour <= 0.6) {
      return {
        label: 'No ritmo esperado',
        desc: `Faltam ${kpi.gapD0} agendamento(s). Ritmo sugerido: 1 agendamento a cada ~2 horas.`,
        color: 'bg-blue-50 text-blue-900 border-blue-200',
        badge: 'bg-blue-600 text-white',
      };
    }
    if (kpi.paceRequiredPerHour <= 1.2) {
      return {
        label: 'Precisa acelerar o volume',
        desc: `Faltam ${kpi.gapD0} agendamentos. Ritmo necessário: ${kpi.paceRequiredPerHour} agendamentos por hora útil restante.`,
        color: 'bg-amber-50 text-amber-900 border-amber-200',
        badge: 'bg-amber-500 text-white',
      };
    }
    return {
      label: 'Risco de não atingir a meta',
      desc: `Faltam ${kpi.gapD0} agendamentos com poucas horas disponíveis. Priorize touch points de alta conversão.`,
      color: 'bg-rose-50 text-rose-900 border-rose-200',
      badge: 'bg-rose-500 text-white',
    };
  };

  const pace = getPaceMessage();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Scope & Manager Directive Ribbon */}
      <div className="bg-[#14262d] text-white p-5 rounded-xl border border-[#1e343c] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold text-[#d1d5d6] tracking-wider">
              Escopo Definido pela Gestão:
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#d1d5d6] text-[#14262d]">
              {currentUser.scope || 'Prospecção Geral'}
            </span>
            <span className="text-xs text-[#6a797c]">·</span>
            <span className="text-xs text-[#d1d5d6]/70">Expediente: 09:00 às 19:00</span>
          </div>
          <p className="text-xs text-[#d1d5d6]/90">
            {sdrGoal?.notes ? (
              <span><strong>Diretriz do Gestor:</strong> {sdrGoal.notes}</span>
            ) : (
              'Atue com foco prioritário em Touch Points do dia e atendimento rápido aos leads inbound.'
            )}
          </p>
        </div>

        <button
          onClick={onNavigateToRoutine}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-amber-400 text-[#14262d] hover:bg-amber-300 transition-colors shadow-xs shrink-0"
        >
          <CalendarRange className="w-4 h-4 text-[#14262d]" />
          <span>Acessar Minha Rotina de Hoje</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Active Pipeline Inflow Notification Ribbon */}
      {notifications.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 text-amber-950 p-4 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-amber-900">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              Notificações Recentes do Funil Comercial ({notifications.length})
            </span>
            <span className="text-[11px] font-semibold text-amber-800">Sincronizado via HubSpot</span>
          </div>
          <div className="space-y-1.5">
            {notifications.slice(0, 2).map((n) => (
              <div key={n.id} className="flex items-center justify-between text-xs py-1 border-t border-amber-200/60">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#14262d]">{n.title}:</span>
                  <span className="text-amber-900">{n.message}</span>
                </div>
                <button
                  onClick={onNavigateToRoutine}
                  className="text-[11px] font-bold text-[#14262d] hover:underline shrink-0"
                >
                  Ver na Rotina →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7.1 Indicadores Individuais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Minha Meta D0 */}
        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs hover:border-[#14262d] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">Minha Meta D0</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[#14262d]">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-[#14262d]">{kpi.dailyGoal}</span>
            <span className="text-xs text-[#6a797c]">reuniões</span>
          </div>
          <p className="text-[11px] text-[#6a797c] mt-1">Definida pelo Gestor</p>
        </div>

        {/* Agendados Hoje */}
        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs hover:border-[#14262d] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">Agendados Hoje</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-600">{kpi.bookedTodayCount}</span>
            <span className="text-xs text-[#6a797c]">válidos</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {kpi.attainmentPercent}% da meta diária
          </p>
        </div>

        {/* GAP D0 Faltante */}
        <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-xs bg-gradient-to-br from-white to-amber-50/20 hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-800 tracking-wider">GAP D0 Faltante</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-bold font-mono ${kpi.gapD0 > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {kpi.gapD0}
            </span>
            <span className="text-xs text-[#6a797c]">reuniões</span>
          </div>
          <p className="text-[11px] text-[#6a797c] mt-1">
            {kpi.gapD0 > 0 ? `Ritmo sugerido: ${kpi.paceRequiredPerHour}/h útil` : 'Meta diária atingida!'}
          </p>
        </div>

        {/* Reuniões Realizadas */}
        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs hover:border-[#14262d] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">Realizadas</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <CalendarCheck2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-[#14262d]">{kpi.heldMeetingsCount}</span>
            <span className="text-xs text-[#6a797c]">reuniões</span>
          </div>
          <p className="text-[11px] text-[#6a797c] mt-1 font-semibold text-emerald-600">
            {kpi.attendanceRatePercent}% comparecimento
          </p>
        </div>

        {/* Carga vs Capacidade */}
        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs hover:border-[#14262d] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">Carga Operacional</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-[#14262d] flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-[#14262d]">{kpi.workloadMinutes}m</span>
            <span className="text-xs text-[#6a797c]">/ {kpi.availableCapacityMinutes}m livres</span>
          </div>
          <p className={`text-[11px] font-semibold mt-1 ${
            kpi.capacityStatus === 'SOBRECARGA' ? 'text-rose-600' : 'text-emerald-600'
          }`}>
            {kpi.capacityUtilizationPercent}% ({kpi.capacityStatus})
          </p>
        </div>
      </div>

      {/* 7.2 Progresso Visual da Meta e Ritmo Operacional */}
      <div className={`p-5 rounded-xl border ${pace.color} shadow-xs space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${pace.badge}`}>
              {pace.label}
            </span>
            <span className="text-xs font-semibold">{pace.desc}</span>
          </div>
          <div className="text-xs font-mono font-bold">
            {kpi.bookedTodayCount} de {kpi.dailyGoal} agendamentos ({kpi.attainmentPercent}%)
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/60 h-2.5 rounded-full overflow-hidden border border-black/5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              kpi.attainmentPercent >= 100
                ? 'bg-emerald-600'
                : kpi.attainmentPercent >= 50
                ? 'bg-blue-600'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, kpi.attainmentPercent)}%` }}
          />
        </div>
      </div>

      {/* 7.3 Tarefas e Pendências: Atrasadas, Hoje, Futuras */}
      <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#d1d5d6]/50 pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
              Minhas Atividades e Pendências
            </h3>
            <p className="text-xs text-[#6a797c] mt-0.5">
              Organizadas por SLA e vencimento com sincronização bidirecional no HubSpot CRM.
            </p>
          </div>
          <button
            onClick={onNavigateToTasks}
            className="text-xs font-medium text-[#14262d] hover:underline flex items-center gap-1"
          >
            <span>Ver todas as tarefas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Atrasadas */}
        {overdueTasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              <span>Atrasadas — Executar com Prioridade Máxima ({overdueTasks.length})</span>
            </div>
            <div className="space-y-2">
              {overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#14262d]">{task.title}</span>
                      {task.requiresCall && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Ligação Obrigatória
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[#6a797c] text-[11px]">
                      <span>Contato: <strong>{task.contactName}</strong> ({task.companyName})</span>
                      <span>·</span>
                      <span>Duração estim.: <strong>{task.estimatedDurationMinutes} min</strong></span>
                      <span>·</span>
                      <a
                        href={task.hubspotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#14262d] hover:underline inline-flex items-center gap-1"
                      >
                        Abrir no HubSpot <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={() => onCompleteTask(task.id)}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#14262d] text-white hover:bg-emerald-600 transition-colors shrink-0"
                  >
                    Concluir
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vencem Hoje */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#14262d] text-xs font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-[#6a797c]" />
            <span>Com Vencimento Hoje ({todayTasks.length})</span>
          </div>
          {todayTasks.length === 0 ? (
            <p className="text-xs text-[#6a797c] italic py-2">Nenhuma tarefa pendente com vencimento hoje.</p>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-[#f8fafb] border border-[#d1d5d6]/70 rounded-lg flex items-center justify-between gap-3 text-xs hover:border-[#14262d]/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#14262d]">{task.title}</span>
                      {task.priority === 'CRITICAL_SLA' && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          SLA Crítico &lt; 15 min
                        </span>
                      )}
                      {task.requiresCall && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Ligação
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[#6a797c] text-[11px]">
                      <span>{task.contactName} ({task.companyName})</span>
                      <span>·</span>
                      <span>Estimativa: {task.estimatedDurationMinutes} min</span>
                      <span>·</span>
                      <a
                        href={task.hubspotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#14262d] hover:underline inline-flex items-center gap-1"
                      >
                        HubSpot <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={() => onCompleteTask(task.id)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border border-[#14262d] text-[#14262d] hover:bg-[#14262d] hover:text-white transition-colors shrink-0"
                  >
                    Concluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
