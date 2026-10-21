import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Check, ShieldAlert, ArrowRight, UserMinus } from 'lucide-react';
import { User, Task } from '../../types';
import { store } from '../../services/store';

interface DeleteUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted: (deletedName: string) => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserDeleted,
}) => {
  const [reassignTasks, setReassignTasks] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const userTasks = store.getTasks({ ownerId: user.id });
  const pendingTasksCount = userTasks.filter(t => t.status !== 'COMPLETED').length;
  const adminUser = store.getAllUsers().find(u => u.role === 'ADMIN') || store.getCurrentUser();

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const result = store.deleteUser(user.id, {
        reassignTasksToId: reassignTasks ? adminUser.id : undefined,
      });

      if (!result.success) {
        setErrorMessage(result.message);
        setIsDeleting(false);
        return;
      }

      onUserDeleted(user.name);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha ao excluir o usuário da equipe.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-rose-50/80 p-5 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-rose-950">
                Excluir Usuário da Equipe
              </h3>
              <p className="text-xs text-rose-700">
                Ação irreversível de remoção de acesso e perfil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-100/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* User Preview Card */}
          <div className="p-3.5 bg-[#f8fafb] rounded-xl border border-[#d1d5d6]/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#14262d] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="font-bold text-sm text-[#14262d]">{user.name}</p>
                <p className="text-[11px] text-[#6a797c] font-mono">{user.email}</p>
                <p className="text-[11px] text-[#14262d] mt-0.5 font-medium">
                  {user.title || 'SDR'} · <span className="text-[#6a797c]">{user.scope || 'Inbound'}</span>
                </p>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              user.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {user.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}
            </span>
          </div>

          <p className="text-[#6a797c] leading-relaxed">
            Tem certeza de que deseja remover <strong>{user.name}</strong> da operação comercial? O login será revogado e as metas individuais de agendamentos serão excluídas.
          </p>

          {/* Task Reassignment Option */}
          {pendingTasksCount > 0 ? (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Tarefas Pendentes ({pendingTasksCount})</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-normal">
                Este colaborador possui {pendingTasksCount} tarefa(s) pendente(s) no funil de atendimento.
              </p>

              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reassignTasks}
                  onChange={(e) => setReassignTasks(e.target.checked)}
                  className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-[11px] text-amber-950 font-medium">
                  Transferir tarefas e leads pendentes para o gestor <strong>{adminUser.name}</strong> (Recomendado)
                </span>
              </label>
            </div>
          ) : (
            <p className="text-[11px] text-[#6a797c] italic">
              Nenhuma tarefa de CRM pendente atribuída a este usuário no momento.
            </p>
          )}

          <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-100 flex items-start gap-2 text-[11px] text-rose-800">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>
              O histórico de alterações no sistema registrará esta ação como auditoria oficial realizada pelo gestor.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#f8fafb] border-t border-[#d1d5d6]/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#6a797c] hover:text-[#14262d] hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Excluindo...' : 'Sim, Excluir Usuário'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
