import React from 'react';
import { Calendar, Plus, RefreshCw, Zap, Sparkles, Bot, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { User } from '../../types';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  currentView: string;
  currentUser: User;
  onNavigateToRoutine: () => void;
  onNavigateToTasks: () => void;
  onManualSync: () => void;
  isSyncing: boolean;
  selectedPeriod: string;
  onSelectPeriod: (period: string) => void;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  onOpenCopilot?: () => void;
  onToggleMobileSidebar?: () => void;
}

// Date helpers
const getFormattedDateLabel = (dateStr?: string) => {
  if (!dateStr) return { formatted: '21/10/2026', dayOfWeek: 'Quarta-feira' };
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dayOfWeek = weekdays[dateObj.getDay()] || 'Quarta-feira';
    const formatted = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    return { formatted, dayOfWeek };
  } catch {
    return { formatted: dateStr, dayOfWeek: '' };
  }
};

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

export const Header: React.FC<HeaderProps> = ({
  currentView,
  currentUser,
  onNavigateToRoutine,
  onNavigateToTasks,
  onManualSync,
  isSyncing,
  selectedPeriod,
  onSelectPeriod,
  selectedDate = '2026-10-21',
  onSelectDate,
  onOpenCopilot,
  onToggleMobileSidebar,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';
  const dateLabel = getFormattedDateLabel(selectedDate);

  const getViewTitle = () => {
    switch (currentView) {
      case 'admin-overview': return 'Visão Geral da Operação';
      case 'admin-goals': return 'Gestão de Metas e Escopos (Admin)';
      case 'admin-users': return 'Gestão de Usuários da Equipe';
      case 'admin-team': return 'Quadro de Saúde da Equipe';
      case 'admin-productivity': return 'Capacidade & Carga Operacional';
      case 'admin-meetings': return 'Reuniões: Agendadas x Realizadas';
      case 'admin-planning': return 'Regras de Planejamento da Rotina';
      case 'admin-reports': return 'Relatórios e Indicadores Comerciais';
      case 'admin-hubspot': return 'Integração Nativa HubSpot CRM';
      case 'admin-microsoft': return 'Integração Nativa Microsoft 365';
      case 'admin-integrations': return 'Status & Saúde das Integrações';
      case 'admin-settings': return 'Configurações do Sistema';
      case 'sdr-dashboard': return 'Meu Painel Individual';
      case 'sdr-routine': return 'Minha Rotina Operacional de Hoje';
      case 'sdr-tasks': return 'Minhas Tarefas & Touch Points';
      case 'sdr-meetings': return 'Minhas Reuniões & Agendamentos';
      case 'sdr-goals': return 'Minhas Metas & Escopo Definido';
      case 'sdr-history': return 'Meu Histórico de Execução';
      default: return 'Painel Comercial';
    }
  };

  return (
    <div className="flex flex-col shrink-0 border-b border-[#d1d5d6]/70 bg-white">
      <header className="h-16 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Hamburger (Mobile) + View Title + Date Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            aria-label="Abrir menu de navegação"
            className="md:hidden p-2 -ml-2 rounded-lg text-[#14262d] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5 text-[#14262d]" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-[#14262d] tracking-tight truncate">
              {getViewTitle()}
            </h1>
          </div>
        </div>

        {/* Middle/Right: Controls & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Period & Interactive Date Selector (Desktop / Tablet >= sm) */}
          <div className="hidden sm:flex items-center bg-[#f8fafb] p-1 rounded-lg border border-[#d1d5d6]/80 text-xs gap-1 shadow-2xs">
            {/* Botão Hoje */}
            <button
              onClick={() => {
                const todayStr = '2026-10-21';
                onSelectPeriod('Hoje');
                if (onSelectDate) onSelectDate(todayStr);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                selectedPeriod === 'Hoje' && selectedDate === '2026-10-21'
                  ? 'bg-[#14262d] text-white shadow-xs font-semibold'
                  : 'text-[#6a797c] hover:text-[#14262d]'
              }`}
              title="Voltar para a rotina de hoje (21/10/2026)"
            >
              Hoje
            </button>

            {/* Campo de Data Escolhida ao lado do 'Hoje' */}
            <div className="flex items-center bg-white rounded-md border border-[#d1d5d6] px-1.5 py-0.5 shadow-2xs hover:border-[#0078d4] focus-within:border-[#0078d4] focus-within:ring-1 focus-within:ring-[#0078d4] transition-all">
              <button
                type="button"
                onClick={() => {
                  const prev = stepDate(selectedDate, -1);
                  if (onSelectDate) onSelectDate(prev);
                  onSelectPeriod('Data Escolhida');
                }}
                title="Dia anterior"
                className="p-0.5 text-[#6a797c] hover:text-[#14262d] hover:bg-slate-100 rounded cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 px-1">
                <Calendar className="w-3.5 h-3.5 text-[#0078d4] shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      if (onSelectDate) onSelectDate(e.target.value);
                      onSelectPeriod('Data Escolhida');
                    }
                  }}
                  className="bg-transparent text-xs font-semibold text-[#14262d] focus:outline-none cursor-pointer w-[116px]"
                  title="Escolha a data específica para filtrar a rotina"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = stepDate(selectedDate, 1);
                  if (onSelectDate) onSelectDate(next);
                  onSelectPeriod('Data Escolhida');
                }}
                title="Próximo dia"
                className="p-0.5 text-[#6a797c] hover:text-[#14262d] hover:bg-slate-100 rounded cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Outros Períodos */}
          {['Esta Semana', 'Este Mês'].map((p) => (
            <button
              key={p}
              onClick={() => onSelectPeriod(p)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                selectedPeriod === p
                  ? 'bg-[#14262d] text-white shadow-xs font-semibold'
                  : 'text-[#6a797c] hover:text-[#14262d]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Gemini Copilot Quick Launch */}
        {isAdmin && onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            title="Abrir Welucci Copilot (Gemini AI) para análise da operação"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#14262d] to-[#1c3640] text-amber-300 border border-amber-400/40 hover:border-amber-400 shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Copilot IA</span>
          </button>
        )}

        {/* Sync Button */}
        <button
          onClick={onManualSync}
          disabled={isSyncing}
          title="Sincronizar dados com HubSpot e Microsoft Graph"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#d1d5d6] text-[#14262d] hover:bg-[#f8fafb] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#6a797c] ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Sincronizar CRM</span>
        </button>

        {/* Real-Time Notification Center */}
        <NotificationCenter
          currentUser={currentUser}
          onNavigateToRoutine={onNavigateToRoutine}
          onNavigateToTasks={onNavigateToTasks}
        />

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#d1d5d6]/70">
          <div className="w-8 h-8 rounded-full bg-[#14262d] text-white flex items-center justify-center text-xs font-bold border border-[#d1d5d6]">
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-[#14262d] leading-none">{currentUser.name}</p>
            <p className="text-[10px] text-[#6a797c] mt-0.5 leading-none">
              {currentUser.role === 'ADMIN' ? 'Gestor Comercial' : (currentUser.scope || 'SDR')}
            </p>
          </div>
        </div>
      </div>
    </header>

    {/* Mobile Sub-Header: Date Selector & Quick Navigation (Only visible on < sm screens) */}
    <div className="sm:hidden flex items-center justify-between bg-[#f8fafb] border-t border-[#d1d5d6]/60 px-3 py-1.5 text-xs">
      <button
        onClick={() => {
          const todayStr = '2026-10-21';
          onSelectPeriod('Hoje');
          if (onSelectDate) onSelectDate(todayStr);
        }}
        className={`px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
          selectedPeriod === 'Hoje' && selectedDate === '2026-10-21'
            ? 'bg-[#14262d] text-white shadow-2xs'
            : 'bg-white text-[#6a797c] border border-[#d1d5d6]'
        }`}
      >
        Hoje
      </button>

      {/* Date picker on mobile */}
      <div className="flex items-center bg-white rounded-md border border-[#d1d5d6] px-1 py-0.5 shadow-2xs">
        <button
          type="button"
          onClick={() => {
            const prev = stepDate(selectedDate, -1);
            if (onSelectDate) onSelectDate(prev);
            onSelectPeriod('Data Escolhida');
          }}
          className="p-1 text-[#6a797c] hover:text-[#14262d] cursor-pointer"
          title="Dia anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) {
              if (onSelectDate) onSelectDate(e.target.value);
              onSelectPeriod('Data Escolhida');
            }
          }}
          className="bg-transparent text-xs font-semibold text-[#14262d] focus:outline-none w-[108px] cursor-pointer"
        />
        <button
          type="button"
          onClick={() => {
            const next = stepDate(selectedDate, 1);
            if (onSelectDate) onSelectDate(next);
            onSelectPeriod('Data Escolhida');
          }}
          className="p-1 text-[#6a797c] hover:text-[#14262d] cursor-pointer"
          title="Próximo dia"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <span className="text-[11px] font-semibold text-[#14262d] truncate max-w-[100px] text-right">
        {dateLabel.dayOfWeek.split('-')[0]}
      </span>
    </div>
  </div>
  );
};


