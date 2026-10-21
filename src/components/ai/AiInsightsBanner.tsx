import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, Lightbulb, RefreshCw, ChevronRight, Bot, Target } from 'lucide-react';
import { store } from '../../services/store';

interface AiInsightsBannerProps {
  onOpenCopilot: () => void;
}

export const AiInsightsBanner: React.FC<AiInsightsBannerProps> = ({ onOpenCopilot }) => {
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const teamKpi = store.getTeamKpiSummary();
  const sdrUsers = store.getSdrUsers();

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const metrics = {
        activeSdrs: sdrUsers.length,
        dailyGoal: teamKpi.teamDailyGoal,
        bookedToday: teamKpi.teamBookedToday,
        gapD0: teamKpi.teamGapD0,
        attainmentPercent: teamKpi.teamAttainmentPercent,
        attendanceRatePercent: teamKpi.totalAttendanceRatePercent,
        pendingTasks: teamKpi.totalPendingTasks,
        overdueTasks: teamKpi.totalOverdueTasks,
        averageCapacityUtilization: teamKpi.averageCapacityUtilization,
        sdrsAtRisk: teamKpi.sdrsAtOperationalRiskCount,
      };

      const res = await fetch('/api/ai/quick-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
      });

      const data = await res.json();
      if (data.insights) {
        setInsights(data.insights);
      }
    } catch {
      setInsights('Operação ativa e monitorada em tempo real com regras ABAC e sincronização de reuniões HubSpot.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [teamKpi.teamBookedToday, teamKpi.totalPendingTasks, sdrUsers.length]);

  return (
    <div className="bg-gradient-to-r from-[#14262d] to-[#1c3640] rounded-xl p-5 text-white shadow-md border border-[#23424d] space-y-3 relative overflow-hidden">
      {/* Background flare */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-400/10 to-transparent pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-tight text-white">
                Inteligência Operacional Welucci (Gemini AI)
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Assistente do Gestor
              </span>
            </div>
            <p className="text-xs text-[#d1d5d6]">
              Diagnóstico contínuo de gargalos, previsão de atingimento e dicas de aceleração de rotina.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchInsights}
            disabled={isLoading}
            title="Atualizar diagnóstico com métricas em tempo real"
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400 text-[#14262d] hover:bg-amber-300 shadow-xs transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Abrir Welucci Copilot</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <div className="bg-black/25 backdrop-blur-xs rounded-lg p-3.5 border border-white/10 text-xs text-[#d1d5d6] leading-relaxed relative z-10">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Consultando modelo Gemini para diagnóstico da operação de vendas...</span>
          </div>
        ) : insights ? (
          <div className="space-y-1.5">
            {insights.split('\n').filter(Boolean).slice(0, 4).map((line, idx) => (
              <p key={idx} dangerouslySetInnerHTML={{
                __html: line
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                  .replace(/^[0-9]\.\s*/, '📌 ')
                  .replace(/^-\s*/, '• ')
              }} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-200">
              <Lightbulb className="w-4 h-4" />
              <span>
                {sdrUsers.length === 0 
                  ? 'Nenhum SDR cadastrado ainda. Cadastre os membros da equipe para ativar o diagnóstico de rotinas e metas!' 
                  : `Operação ativa com ${sdrUsers.length} SDR(s). Clique em "Abrir Welucci Copilot" para debater estratégias de prospecção com a IA.`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
