import React, { useState } from 'react';
import { 
  ListTodo, Phone, ExternalLink, CheckCircle2, 
  AlertCircle, Clock, Filter, Plus 
} from 'lucide-react';
import { User, Task, TaskPriority, TaskType } from '../../types';
import { store } from '../../services/store';

interface SdrTasksProps {
  currentUser: User;
  onCompleteTask: (taskId: string) => void;
}

export const SdrTasks: React.FC<SdrTasksProps> = ({
  currentUser,
  onCompleteTask,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [filterType, setFilterType] = useState<string>('ALL');

  const tasks = store.getTasks({ ownerId: currentUser.id });

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'PENDING' && t.status === 'COMPLETED') return false;
      if (filterStatus === 'COMPLETED' && t.status !== 'COMPLETED') return false;
      if (filterStatus === 'OVERDUE' && !(t.status !== 'COMPLETED' && t.dueAt < '2026-10-21T00:00:00')) return false;
    }
    if (filterType !== 'ALL' && t.taskType !== filterType) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#14262d] text-[#d1d5d6]">
              <ListTodo className="w-5 h-5 text-amber-300" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#14262d] tracking-tight">
                Minhas Tarefas & Cadências Comerciais
              </h2>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Execução de Touch Points, ligações obrigatórias e atendimento com tarefas criadas e sincronizadas automaticamente via HubSpot.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#14262d] text-white shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Cadências & Touch Points HubSpot</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#14262d]">Status:</span>
          {['PENDING', 'OVERDUE', 'COMPLETED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-[#14262d] text-white'
                  : 'bg-[#f8fafb] text-[#6a797c] hover:text-[#14262d]'
              }`}
            >
              {st === 'PENDING' ? 'Pendentes' : st === 'OVERDUE' ? 'Atrasadas' : st === 'COMPLETED' ? 'Concluídas' : 'Todas'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-[#14262d]">Tipo:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#f8fafb] border border-[#d1d5d6] rounded-md px-2.5 py-1.5 text-xs text-[#14262d] focus:outline-none"
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="TOUCH_POINT">Touch Points</option>
            <option value="NEW_LEAD">Novos Leads Inbound</option>
            <option value="CONFIRMATION">Confirmações de Reunião</option>
            <option value="NO_SHOW_RECOVERY">Recuperação No-Show</option>
            <option value="HANDOFF">Passagem de Bastão</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-12 text-center text-xs text-[#6a797c]">
            Nenhuma tarefa encontrada para os filtros selecionados.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            const isOverdue = !isCompleted && task.dueAt < '2026-10-21T00:00:00';
            const isSlaCritical = task.priority === 'CRITICAL_SLA';

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-slate-50 border-[#d1d5d6]/50 opacity-70'
                    : isOverdue
                    ? 'bg-rose-50/50 border-rose-200'
                    : isSlaCritical
                    ? 'bg-amber-50/40 border-amber-300'
                    : 'bg-white border-[#d1d5d6]/70 hover:border-[#14262d]/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-semibold text-sm ${isCompleted ? 'line-through text-[#6a797c]' : 'text-[#14262d]'}`}>
                        {task.title}
                      </span>

                      {isSlaCritical && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          SLA Crítico &lt; 15min
                        </span>
                      )}

                      {task.requiresCall && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Phone className="w-3 h-3 text-amber-700" /> Ligação Obrigatória
                        </span>
                      )}

                      {isOverdue && (
                        <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          Atrasada
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#6a797c]">
                      <span>Contato: <strong className="text-[#14262d]">{task.contactName}</strong></span>
                      {task.contactPhone && (
                        <a href={`tel:${task.contactPhone}`} className="text-blue-600 hover:underline font-mono">
                          {task.contactPhone}
                        </a>
                      )}
                      <span>·</span>
                      <span>Empresa: <strong className="text-[#14262d]">{task.companyName}</strong></span>
                      {task.dealValue && (
                        <>
                          <span>·</span>
                          <span>Valor: <strong className="text-emerald-700">R$ {task.dealValue.toLocaleString('pt-BR')}</strong></span>
                        </>
                      )}
                      <span>·</span>
                      <span>Estimativa: <strong>{task.estimatedDurationMinutes} min</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={task.hubspotUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-md text-xs font-medium text-[#6a797c] hover:text-[#14262d] border border-[#d1d5d6] flex items-center gap-1"
                    >
                      <span>HubSpot</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {!isCompleted ? (
                      <button
                        onClick={() => onCompleteTask(task.id)}
                        className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#14262d] text-white hover:bg-emerald-600 transition-colors shadow-xs"
                      >
                        Concluir
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 text-xs text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Concluída
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
