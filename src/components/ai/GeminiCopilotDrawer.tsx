import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Sparkles, Send, Bot, User, RefreshCw, AlertTriangle, 
  Lightbulb, TrendingUp, CheckCircle, Flame, ShieldAlert, 
  ArrowRight, MessageSquareQuote 
} from 'lucide-react';
import { store } from '../../services/store';

interface GeminiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToView?: (view: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  isDiagnostic?: boolean;
}

export const GeminiCopilotDrawer: React.FC<GeminiCopilotDrawerProps> = ({ 
  isOpen, 
  onClose,
  onNavigateToView 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = store.getCurrentUser();
  const teamKpi = store.getTeamKpiSummary();
  const teamGoal = store.getTeamGoal();
  const sdrUsers = store.getSdrUsers();

  // Initial greeting from Copilot
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'msg-welcome',
          sender: 'ai',
          text: `Olá, **${currentUser.name}**! Sou o seu **Welucci Copilot (Gemini AI)**.\n\nEstou conectado em tempo real aos dados da sua operação comercial, metas da equipe, reuniões do HubSpot e rotinas dos SDRs.\n\nComo posso ajudar você a acelerar o atingimento das metas hoje? Escolha um dos diagnósticos rápidos abaixo ou digite sua pergunta.`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  }, [currentUser.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build context
      const summaries = sdrUsers.map(u => store.getSdrKpiSummary(u.id));
      const context = {
        manager: {
          name: currentUser.name,
          role: currentUser.title || 'Coordenador de Sales Dev B2B',
          email: currentUser.email,
        },
        teamKpi,
        teamGoal,
        sdrsCount: sdrUsers.length,
        sdrsSummary: summaries.map(s => ({
          name: s.sdrName,
          scope: s.scope,
          dailyGoal: s.dailyGoal,
          bookedToday: s.bookedTodayCount,
          gapD0: s.gapD0,
          attainment: `${s.attainmentPercent}%`,
          attendanceRate: `${s.attendanceRatePercent}%`,
          pendingTasks: s.pendingTasksCount,
          overdueTasks: s.overdueTasksCount,
          workloadMinutes: s.workloadMinutes,
          availableCapacity: s.availableCapacityMinutes,
          capacityStatus: s.capacityStatus,
          hasSlaRisk: s.hasSlaRisk,
        })),
        recentAlerts: store.getAlerts().slice(0, 3),
      };

      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context }),
      });

      const data = await res.json();
      const replyText = data.reply || data.fallbackReply || 'Não foi possível gerar a resposta.';

      setMessages(prev => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } catch (err) {
      console.error('Erro na chamada do Gemini Copilot:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Ocorreu uma instabilidade na conexão com o modelo Gemini. Por favor, tente novamente em alguns instantes.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    {
      title: 'Identificar Gargalos da Operação',
      prompt: 'Analise todos os dados operacionais atuais e me aponte os 3 maiores gargalos que estão travando a produtividade da equipe hoje.',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
    },
    {
      title: 'Plano para Zerar GAP D0',
      prompt: 'O GAP D0 da equipe precisa ser zerado hoje. Me dê um plano de ação tático, hora a hora, para fecharmos essas reuniões pendentes.',
      icon: <Flame className="w-3.5 h-3.5 text-amber-500" />
    },
    {
      title: 'Otimizar Comparecimento & No-Show',
      prompt: 'Qual a estratégia recomendada para elevar nossa taxa de comparecimento e reduzir o cancelamento de reuniões agendadas via HubSpot?',
      icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
    },
    {
      title: 'Distribuir Carga de Trabalho',
      prompt: 'Verifique se há desequilíbrio de capacidade entre os SDRs e sugira uma redistribuição de tarefas e listas outbound.',
      icon: <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
    }
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] md:w-[540px] bg-white border-l border-[#d1d5d6] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-[#14262d] text-white flex items-center justify-between shrink-0 border-b border-[#1f363f]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-emerald-400 p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-[#14262d] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm tracking-tight text-white">
                Welucci Copilot AI
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Gemini 3.8
              </span>
            </div>
            <p className="text-[11px] text-[#d1d5d6]">
              Assistente de Inteligência do Gestor Comercial
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Live Operational Metrics Ribbon */}
      <div className="bg-[#f8fafb] border-b border-[#d1d5d6]/70 px-4 py-2.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-[10px] text-[#6a797c] block">Meta Equipe (D0)</span>
            <span className="font-bold text-[#14262d] font-mono">{teamGoal.dailyScheduledMeetings} agendamentos</span>
          </div>
          <div className="h-6 w-px bg-[#d1d5d6]"></div>
          <div>
            <span className="text-[10px] text-[#6a797c] block">Realizados Hoje</span>
            <span className="font-bold text-emerald-700 font-mono">{teamKpi.teamBookedToday}</span>
          </div>
          <div className="h-6 w-px bg-[#d1d5d6]"></div>
          <div>
            <span className="text-[10px] text-[#6a797c] block">GAP D0</span>
            <span className="font-bold text-rose-700 font-mono">-{teamKpi.teamGapD0}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-[#6a797c] block">Membros</span>
          <span className="font-bold text-[#14262d]">{sdrUsers.length} SDR(s)</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'ai' && (
              <div className="w-7 h-7 rounded-lg bg-[#14262d] text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-[#14262d] text-white rounded-br-none shadow-xs'
                  : 'bg-[#f8fafb] border border-[#d1d5d6] text-[#14262d] rounded-bl-none shadow-xs'
              }`}
            >
              {/* Message Content formatted with bold and line breaks */}
              <div className="space-y-2 whitespace-pre-wrap">
                {m.text.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} dangerouslySetInnerHTML={{
                    __html: paragraph
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/^- (.*)/gm, '• $1')
                  }} />
                ))}
              </div>

              <div
                className={`text-[10px] mt-2 font-mono flex items-center justify-end ${
                  m.sender === 'user' ? 'text-slate-300' : 'text-[#6a797c]'
                }`}
              >
                {m.timestamp}
              </div>
            </div>

            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-200 text-[#14262d] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2.5 text-xs text-[#6a797c] bg-[#f8fafb] p-3 rounded-xl border border-[#d1d5d6]/70 w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#14262d]" />
            <span>O Gemini está analisando a operação e formulando os insights...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Diagnostic Shortcuts */}
      <div className="p-3 bg-white border-t border-[#d1d5d6]/70 space-y-2 shrink-0">
        <p className="text-[11px] font-semibold text-[#6a797c] uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquareQuote className="w-3.5 h-3.5" />
          <span>Diagnósticos Rápidos da Operação:</span>
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q.prompt)}
              disabled={isLoading}
              className="p-2 rounded-lg text-left text-[11px] font-medium bg-[#f8fafb] border border-[#d1d5d6]/80 hover:border-[#14262d] hover:bg-slate-100 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {q.icon}
              <span className="truncate text-[#14262d]">{q.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 bg-white border-t border-[#d1d5d6] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Pergunte ao Gemini sobre gargalos, rotinas ou metas..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-[#f8fafb] border border-[#d1d5d6] rounded-xl px-3.5 py-2.5 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d] focus:bg-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-[#14262d] text-white hover:bg-[#1a333c] disabled:opacity-40 transition-colors shrink-0 shadow-xs"
          >
            <Send className="w-4 h-4 text-amber-300" />
          </button>
        </form>
      </div>
    </div>
  );
};
