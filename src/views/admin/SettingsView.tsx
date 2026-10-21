import React, { useState } from 'react';
import { 
  Settings, User as UserIcon, Lock, KeyRound, Shield, 
  History, Check, AlertCircle, Eye, EyeOff, Save, 
  RotateCcw, Sparkles, Building2, Mail, Briefcase, 
  CheckCircle2, Fingerprint, Calendar
} from 'lucide-react';
import { store } from '../../services/store';

export const SettingsView: React.FC = () => {
  const currentUser = store.getCurrentUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'audit'>('profile');

  // Profile Form State
  const [name, setName] = useState(currentUser.name);
  const [title, setTitle] = useState(currentUser.title || 'Coordenador de Sales Dev B2B');
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [securityFeedback, setSecurityFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Audit Logs State
  const auditLogs = store.getAuditLogs();
  const [auditSearch, setAuditSearch] = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileFeedback({ type: 'error', text: 'O nome não pode estar em branco.' });
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = store.updateUser(currentUser.id, {
        name: name.trim(),
        title: title.trim(),
      });
      if (res.success) {
        setProfileFeedback({ type: 'success', text: 'Dados cadastrais atualizados com sucesso!' });
      } else {
        setProfileFeedback({ type: 'error', text: res.message });
      }
    } catch {
      setProfileFeedback({ type: 'error', text: 'Ocorreu um erro ao salvar o perfil.' });
    } finally {
      setIsSavingProfile(false);
      setTimeout(() => setProfileFeedback(null), 4000);
    }
  };

  // Handle Save Password
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setSecurityFeedback({ type: 'error', text: 'Informe a senha atual.' });
      return;
    }
    if (newPassword.length < 8) {
      setSecurityFeedback({ type: 'error', text: 'A nova senha deve ter no mínimo 8 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityFeedback({ type: 'error', text: 'A confirmação de senha não confere com a nova senha.' });
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = store.updateUserPassword(currentUser.id, currentPassword, newPassword);
      if (res.success) {
        setSecurityFeedback({ type: 'success', text: res.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setSecurityFeedback({ type: 'error', text: res.message });
      }
    } catch {
      setSecurityFeedback({ type: 'error', text: 'Erro ao alterar a senha.' });
    } finally {
      setIsSavingPassword(false);
      setTimeout(() => setSecurityFeedback(null), 5000);
    }
  };

  // Handle Reset System Data
  const [showResetModal, setShowResetModal] = useState(false);

  const handleConfirmReset = () => {
    store.resetToDefaults();
    setShowResetModal(false);
    setResetConfirm(true);
    setTimeout(() => setResetConfirm(false), 4000);
  };

  const filteredLogs = auditLogs.filter(
    l => l.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
         l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
         l.details.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-lg bg-[#14262d] text-[#d1d5d6]">
              <Settings className="w-5 h-5 text-amber-300" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#14262d] tracking-tight">
                  Configurações & Perfil do Usuário
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 uppercase">
                  B2B
                </span>
              </div>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Gerencie seus dados pessoais, credenciais de acesso, integrações e segurança de conta.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector Pills */}
        <div className="flex items-center bg-[#f8fafb] p-1 rounded-xl border border-[#d1d5d6]/80 text-xs font-medium">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-[#14262d] text-white shadow-xs font-semibold'
                : 'text-[#6a797c] hover:text-[#14262d]'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Meus Dados</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'security'
                ? 'bg-[#14262d] text-white shadow-xs font-semibold'
                : 'text-[#6a797c] hover:text-[#14262d]'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Alterar Senha</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'audit'
                ? 'bg-[#14262d] text-white shadow-xs font-semibold'
                : 'text-[#6a797c] hover:text-[#14262d]'
            }`}
            title="Histórico de alterações e auditoria do sistema"
          >
            <History className="w-4 h-4" />
            <span>Auditoria do Sistema</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MEUS DADOS / PERFIL */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Card Badge */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#14262d] to-[#1c3640] text-amber-300 font-bold text-2xl flex items-center justify-center border-4 border-white shadow-md">
                {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Conta ativa e verificada">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#14262d]">{currentUser.name}</h3>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">{currentUser.title || 'Coordenador de Sales Dev B2B'}</p>
              <p className="text-xs text-[#6a797c] mt-0.5 font-mono">{currentUser.email}</p>
            </div>

            <div className="w-full pt-4 border-t border-[#d1d5d6]/50 space-y-2.5 text-xs text-left">
              <div className="flex items-center justify-between">
                <span className="text-[#6a797c]">Perfil de Acesso:</span>
                <span className="font-semibold text-[#14262d] px-2 py-0.5 rounded bg-[#14262d]/5 border border-[#14262d]/10">
                  {currentUser.role === 'ADMIN' ? 'Administrador Geral' : 'SDR Operacional'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6a797c]">Unidade de Negócio:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Welucci B2B
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6a797c]">Status da Conta:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Ativo & Conectado
                </span>
              </div>
            </div>

            {/* Quick External IDs */}
            <div className="w-full pt-4 border-t border-[#d1d5d6]/50 space-y-2 text-xs text-left">
              <span className="text-[11px] font-bold text-[#6a797c] uppercase tracking-wider block">
                Vínculos Corporativos
              </span>
              <div className="p-2.5 rounded-lg bg-[#f8fafb] border border-[#d1d5d6]/60 space-y-1">
                <p className="text-[11px] text-[#6a797c]">HubSpot Owner:</p>
                <p className="font-mono text-xs font-medium text-[#14262d]">{currentUser.hubspotOwnerId || 'hs-owner-joao-batista'}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#f8fafb] border border-[#d1d5d6]/60 space-y-1">
                <p className="text-[11px] text-[#6a797c]">Microsoft Graph ID:</p>
                <p className="font-mono text-xs font-medium text-[#14262d]">{currentUser.microsoftUserId || 'ms-user-joao-batista'}</p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-6">
            <div className="border-b border-[#d1d5d6]/50 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#14262d]">Dados Cadastrais</h3>
                <p className="text-xs text-[#6a797c] mt-0.5">
                  Atualize suas informações de exibição na plataforma Welucci Sales Dev.
                </p>
              </div>
              <span className="text-xs text-[#6a797c] font-medium">Campos obrigatórios (*)</span>
            </div>

            {profileFeedback && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                profileFeedback.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {profileFeedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <span>{profileFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14262d] mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#d1d5d6] bg-white text-[#14262d] focus:outline-none focus:border-[#14262d] focus:ring-1 focus:ring-[#14262d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14262d] mb-1.5">
                    Cargo / Função Oficial *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Ex: Coordenador de Sales Dev B2B"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#d1d5d6] bg-white text-[#14262d] focus:outline-none focus:border-[#14262d] focus:ring-1 focus:ring-[#14262d]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14262d] mb-1.5">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#d1d5d6]/70 bg-[#f8fafb] text-[#6a797c] font-mono cursor-not-allowed"
                  />
                  <p className="text-[11px] text-[#6a797c] mt-1">E-mail corporativo gerenciado pelo domínio welucci.com.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14262d] mb-1.5">
                    Unidade de Negócio
                  </label>
                  <input
                    type="text"
                    value="B2B (Operações Comerciais)"
                    disabled
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#d1d5d6]/70 bg-[#f8fafb] text-[#6a797c] cursor-not-allowed font-medium"
                  />
                  <p className="text-[11px] text-[#6a797c] mt-1">Identificação da unidade de atendimento e prospecção.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#d1d5d6]/50 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#14262d] hover:bg-[#1a333c] text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isSavingProfile ? 'Salvando...' : 'Salvar Alterações de Perfil'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: ALTERAR SENHA */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-6">
            <div className="border-b border-[#d1d5d6]/50 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#14262d]" />
                <h3 className="text-base font-bold text-[#14262d]">Alterar Senha de Acesso</h3>
              </div>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Defina uma nova senha segura para acessar o painel Welucci Sales Dev.
              </p>
            </div>

            {securityFeedback && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                securityFeedback.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {securityFeedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <span>{securityFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-4 max-w-lg">
              {/* Senha Atual */}
              <div>
                <label className="block text-xs font-semibold text-[#14262d] mb-1.5">
                  Senha Atual *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Digite sua senha atual"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#d1d5d6] bg-white text-[#14262d] focus:outline-none focus:border-[#14262d] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6a797c] hover:text-[#14262d]"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nova Senha */}
              <div>
                <label className="block text-xs font-semibold text-[#14262d] mb-1.5">
                  Nova Senha *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Mínimo de 8 caracteres"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#d1d5d6] bg-white text-[#14262d] focus:outline-none focus:border-[#14262d] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6a797c] hover:text-[#14262d]"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              <div>
                <label className="block text-xs font-semibold text-[#14262d] mb-1.5">
                  Confirmar Nova Senha *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repita a nova senha"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#d1d5d6] bg-white text-[#14262d] focus:outline-none focus:border-[#14262d] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6a797c] hover:text-[#14262d]"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#d1d5d6]/50 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#14262d] hover:bg-[#1a333c] text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isSavingPassword ? 'Atualizando...' : 'Atualizar Senha'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Security Recommendations Card */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-700" />
              <h4 className="text-xs font-bold text-[#14262d] uppercase tracking-wider">
                Políticas de Segurança Welucci
              </h4>
            </div>

            <div className="space-y-3 text-xs text-[#6a797c]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Mínimo de 8 caracteres alfanuméricos recomendados.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Utilize combinações de letras maiúsculas, números e símbolos especiais (!@#$).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Sua senha é mantida sob hash e persistida com criptografia em banco de dados seguro.</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#d1d5d6]/50">
              <div className="bg-[#f8fafb] p-3 rounded-lg border border-[#d1d5d6]/60">
                <span className="text-[11px] font-bold text-[#14262d] block">
                  Autenticação em 2 Etapas (M365)
                </span>
                <p className="text-[11px] text-[#6a797c] mt-1 leading-snug">
                  Contas com login corporativo Microsoft 365 podem utilizar SSO integrado com 2FA habilitado.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDITORIA DO SISTEMA (Discreta e secundária) */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#d1d5d6]/50 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#14262d]" />
                  <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
                    Trilha de Auditoria & Conformidade
                  </h3>
                </div>
                <p className="text-xs text-[#6a797c] mt-0.5">
                  Registro histórico das alterações de metas, cadastros de equipe e eventos operacionais.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Filtrar eventos..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#d1d5d6] bg-[#f8fafb] text-[#14262d] focus:outline-none focus:border-[#14262d] w-48"
                />
                <button
                  onClick={() => setShowResetModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                  title="Restaura a base de homologação para os valores originais"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Dados</span>
                </button>
              </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetModal && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Confirmar Restauração dos Dados Padrão</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Atenção: restaurar dados padrão redefinirá metas, tarefas e configurações para a configuração original de fábrica da Welucci. Deseja prosseguir?
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleConfirmReset}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    Sim, Restaurar
                  </button>
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {resetConfirm && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs flex items-center gap-2 shadow-xs">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Dados do sistema e metas restaurados para o padrão original da Welucci.</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#d1d5d6] bg-[#f8fafb] text-[#14262d] font-semibold">
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Usuário</th>
                    <th className="py-2.5 px-3">Ação</th>
                    <th className="py-2.5 px-3">Descrição Detalhada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1d5d6]/50">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#6a797c]">
                        Nenhum registro de auditoria encontrado para o filtro informado.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#f8fafb]">
                        <td className="py-2.5 px-3 font-mono text-[#6a797c] whitespace-nowrap">
                          {log.timestamp.slice(0, 19).replace('T', ' ')}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#14262d]">{log.userName}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#14262d]/10 text-[#14262d] font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#14262d]">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
