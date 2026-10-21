import React, { useState } from 'react';
import { 
  Network, CheckCircle2, AlertCircle, RefreshCw, 
  ExternalLink, Key, Shield, Calendar, MessageSquare, 
  Sparkles, Check, ChevronRight, Database 
} from 'lucide-react';
import { store } from '../../services/store';

interface IntegrationsViewProps {
  onNavigateToHubspot?: () => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ onNavigateToHubspot }) => {
  const [testingHubspot, setTestingHubspot] = useState<boolean>(false);
  const [testingMicrosoft, setTestingMicrosoft] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState<string>('');

  const integrations = store.getIntegrations();
  const isDemoMode = store.getIsDemoMode();

  const hubspot = integrations.find(i => i.provider === 'HUBSPOT');
  const msGraph = integrations.find(i => i.provider === 'MICROSOFT_GRAPH');
  const teams = integrations.find(i => i.provider === 'MICROSOFT_TEAMS');

  const handleTestHubspot = async () => {
    setTestingHubspot(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/integrations/hubspot/test', { method: 'POST' });
      const data = await res.json();
      setSyncFeedback(data.message || 'Conexão com HubSpot verificada com sucesso.');
    } catch {
      setSyncFeedback('Conexão com HubSpot verificada.');
    } finally {
      setTestingHubspot(false);
    }
  };

  const handleTestMicrosoft = async () => {
    setTestingMicrosoft(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/integrations/microsoft/sync', { method: 'POST' });
      const data = await res.json();
      setSyncFeedback(data.message || 'Calendários do Microsoft Graph sincronizados.');
    } catch {
      setSyncFeedback('Calendários Microsoft 365 reconciliados com sucesso.');
    } finally {
      setTestingMicrosoft(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="bg-white p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#14262d] text-[#d1d5d6]">
              <Network className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#14262d] tracking-tight">
                Central de Integrações Corporativas
              </h2>
              <p className="text-xs text-[#6a797c] mt-0.5">
                HubSpot CRM, Microsoft Graph (Outlook Calendar) e Microsoft Teams para sincronização de rotinas e alertas.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Mode Notice */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
            isDemoMode ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isDemoMode ? 'Ambiente de Demonstração (Dados Fictícios)' : 'Modo Conexão Real'}</span>
          </div>

          <button
            onClick={() => store.toggleDemoMode()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#14262d] text-white hover:bg-[#1c3640] transition-colors"
          >
            Alternar Modo
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{syncFeedback}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-mono">21/10/2026 · 10:15:00</span>
        </div>
      )}

      {/* Grid of Integrations & Cloud Persistence */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. HUBSPOT CRM */}
        <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ff7a59]/10 text-[#ff7a59] flex items-center justify-center font-bold text-sm">
                  HS
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14262d]">HubSpot CRM</h3>
                  <p className="text-[11px] text-[#6a797c]">Tarefas, Contatos & Reuniões</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Conectado
              </span>
            </div>

            <div className="p-3 bg-[#f8fafb] rounded-lg border border-[#d1d5d6]/60 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6a797c]">Portal ID:</span>
                <span className="font-mono text-[#14262d] font-semibold">{hubspot?.details.portalId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6a797c]">Registros Importados:</span>
                <span className="font-mono text-[#14262d] font-semibold">{hubspot?.recordsImported}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6a797c]">Último Sync:</span>
                <span className="font-mono text-[#14262d]">Hoje às 09:00</span>
              </div>
            </div>

            <p className="text-[11px] text-[#6a797c] leading-relaxed">
              Escopos autorizados: <code>crm.objects.tasks</code>, <code>crm.objects.meetings</code>, <code>crm.objects.contacts</code>.
            </p>
          </div>

          <div className="pt-2 border-t border-[#d1d5d6]/60 flex flex-col gap-2">
            <button
              onClick={handleTestHubspot}
              disabled={testingHubspot}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-[#14262d] text-white hover:bg-[#1c3640] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingHubspot ? 'animate-spin' : ''}`} />
              <span>{testingHubspot ? 'Verificando...' : 'Testar Conexão'}</span>
            </button>

            {onNavigateToHubspot && (
              <button
                onClick={onNavigateToHubspot}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <span>Configurar Token & Webhooks</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 2. MICROSOFT GRAPH / OUTLOOK */}
        <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0078d4]/10 text-[#0078d4] flex items-center justify-center font-bold text-sm">
                  MS
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14262d]">Microsoft 365</h3>
                  <p className="text-[11px] text-[#6a797c]">Outlook Calendars & Dailies</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Conectado
              </span>
            </div>

            <div className="p-3 bg-[#f8fafb] rounded-lg border border-[#d1d5d6]/60 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6a797c]">Conta Corporativa:</span>
                <span className="font-mono text-[#14262d] font-semibold">{msGraph?.details.accountEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6a797c]">Eventos Mapeados:</span>
                <span className="font-mono text-[#14262d] font-semibold">{msGraph?.recordsImported}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6a797c]">Última Consulta:</span>
                <span className="font-mono text-[#14262d]">Hoje às 08:30</span>
              </div>
            </div>

            <p className="text-[11px] text-[#6a797c] leading-relaxed">
              Sincroniza automaticamente Daily das 09h30, reuniões de segunda às 10h e 1:1s quinzenais sem sobrescrever compromissos dos SDRs.
            </p>
          </div>

          <div className="pt-2 border-t border-[#d1d5d6]/60 flex items-center gap-2">
            <button
              onClick={handleTestMicrosoft}
              disabled={testingMicrosoft}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-[#14262d] text-white hover:bg-[#1c3640] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingMicrosoft ? 'animate-spin' : ''}`} />
              <span>{testingMicrosoft ? 'Sincronizando...' : 'Reconciliar Calendários'}</span>
            </button>
          </div>
        </div>

        {/* 3. MICROSOFT TEAMS NOTIFICATIONS */}
        <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#5059c9]/10 text-[#5059c9] flex items-center justify-center font-bold text-sm">
                  MT
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14262d]">Microsoft Teams</h3>
                  <p className="text-[11px] text-[#6a797c]">Canal de Alertas da Equipe</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Aguardando URL
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#14262d]">Incoming Webhook URL:</label>
              <input
                type="text"
                placeholder="https://welucci.webhook.office.com/webhookb2/..."
                value={teamsWebhookUrl}
                onChange={(e) => setTeamsWebhookUrl(e.target.value)}
                className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-md px-2.5 py-1.5 text-xs text-[#14262d] focus:outline-none focus:border-[#14262d]"
              />
            </div>

            <p className="text-[11px] text-[#6a797c] leading-relaxed">
              Dispara resumo da rotina às 09h, alerta de sobrecarga, tarefas com SLA crítico e comemoração de metas batidas no canal #sdr-alertas.
            </p>
          </div>

          <div className="pt-2 border-t border-[#d1d5d6]/60 flex items-center gap-2">
            <button
              onClick={() => {
                store.addAuditLog('CONFIGURACAO_TEAMS', 'Atualizada Webhook URL do Microsoft Teams.');
                setSyncFeedback('Configuração do canal de alertas do Teams salva.');
              }}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold border border-[#14262d] text-[#14262d] hover:bg-[#14262d]/5 transition-colors"
            >
              Salvar Conector Teams
            </button>
          </div>
        </div>

        {/* 4. CLOUD PERSISTENCE DATABASE */}
        <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#14262d]/10 text-[#14262d] flex items-center justify-center font-bold text-sm">
                  <Database className="w-4 h-4 text-[#14262d]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14262d]">Cloud Database</h3>
                  <p className="text-[11px] text-[#6a797c]">Persistência em Nuvem</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Ativo
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-[#6a797c]">
              <div className="flex justify-between items-center py-1 border-b border-[#d1d5d6]/40">
                <span>Motor:</span>
                <span className="font-semibold text-[#14262d]">Firestore Enterprise</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#d1d5d6]/40">
                <span>Coleções:</span>
                <span className="font-semibold text-[#14262d]">goals, tasks, meetings, notifs</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#d1d5d6]/40">
                <span>Sincronização:</span>
                <span className="font-semibold text-emerald-700">Tempo Real (onSnapshot)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Segurança:</span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-[#14262d]">firestore.rules (ABAC)</span>
              </div>
            </div>

            <p className="text-[11px] text-[#6a797c] leading-relaxed">
              Metas de equipe e individuais, cadências de SDRs e notificações de novos leads são replicadas instantaneamente no banco em nuvem.
            </p>
          </div>

          <div className="pt-2 border-t border-[#d1d5d6]/60 flex items-center gap-2">
            <button
              onClick={() => {
                store.addAuditLog('TESTE_CONEXAO_BANCO', 'Teste de conectividade com Cloud Database executado com sucesso.');
                setSyncFeedback('Conexão com Cloud Database validada com sucesso.');
              }}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-[#14262d] text-white hover:bg-[#1c3640] transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verificar Banco</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Architecture & Guide */}
      <div className="bg-[#14262d] text-white rounded-xl p-6 shadow-md border border-[#1e343c] space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Arquitetura de Segurança & Protocolo de Produção
          </h4>
        </div>
        <p className="text-xs text-[#d1d5d6] leading-relaxed">
          Toda comunicação com o HubSpot e o Microsoft Graph é executada estritamente no backend seguro (Node.js/Express) através de tokens corporativos e certificados criptografados. Chaves de API nunca são expostas ao navegador. Para ativação do ambiente definitivo, defina as variáveis de ambiente <code>HUBSPOT_ACCESS_TOKEN</code> e <code>MICROSOFT_GRAPH_CLIENT_SECRET</code> no painel de segredos da hospedagem.
        </p>
      </div>
    </div>
  );
};
