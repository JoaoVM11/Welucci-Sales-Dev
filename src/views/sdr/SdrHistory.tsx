import React from 'react';
import { History, Calendar, CheckCircle2, TrendingUp, Target } from 'lucide-react';
import { User } from '../../types';
import { store } from '../../services/store';

interface SdrHistoryProps {
  currentUser: User;
}

export const SdrHistory: React.FC<SdrHistoryProps> = ({ currentUser }) => {
  const historyData = [
    { date: '20/10/2026', day: 'Terça-feira', goal: 4, booked: 4, attainment: 100, held: 3, attendanceRate: 100, tasksCompleted: 14 },
    { date: '19/10/2026', day: 'Segunda-feira', goal: 4, booked: 3, attainment: 75, held: 2, attendanceRate: 67, tasksCompleted: 16 },
    { date: '16/10/2026', day: 'Sexta-feira', goal: 4, booked: 4, attainment: 100, held: 4, attendanceRate: 80, tasksCompleted: 12 },
    { date: '15/10/2026', day: 'Quinta-feira', goal: 4, booked: 5, attainment: 125, held: 3, attendanceRate: 75, tasksCompleted: 15 },
    { date: '14/10/2026', day: 'Quarta-feira', goal: 4, booked: 4, attainment: 100, held: 2, attendanceRate: 67, tasksCompleted: 13 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-[#14262d] text-[#d1d5d6]">
            <History className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-[#14262d] tracking-tight">
              Meu Histórico de Desempenho
            </h2>
            <p className="text-xs text-[#6a797c] mt-0.5">
              Registro diário de atingimento de metas, tarefas concluídas e comparecimento de reuniões.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide border-b border-[#d1d5d6]/50 pb-3">
          Histórico dos Últimos Dias Úteis
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#d1d5d6] bg-[#f8fafb] text-[#14262d] font-semibold">
                <th className="py-3 px-3">Data</th>
                <th className="py-3 px-3">Dia da Semana</th>
                <th className="py-3 px-3 text-center">Meta do Dia</th>
                <th className="py-3 px-3 text-center">Agendados</th>
                <th className="py-3 px-3 text-center">Atingimento</th>
                <th className="py-3 px-3 text-center">Reuniões Realizadas</th>
                <th className="py-3 px-3 text-center">Taxa Comparecimento</th>
                <th className="py-3 px-3 text-center">Tarefas Concluídas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1d5d6]/50">
              {historyData.map((h, idx) => (
                <tr key={idx} className="hover:bg-[#f8fafb]">
                  <td className="py-3 px-3 font-mono font-medium text-[#14262d]">{h.date}</td>
                  <td className="py-3 px-3 text-[#6a797c]">{h.day}</td>
                  <td className="py-3 px-3 text-center font-mono">{h.goal}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-[#14262d]">{h.booked}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">{h.attainment}%</td>
                  <td className="py-3 px-3 text-center font-mono text-[#14262d]">{h.held}</td>
                  <td className="py-3 px-3 text-center font-mono">{h.attendanceRate}%</td>
                  <td className="py-3 px-3 text-center font-mono">{h.tasksCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
