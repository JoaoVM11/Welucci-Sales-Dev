import React from 'react';
import { CalendarCheck2, ExternalLink, CheckCircle2, XCircle, UserX, Clock, Calendar, Info } from 'lucide-react';
import { User, Meeting } from '../../types';
import { store } from '../../services/store';

interface SdrMeetingsProps {
  currentUser: User;
}

export const SdrMeetings: React.FC<SdrMeetingsProps> = ({ currentUser }) => {
  const meetings = store.getMeetings({ ownerId: currentUser.id });
  const kpi = store.getSdrKpiSummary(currentUser.id);

  const handleUpdateStatus = (meetingId: string, status: Meeting['status']) => {
    store.updateMeetingStatus(meetingId, status);
  };

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
                Minhas Reuniões & Agendamentos
              </h2>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Visualização integrada das reuniões agendadas no HubSpot CRM para acompanhamento de presença e da meta diária D0.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://app.hubspot.com/meetings"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#14262d] text-white hover:bg-[#1c3640] transition-colors shadow-xs"
          >
            <span>Abrir HubSpot Reuniões</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#d1d5d6]" />
          </a>
        </div>
      </div>

      {/* Process Notice Banner */}
      <div className="bg-[#f8fafb] border border-[#d1d5d6] p-4 rounded-xl text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-[#14262d] shrink-0 mt-0.5" />
        <p className="text-[#6a797c] leading-relaxed">
          <strong>Processo Operacional Welucci:</strong> Você continua agendando suas reuniões diretamente no HubSpot ou enviando seu link de agendamento ao lead. O Welucci SDR Intelligence sincroniza esses registros em tempo real para calcular seu <strong>GAP D0</strong> e encaixar as confirmações e passagens de bastão na sua <strong>Rotina Operacional</strong>.
        </p>
      </div>

      {/* Mini KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs hover:border-[#14262d] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">Agendadas Hoje (D0)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CalendarCheck2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-2">{kpi.bookedTodayCount}</p>
          <p className="text-[11px] text-[#6a797c] mt-1">Meta diária: {kpi.dailyGoal} agendamentos</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-xs bg-gradient-to-br from-white to-amber-50/20 hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-800 tracking-wider">GAP D0</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-2xl font-bold font-mono mt-2 ${kpi.gapD0 > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {kpi.gapD0}
          </p>
          <p className="text-[11px] text-[#6a797c] mt-1">{kpi.gapD0 > 0 ? 'Faltam para a meta de hoje' : 'Meta diária alcançada!'}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs hover:border-[#14262d] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">Realizadas</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[#14262d] mt-2">{kpi.heldMeetingsCount}</p>
          <p className="text-[11px] text-[#6a797c] mt-1">Confirmadas no período</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d1d5d6]/70 shadow-xs hover:border-[#14262d] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">Comparecimento</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-[#14262d] flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-2">{kpi.attendanceRatePercent}%</p>
          <p className="text-[11px] text-[#6a797c] mt-1">Taxa líquida pós-horário</p>
        </div>
      </div>

      {/* Meetings List */}
      <div className="space-y-3">
        {meetings.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-12 text-center text-xs text-[#6a797c]">
            Nenhuma reunião registrada ainda. Utilize o botão acima para cadastrar um agendamento.
          </div>
        ) : (
          meetings.map((meeting) => {
            const isHeld = meeting.status === 'HELD';
            const isNoShow = meeting.status === 'NO_SHOW';
            const isCancelled = meeting.status === 'CANCELLED';
            const isScheduled = meeting.status === 'SCHEDULED';

            return (
              <div
                key={meeting.id}
                className="bg-white rounded-xl border border-[#d1d5d6]/70 p-4 sm:p-5 shadow-xs space-y-3 hover:border-[#14262d]/40 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-[#14262d]">{meeting.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isHeld
                          ? 'bg-emerald-100 text-emerald-800'
                          : isNoShow
                          ? 'bg-rose-100 text-rose-800'
                          : isCancelled
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isHeld ? 'Realizada' : isNoShow ? 'No-Show' : isCancelled ? 'Cancelada' : 'Agendada'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6a797c]">
                      <span>Lead: <strong className="text-[#14262d]">{meeting.contactName}</strong> ({meeting.contactEmail})</span>
                      <span>·</span>
                      <span>Empresa: <strong className="text-[#14262d]">{meeting.companyName}</strong></span>
                      {meeting.closerName && (
                        <>
                          <span>·</span>
                          <span>Closer: <strong>{meeting.closerName}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs text-[#14262d] bg-[#f8fafb] px-3 py-1.5 rounded-lg border border-[#d1d5d6] self-start sm:self-auto">
                    <Clock className="w-3.5 h-3.5 text-[#6a797c]" />
                    <span>{meeting.scheduledAt.replace('T', ' às ')}</span>
                  </div>
                </div>

                {/* Outcome Status Selector */}
                {isScheduled && (
                  <div className="pt-2 border-t border-[#d1d5d6]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="text-[#6a797c]">Atualizar desfecho da reunião pós-horário:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(meeting.id, 'HELD')}
                        className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-semibold cursor-pointer"
                      >
                        Marcar Realizada
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(meeting.id, 'NO_SHOW')}
                        className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 font-semibold cursor-pointer"
                      >
                        Marcar No-Show
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(meeting.id, 'CANCELLED')}
                        className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-semibold cursor-pointer"
                      >
                        Marcar Cancelada
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
