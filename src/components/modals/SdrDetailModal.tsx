import React from 'react';
import { X, User, Target, Clock, CalendarCheck2, Phone, AlertCircle } from 'lucide-react';
import { store } from '../../services/store';

interface SdrDetailModalProps {
  sdrId: string | null;
  onClose: () => void;
  onSwitchToSdr: (sdrId: string) => void;
}

export const SdrDetailModal: React.FC<SdrDetailModalProps> = ({
  sdrId,
  onClose,
  onSwitchToSdr,
}) => {
  if (!sdrId) return null;

  const users = store.getAllUsers();
  const sdr = users.find(u => u.id === sdrId);
  if (!sdr) return null;

  const kpi = store.getSdrKpiSummary(sdrId);
  const tasks = store.getTasks({ ownerId: sdrId });
  const meetings = store.getMeetings({ ownerId: sdrId });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#d1d5d6] shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#14262d] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#d1d5d6] text-[#14262d] flex items-center justify-center font-bold text-sm">
              {sdr.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{sdr.name}</h3>
              <p className="text-xs text-[#d1d5d6]/80">
                Escopo: <strong className="text-white">{sdr.scope || 'Prospecção Geral'}</strong> · {sdr.email}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#d1d5d6] hover:text-white p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* KPI Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#f8fafb] p-3 rounded-lg border border-[#d1d5d6]/70">
              <span className="text-[#6a797c] font-semibold text-[10px] uppercase">Meta D0</span>
              <p className="text-xl font-bold font-mono text-[#14262d] mt-1">{kpi.dailyGoal}</p>
            </div>
            <div className="bg-[#f8fafb] p-3 rounded-lg border border-[#d1d5d6]/70">
              <span className="text-[#6a797c] font-semibold text-[10px] uppercase">Agendados Hoje</span>
              <p className="text-xl font-bold font-mono text-emerald-600 mt-1">{kpi.bookedTodayCount}</p>
            </div>
            <div className="bg-[#f8fafb] p-3 rounded-lg border border-[#d1d5d6]/70">
              <span className="text-[#6a797c] font-semibold text-[10px] uppercase">GAP D0</span>
              <p className="text-xl font-bold font-mono text-amber-600 mt-1">{kpi.gapD0}</p>
            </div>
            <div className="bg-[#f8fafb] p-3 rounded-lg border border-[#d1d5d6]/70">
              <span className="text-[#6a797c] font-semibold text-[10px] uppercase">Carga / Capacidade</span>
              <p className="text-xl font-bold font-mono text-[#14262d] mt-1">{kpi.capacityUtilizationPercent}%</p>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#14262d] uppercase tracking-wide border-b border-[#d1d5d6]/50 pb-2">
              Tarefas Ativas no Pipeline ({tasks.filter(t => t.status !== 'COMPLETED').length})
            </h4>
            <div className="space-y-2">
              {tasks.filter(t => t.status !== 'COMPLETED').map(t => (
                <div key={t.id} className="p-2.5 bg-[#f8fafb] rounded border border-[#d1d5d6]/60 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#14262d]">{t.title}</p>
                    <p className="text-[11px] text-[#6a797c]">{t.contactName} · {t.companyName}</p>
                  </div>
                  <span className="font-mono text-[#6a797c]">{t.estimatedDurationMinutes} min</span>
                </div>
              ))}
            </div>
          </div>

          {/* Meetings Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#14262d] uppercase tracking-wide border-b border-[#d1d5d6]/50 pb-2">
              Reuniões do SDR ({meetings.length})
            </h4>
            <div className="space-y-2">
              {meetings.map(m => (
                <div key={m.id} className="p-2.5 bg-[#f8fafb] rounded border border-[#d1d5d6]/60 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#14262d]">{m.title}</p>
                    <p className="text-[11px] text-[#6a797c]">{m.contactName} · {m.companyName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    m.status === 'HELD' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#f8fafb] border-t border-[#d1d5d6] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <button
            onClick={() => {
              onSwitchToSdr(sdr.id);
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#14262d] text-white hover:bg-[#1c3640] transition-colors cursor-pointer text-center"
          >
            Acessar Painel como {sdr.name}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-medium text-[#6a797c] hover:bg-slate-200 transition-colors cursor-pointer text-center"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
