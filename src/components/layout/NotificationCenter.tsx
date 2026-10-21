import React, { useState } from 'react';
import { 
  Bell, Check, Clock, Sparkles, User, 
  ExternalLink, Zap, FolderPlus, Target, X, CheckCheck 
} from 'lucide-react';
import { store } from '../../services/store';
import { AppNotification, User as UserType } from '../../types';

interface NotificationCenterProps {
  currentUser: UserType;
  onNavigateToRoutine: () => void;
  onNavigateToTasks: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUser,
  onNavigateToRoutine,
  onNavigateToTasks,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const notifications = store.getNotifications(currentUser.role === 'ADMIN' ? undefined : currentUser.id);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    store.markNotificationAsRead(id);
  };

  const handleMarkAllRead = () => {
    store.markAllNotificationsAsRead(currentUser.role === 'ADMIN' ? undefined : currentUser.id);
  };

  const handleSimulateInboundLead = () => {
    store.triggerNewInboundLead({
      contactName: 'Guilherme Siqueira',
      companyName: 'Siqueira & Filhos Agroindústria',
      dealValue: 95000,
      phone: '+55 16 99882-1144',
    });
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg border border-[#d1d5d6] text-[#14262d] hover:bg-[#f8fafb] transition-colors"
        title="Central de Notificações do Funil"
      >
        <Bell className="w-4 h-4 text-[#14262d]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Drawer */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-xl shadow-xl border border-[#d1d5d6] z-50 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-3.5 bg-[#14262d] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#d1d5d6]" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Notificações do Funil ({unreadCount} novas)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#d1d5d6] hover:text-white flex items-center gap-1"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-[#d1d5d6] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-[#d1d5d6]/50">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#6a797c]">
                  Nenhuma notificação no momento.
                </div>
              ) : (
                notifications.map((notif) => {
                  const isInbound = notif.type === 'NEW_INBOUND_LEAD';
                  const isOutbound = notif.type === 'NEW_OUTBOUND_LIST';

                  return (
                    <div
                      key={notif.id}
                      className={`p-3.5 text-xs transition-colors ${
                        notif.read ? 'bg-white' : 'bg-slate-50/80 font-medium'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            isInbound
                              ? 'bg-amber-100 text-amber-800'
                              : isOutbound
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isInbound ? <Zap className="w-3.5 h-3.5" /> : isOutbound ? <FolderPlus className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
                          </div>

                          <div className="space-y-1">
                            <p className="font-bold text-[#14262d] leading-snug">{notif.title}</p>
                            <p className="text-[11px] text-[#6a797c] leading-relaxed">{notif.message}</p>
                            <div className="flex items-center gap-3 pt-1 text-[10px] text-[#6a797c]">
                              <span>{notif.timestamp.slice(11, 16)}</span>
                              <span>·</span>
                              <button
                                onClick={() => {
                                  handleMarkAsRead(notif.id);
                                  onNavigateToRoutine();
                                  setIsOpen(false);
                                }}
                                className="text-[#14262d] hover:underline font-semibold"
                              >
                                Ver na Rotina
                              </button>
                            </div>
                          </div>
                        </div>

                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-1 text-[#6a797c] hover:text-[#14262d] shrink-0"
                            title="Marcar lida"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Testing Trigger Bar */}
            <div className="p-3 bg-[#f8fafb] border-t border-[#d1d5d6]/70 flex items-center justify-between text-xs">
              <span className="text-[10px] text-[#6a797c]">Simulação Webhook:</span>
              <button
                onClick={handleSimulateInboundLead}
                className="px-2.5 py-1 rounded bg-[#14262d] text-white hover:bg-[#1c3640] text-[10px] font-semibold flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-amber-300" />
                <span>+ Lead Inbound</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
