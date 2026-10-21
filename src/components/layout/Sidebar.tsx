import { 
  LayoutDashboard, Users, Clock, CalendarCheck2, Target, 
  CalendarRange, FileSpreadsheet, Network, Settings, 
  ListTodo, UserCheck, History, Sparkles, ChevronDown, Bot, Flame 
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenCopilot?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  allUsers,
  onSwitchUser,
  isDemoMode,
  onToggleDemoMode,
  onOpenCopilot,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';

  const adminNav = [
    { id: 'admin-overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'admin-goals', label: 'Metas e Escopos (Admin)', icon: Target, badge: 'Definir' },
    { id: 'admin-users', label: 'Equipe & Usuários', icon: UserCheck, badge: 'Gestão' },
    { id: 'admin-team', label: 'Quadro da Equipe', icon: Users },
    { id: 'admin-productivity', label: 'Produtividade & Carga', icon: Clock },
    { id: 'admin-meetings', label: 'Reuniões (Agend. x Real.)', icon: CalendarCheck2 },
    { id: 'admin-planning', label: 'Planejamento Operacional', icon: CalendarRange },
    { id: 'admin-reports', label: 'Relatórios & Exportação', icon: FileSpreadsheet },
    { id: 'admin-hubspot', label: 'Integração HubSpot', icon: Flame, badge: 'Nativo' },
    { id: 'admin-integrations', label: 'Integrações (CRM / M365)', icon: Network },
    { id: 'admin-settings', label: 'Configurações', icon: Settings },
  ];

  const sdrNav = [
    { id: 'sdr-dashboard', label: 'Meu Painel', icon: LayoutDashboard },
    { id: 'sdr-routine', label: 'Minha Rotina de Hoje', icon: CalendarRange, highlight: true },
    { id: 'sdr-tasks', label: 'Minhas Tarefas', icon: ListTodo },
    { id: 'sdr-meetings', label: 'Minhas Reuniões', icon: CalendarCheck2 },
    { id: 'sdr-goals', label: 'Minhas Metas & Escopo', icon: Target },
    { id: 'sdr-history', label: 'Meu Histórico', icon: History },
  ];

  const navItems = isAdmin ? adminNav : sdrNav;

  return (
    <aside className="w-72 bg-[#14262d] text-white flex flex-col h-screen select-none shrink-0 border-r border-[#1e343c]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1e343c]">
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/images__2__615e057c.jpg"
            alt="Welucci Logo"
            className="w-10 h-10 rounded-lg object-contain bg-[#0e1d23] border border-[#1e343c] shadow-md p-0.5 shrink-0"
          />
          <div className="min-w-0">
            <div className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span className="truncate">Welucci Sales Dev</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                B2B
              </span>
            </div>
            <p className="text-xs text-[#d1d5d6]/70 mt-0.5">Unidade de Negócio B2B</p>
          </div>
        </div>
      </div>

      {/* Role & User Switcher Card */}
      <div className="px-4 py-3 border-b border-[#1e343c] bg-[#0e1d23]/60">
        <div className="flex items-center justify-between text-xs text-[#d1d5d6]/80 mb-1.5 font-medium">
          <span>Perfil Ativo:</span>
          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
            isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {isAdmin ? 'Gestor (Admin)' : 'SDR / BDR'}
          </span>
        </div>

        <div className="relative">
          <select
            value={currentUser.id}
            onChange={(e) => onSwitchUser(e.target.value)}
            className="w-full bg-[#14262d] text-white text-xs rounded-md px-2.5 py-2 border border-[#6a797c]/40 focus:outline-none focus:border-[#d1d5d6] cursor-pointer appearance-none pr-8"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id} className="bg-[#14262d] text-white py-1">
                {u.role === 'ADMIN' ? '👑 ' : '👤 '}
                {u.name} — {u.role === 'ADMIN' ? 'Gestão Geral' : (u.scope || 'SDR')}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#d1d5d6] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Gemini AI Copilot Quick Launcher */}
      {isAdmin && onOpenCopilot && (
        <div className="p-3 border-b border-[#1e343c]">
          <button
            onClick={onOpenCopilot}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-400/15 via-[#1a333c] to-emerald-400/15 border border-amber-400/30 hover:border-amber-400 text-white transition-all shadow-xs group text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                <Bot className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">Welucci Copilot</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-400/20 text-amber-300">Gemini</span>
                </div>
                <span className="text-[10px] text-[#d1d5d6]/80 block leading-tight">Assistente do Gestor</span>
              </div>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#6a797c] uppercase">
          {isAdmin ? 'Módulos Administrativos' : 'Área Operacional do SDR'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#d1d5d6] text-[#14262d] shadow-sm font-semibold'
                  : 'text-[#d1d5d6] hover:bg-[#1c323a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#14262d]' : 'text-[#6a797c]'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {'badge' in item && item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  isActive ? 'bg-[#14262d] text-white' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
              {'highlight' in item && item.highlight && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  isActive ? 'bg-[#14262d] text-white' : 'bg-amber-400 text-[#14262d]'
                }`}>
                  Hoje
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Demo Mode / Environment Status Footer */}
      <div className="p-4 border-t border-[#1e343c] bg-[#0e1d23]/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-[#d1d5d6] font-medium">Modo Demonstração</span>
          </div>
          <button
            onClick={onToggleDemoMode}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
              isDemoMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {isDemoMode ? 'Ativo (Fictício)' : 'Modo Real'}
          </button>
        </div>
        <p className="text-[11px] text-[#6a797c] mt-1.5 leading-tight">
          {isDemoMode 
            ? 'Dados demonstrativos da Welucci isolados para homologação.' 
            : 'Conexão ativa consultando APIs oficiais.'}
        </p>
      </div>
    </aside>
  );
};
