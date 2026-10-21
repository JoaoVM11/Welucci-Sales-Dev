import React, { useState } from 'react';
import { X, UserPlus, Mail, Briefcase, Target, Clock, CheckCircle2, Copy, Send } from 'lucide-react';
import { store } from '../../services/store';
import { SdrScope } from '../../types';

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

export const NewUserModal: React.FC<NewUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('SDR Outbound');
  const [scope, setScope] = useState<SdrScope>('Outbound Prospecção');
  const [dailyGoal, setDailyGoal] = useState<number>(4);
  const [workdayStart, setWorkdayStart] = useState('09:00');
  const [workdayEnd, setWorkdayEnd] = useState('19:00');
  const [isLoading, setIsLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ email: string; inviteUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsLoading(true);
    try {
      const result = await store.inviteUser({
        name,
        email,
        title,
        scope,
        dailyGoal,
        workdayStart,
        workdayEnd,
      });

      setSuccessInfo({ email: result.user.email, inviteUrl: result.inviteUrl });
      if (onUserCreated) onUserCreated();
    } catch (err) {
      console.error('Erro ao cadastrar usuário:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!successInfo?.inviteUrl) return;
    navigator.clipboard.writeText(successInfo.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetAndClose = () => {
    setName('');
    setEmail('');
    setTitle('SDR Outbound');
    setScope('Outbound Prospecção');
    setDailyGoal(4);
    setSuccessInfo(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-[#d1d5d6] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#14262d] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10 text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight text-white">
                Cadastrar Novo Usuário da Equipe
              </h3>
              <p className="text-xs text-[#d1d5d6]">
                Adicione um SDR/BDR para definir escopo, metas e disparar o e-mail de ativação de senha.
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {successInfo ? (
            <div className="space-y-4 py-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-[#14262d]">
                  Convite Enviado com Sucesso!
                </h4>
                <p className="text-xs text-[#6a797c] max-w-md mx-auto mt-1">
                  Um e-mail corporativo de ativação foi enviado para <strong className="text-[#14262d]">{successInfo.email}</strong> com o link seguro para cadastro da senha de acesso.
                </p>
              </div>

              {/* Invite link card */}
              <div className="bg-[#f8fafb] border border-[#d1d5d6] p-3 rounded-xl text-left space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#6a797c] uppercase">Link direto de ativação:</span>
                  <button
                    onClick={handleCopyLink}
                    className="text-xs font-semibold text-[#14262d] flex items-center gap-1 hover:underline"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>
                <p className="text-xs font-mono text-[#14262d] break-all bg-white p-2 rounded border border-[#d1d5d6]/70">
                  {successInfo.inviteUrl}
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setSuccessInfo(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#14262d] text-[#14262d] hover:bg-[#14262d]/5 transition-colors"
                >
                  Cadastrar Outro Membro
                </button>
                <button
                  onClick={handleResetAndClose}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#14262d] text-white hover:bg-[#1a333c] shadow-xs transition-colors"
                >
                  Concluir
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-[#14262d] mb-1">
                  Nome Completo do Membro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Silva Costa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg px-3 py-2 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d] focus:bg-white"
                />
              </div>

              {/* E-mail Corporativo */}
              <div>
                <label className="block text-xs font-semibold text-[#14262d] mb-1">
                  E-mail Corporativo Welucci *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="mariana.costa@welucci.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg pl-9 pr-3 py-2 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d] focus:bg-white"
                  />
                  <Mail className="w-4 h-4 text-[#6a797c] absolute left-3 top-2.5" />
                </div>
                <p className="text-[11px] text-[#6a797c] mt-1">
                  O colaborador receberá um e-mail com instruções para cadastrar a sua senha.
                </p>
              </div>

              {/* Cargo & Escopo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#14262d] mb-1">
                    Cargo / Função *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ex: SDR Outbound Pleno"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg pl-9 pr-3 py-2 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d] focus:bg-white"
                    />
                    <Briefcase className="w-4 h-4 text-[#6a797c] absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14262d] mb-1">
                    Escopo Comercial *
                  </label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as SdrScope)}
                    className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg px-3 py-2 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d] focus:bg-white"
                  >
                    <option value="Outbound Prospecção">Outbound Prospecção</option>
                    <option value="Inbound Qualificação">Inbound Qualificação</option>
                    <option value="Enterprise / Contas Estratégicas">Enterprise / Contas Estratégicas</option>
                    <option value="Mid-Market">Mid-Market</option>
                    <option value="Recuperação & Reengajamento">Recuperação & Reengajamento</option>
                  </select>
                </div>
              </div>

              {/* Meta Diária & Jornada */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#14262d] mb-1">
                    Meta Diária (Reuniões)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg pl-9 pr-3 py-2 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d] focus:bg-white font-mono"
                    />
                    <Target className="w-4 h-4 text-[#6a797c] absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14262d] mb-1">
                    Início Jornada
                  </label>
                  <input
                    type="time"
                    value={workdayStart}
                    onChange={(e) => setWorkdayStart(e.target.value)}
                    className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg px-3 py-2 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d] focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14262d] mb-1">
                    Fim Jornada
                  </label>
                  <input
                    type="time"
                    value={workdayEnd}
                    onChange={(e) => setWorkdayEnd(e.target.value)}
                    className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg px-3 py-2 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d] focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[#d1d5d6]/70 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#6a797c] hover:text-[#14262d] hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#14262d] text-white hover:bg-[#1a333c] shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isLoading ? 'Cadastrando e Enviando...' : 'Cadastrar e Enviar Convite'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
