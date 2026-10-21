import React from 'react';
import { Calendar, Plus, RefreshCw, Zap, Sparkles, Bot } from 'lucide-react';
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
  onOpenCopilot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  currentUser,
  onNavigateToRoutine,
  onNavigateToTasks,
  onManualSync,
  isSyncing,
  selectedPeriod,
  onSelectPeriod,
  onOpenCopilot,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';

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
      case 'admin-integrations': return 'Integrações HubSpot & Microsoft 365';
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
    <header className="h-16 bg-white border-b border-[#d1d5d6]/70 px-6 flex items-center justify-between shrink-0">
      {/* Left: View Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-[#14262d] tracking-tight">
          {getViewTitle()}
        </h1>
        <span className="text-[#6a797c] text-xs">·</span>
        <div className="flex items-center gap-1.5 text-xs text-[#6a797c] bg-[#f8fafb] px-2.5 py-1 rounded-md border border-[#d1d5d6]/60">
          <Calendar className="w-3.5 h-3.5 text-[#6a797c]" />
          <span>21/10/2026 (Quarta-feira)</span>
          <span className="font-mono text-[#14262d]">10:15</span>
        </div>
      </div>

      {/* Middle/Right: Controls & Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Period Selector */}
        <div className="hidden sm:flex items-center bg-[#f8fafb] p-1 rounded-lg border border-[#d1d5d6]/60 text-xs">
          {['Hoje', 'Esta Semana', 'Este Mês'].map((p) => (
            <button
              key={p}
              onClick={() => onSelectPeriod(p)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedPeriod === p
                  ? 'bg-[#14262d] text-white shadow-xs'
                  : 'text-[#6a797c] hover:text-[#14262d]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Cloud DB Live Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs" title="Banco de dados Cloud conectado com persistência em tempo real">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Cloud DB</span>
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#d1d5d6] text-[#14262d] hover:bg-[#f8fafb] transition-colors disabled:opacity-50"
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
  );
};
