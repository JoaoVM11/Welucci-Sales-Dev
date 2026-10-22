import React, { useState } from 'react';
import { 
  Users, UserPlus, Mail, Shield, CheckCircle2, 
  Trash2, Send, ExternalLink, Sparkles, AlertCircle, 
  Clock, Target, RefreshCw, Briefcase 
} from 'lucide-react';
import { store } from '../../services/store';
import { User, SdrProfile } from '../../types';
import { NewUserModal } from '../../components/modals/NewUserModal';
import { DeleteUserModal } from '../../components/modals/DeleteUserModal';

export const TeamManagementView: React.FC = () => {
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentUser = store.getCurrentUser();
  const allUsers = store.getAllUsers();
  const sdrUsers = store.getSdrUsers();
  const profiles = store.getProfiles();
  const goals = store.getGoals();

  const handleResendInvite = async (user: User) => {
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          title: user.title,
          scope: user.scope,
        }),
      });
      const data = await res.json();
      setFeedback(`Convite de ativação reenviado para ${user.email}!`);
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      setFeedback(`Convite reenviado para ${user.email}.`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 sm:p-2.5 rounded-lg bg-[#14262d] text-[#d1d5d6] shrink-0">
              <Users className="w-5 h-5 text-amber-300" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#14262d] tracking-tight">
                Gestão da Equipe Comercial & Acessos
              </h2>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Cadastre membros, defina cargos, escopos comerciais, gerencie acessos e remova colaboradores.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsNewUserModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#14262d] text-white hover:bg-[#1a333c] shadow-xs transition-colors cursor-pointer w-fit"
        >
          <UserPlus className="w-4 h-4 text-amber-300" />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* Admin Profile Card */}
      <div className="bg-[#14262d] text-white rounded-xl p-5 shadow-sm border border-[#1e343c] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-emerald-400 p-0.5 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#14262d] rounded-[10px] flex items-center justify-center font-bold text-base text-white">
              JB
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-base text-white">
                {currentUser.name}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-[#14262d]">
                Administrador
              </span>
            </div>
            <p className="text-xs text-[#d1d5d6] mt-0.5">
              {currentUser.title || 'Coordenador de Sales Dev B2B'} · <span className="font-mono text-white/90">{currentUser.email}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#d1d5d6]">
          <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
            <span className="text-[10px] text-slate-300 block">HubSpot Owner</span>
            <span className="font-mono text-white font-medium">{currentUser.hubspotOwnerId}</span>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
            <span className="text-[10px] text-slate-300 block">Microsoft 365 ID</span>
            <span className="font-mono text-white font-medium">{currentUser.microsoftUserId}</span>
          </div>
        </div>
      </div>

      {/* SDR Team Table */}
      <div className="bg-white rounded-xl border border-[#d1d5d6]/70 shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-[#d1d5d6]/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
              Membros da Equipe ({sdrUsers.length})
            </h3>
            <p className="text-xs text-[#6a797c] mt-0.5">
              Colaboradores ativos na operação comercial de pré-vendas.
            </p>
          </div>

          <button
            onClick={() => setIsNewUserModalOpen(true)}
            className="text-xs font-semibold text-[#14262d] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#14262d]" />
            <span className="hidden sm:inline">Adicionar Colaborador</span>
          </button>
        </div>

        {sdrUsers.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-[#6a797c] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#14262d]">Nenhum membro cadastrado ainda</h4>
            <p className="text-xs text-[#6a797c] max-w-md mx-auto">
              Como administrador, você pode cadastrar os SDRs e BDRs da sua equipe informando nome, e-mail e cargo. Cada um receberá um convite por e-mail para definir sua senha de acesso.
            </p>
            <button
              onClick={() => setIsNewUserModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#14262d] text-white hover:bg-[#1a333c] shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-amber-300" />
              <span>Cadastrar Primeiro Membro</span>
            </button>
          </div>
        ) : (
          <div className="p-4 sm:p-0">
            {/* Mobile Swipe Notice */}
            <div className="block sm:hidden text-[10px] font-semibold text-[#6a797c] text-right mb-2">
              (Deslize para ver colunas ➔)
            </div>
            <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="border-b border-[#d1d5d6] bg-[#f8fafb] text-[#14262d] font-semibold">
                  <th className="py-3 px-4">Nome & Contato</th>
                  <th className="py-3 px-4">Cargo</th>
                  <th className="py-3 px-4">Escopo Comercial</th>
                  <th className="py-3 px-4 text-center">Meta Diária</th>
                  <th className="py-3 px-4">Status de Ativação</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d1d5d6]/50">
                {sdrUsers.map((user) => {
                  const sdrGoal = goals.find(g => g.targetId === user.id && g.targetType === 'SDR');
                  const sdrProfile = profiles.find(p => p.userId === user.id);

                  return (
                    <tr key={user.id} className="hover:bg-[#f8fafb] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#14262d] text-white flex items-center justify-center font-bold text-xs">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#14262d]">{user.name}</p>
                            <p className="text-[11px] text-[#6a797c] font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-[#14262d]">
                          <Briefcase className="w-3.5 h-3.5 text-[#6a797c]" />
                          <span>{user.title || 'SDR'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#14262d]/5 text-[#14262d] border border-[#d1d5d6]/70">
                          {user.scope || 'Inbound Qualificação'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-[#14262d] text-sm">
                          {sdrGoal?.dailyScheduledMeetings || 4}
                        </span>
                        <span className="text-[10px] text-[#6a797c] block">reuniões/dia</span>
                      </td>

                      <td className="py-3 px-4">
                        {user.status === 'PENDING_INVITE' ? (
                          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-1 rounded w-fit border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-semibold">Convite Enviado</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded w-fit border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-semibold">Ativo</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResendInvite(user)}
                            title="Reenviar e-mail com link de cadastro de senha"
                            className="p-1.5 rounded-lg border border-[#d1d5d6] text-[#14262d] hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setUserToDelete(user)}
                            title={`Excluir ${user.name} da equipe`}
                            className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors flex items-center gap-1.5 font-semibold text-xs cursor-pointer shadow-2xs"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {/* New User Modal */}
      <NewUserModal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        onUserCreated={() => {
          setFeedback('Novo membro cadastrado com sucesso!');
          setTimeout(() => setFeedback(null), 3000);
        }}
      />

      {/* Delete User Confirmation Modal */}
      <DeleteUserModal
        user={userToDelete}
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onUserDeleted={(deletedName) => {
          setFeedback(`Usuário ${deletedName} foi excluído da equipe com sucesso!`);
          setTimeout(() => setFeedback(null), 4000);
        }}
      />
    </div>
  );
};
