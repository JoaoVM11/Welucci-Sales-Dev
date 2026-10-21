import React, { useState, useEffect } from 'react';
import { 
  Network, Key, CheckCircle2, AlertTriangle, RefreshCw, 
  Shield, Eye, EyeOff, Send, Database, Check, Clock, 
  Calendar, Phone, Users, Flame, Zap, ArrowRight, Copy, 
  ExternalLink, Layers, CheckSquare, AlertCircle
} from 'lucide-react';
import { store } from '../../services/store';
import { SdrMetric, SdrTaskItem, SdrCalendarBlock } from '../../types';

export const HubspotIntegrationView: React.FC = () => {
  const currentUser = store.getCurrentUser();
  const isAdmin = currentUser.role === 'ADMIN';

  // Token input state
  const [tokenInput, setTokenInput] = useState<string>('');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [tokenMasked, setTokenMasked] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  // Connection testing state
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    statusCode: number;
    message: string;
    error?: string;
  } | null>(null);

  // Sync routines state
  const [isSyncingMeetings, setIsSyncingMeetings] = useState<boolean>(false);
  const [isSyncingTasks, setIsSyncingTasks] = useState<boolean>(false);
  const [isTriggeringWebhook, setIsTriggeringWebhook] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Database mirror tables active tab
  const [activeTableTab, setActiveTableTab] = useState<'METRICS' | 'TASKS' | 'CALENDAR'>('METRICS');
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'Vencida' | 'Tarefa do Dia' | 'Futura'>('ALL');

  // Local data mirror state
  const [sdrMetrics, setSdrMetrics] = useState<SdrMetric[]>([]);
  const [sdrTasks, setSdrTasks] = useState<SdrTaskItem[]>([]);
  const [sdrCalendarBlocks, setSdrCalendarBlocks] = useState<SdrCalendarBlock[]>([]);

  // Webhook URL
  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/hubspot`
    : '/api/webhooks/hubspot';

  // Load configuration and data from server and store on mount
  const refreshData = async () => {
    try {
      // 1. Fetch HubSpot config
      const confRes = await fetch('/api/integrations/hubspot/config');
      if (confRes.ok) {
        const confData = await confRes.json();
        setIsConfigured(confData.isConfigured);
        setTokenMasked(confData.tokenMasked || '');
      }

      // 2. Fetch server mirror tables
      const dataRes = await fetch('/api/integrations/hubspot/data');
      if (dataRes.ok) {
        const dataJson = await dataRes.json();
        if (dataJson.metrics) setSdrMetrics(dataJson.metrics);
        if (dataJson.tasks) setSdrTasks(dataJson.tasks);
        if (dataJson.calendarBlocks) setSdrCalendarBlocks(dataJson.calendarBlocks);
        store.setHubspotMirrorData(dataJson);
      } else {
        // Fallback to store
        setSdrMetrics(store.getSdrMetrics());
        setSdrTasks(store.getSdrTasks());
        setSdrCalendarBlocks(store.getSdrCalendarBlocks());
      }
    } catch {
      setSdrMetrics(store.getSdrMetrics());
      setSdrTasks(store.getSdrTasks());
      setSdrCalendarBlocks(store.getSdrCalendarBlocks());
    }
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = store.subscribe(() => {
      setSdrMetrics(store.getSdrMetrics());
      setSdrTasks(store.getSdrTasks());
      setSdrCalendarBlocks(store.getSdrCalendarBlocks());
    });
    return () => unsubscribe();
  }, []);

  // Save Token
  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return;

    try {
      const res = await fetch('/api/integrations/hubspot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsConfigured(true);
        setTokenMasked(data.tokenMasked);
        setTokenInput('');
        setSyncFeedback('Private App Access Token salvo com sucesso no ambiente seguro!');
        setTimeout(() => setSyncFeedback(null), 4000);
      }
    } catch (err: any) {
      setSyncFeedback('Erro ao salvar token no backend.');
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/integrations/hubspot/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() || undefined }),
      });

      const data = await res.json();
      setTestResult({
        success: data.success,
        statusCode: data.statusCode || res.status,
        message: data.message || (data.success ? 'Conexão estabelecida com sucesso!' : 'Falha na conexão.'),
        error: data.error,
      });

      if (data.success) {
        setIsConfigured(true);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        statusCode: 500,
        message: 'Falha de rede ao conectar com o serviço backend ou com a HubSpot.',
        error: err?.message || String(err),
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Sync Meetings
  const handleSyncMeetings = async () => {
    setIsSyncingMeetings(true);
    try {
      const res = await fetch('/api/integrations/hubspot/sync/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.calendarBlocks) {
        setSdrCalendarBlocks(data.calendarBlocks);
      }
      if (data.metrics) {
        setSdrMetrics(data.metrics);
      }
      store.setHubspotMirrorData({
        calendarBlocks: data.calendarBlocks,
        metrics: data.metrics,
      });
      setSyncFeedback(data.message || 'Reuniões e calendário sincronizados com sucesso.');
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err: any) {
      setSyncFeedback('Erro ao sincronizar reuniões da HubSpot.');
    } finally {
      setIsSyncingMeetings(false);
    }
  };

  // Sync Tasks
  const handleSyncTasks = async () => {
    setIsSyncingTasks(true);
    try {
      const res = await fetch('/api/integrations/hubspot/sync/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.tasks) {
        setSdrTasks(data.tasks);
        store.setHubspotMirrorData({ tasks: data.tasks });
      }
      setSyncFeedback(data.message || 'Tarefas de cadência importadas e classificadas.');
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err: any) {
      setSyncFeedback('Erro ao sincronizar tarefas da HubSpot.');
    } finally {
      setIsSyncingTasks(false);
    }
  };

  // Simulate Webhook Call
  const handleSimulateWebhook = async (ownerId: string = 'hs_owner_mariana') => {
    setIsTriggeringWebhook(true);
    try {
      const dummyPayload = [
        {
          subscriptionType: 'contact.creation',
          eventId: Date.now(),
          portalId: 48201,
          occurredAt: Date.now(),
          properties: {
            hubspot_owner_id: {
              value: ownerId,
            },
            email: {
              value: `lead-${Date.now().toString().slice(-4)}@empresa-exemplo.com.br`,
            },
            firstname: {
              value: 'Novo Lead',
            },
            company: {
              value: 'Indústria ABC Metal',
            },
          },
        },
      ];

      const res = await fetch('/api/webhooks/hubspot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dummyPayload),
      });

      const data = await res.json();
      if (data.success) {
        store.incrementLeadsReceived(ownerId);
        // Dispatch in-app notification
        store.addNotification({
          type: 'NEW_INBOUND_LEAD',
          title: '⚡ Webhook HubSpot: Lead Inbound Recebido!',
          message: `Evento de contact.creation recebido via Webhook para ${ownerId === 'hs_owner_lucas' ? 'Lucas Ferreira' : 'Mariana Costa'}. Total de hoje incrementado.`,
          targetUserId: ownerId === 'hs_owner_lucas' ? 'user-sdr-outbound' : 'user-sdr-inbound',
        });
        refreshData();
        setSyncFeedback(`Webhook processado: +1 lead alocado ao SDR (${ownerId}). Contador atualizado!`);
        setTimeout(() => setSyncFeedback(null), 5000);
      }
    } catch (err: any) {
      setSyncFeedback('Erro ao processar disparo de webhook.');
    } finally {
      setIsTriggeringWebhook(false);
    }
  };

  // Filter tasks
  const filteredTasks = sdrTasks.filter(t => {
    if (taskFilter === 'ALL') return true;
    return t.classificacao === taskFilter;
  });

  // Access Guard: only administrators can access this view
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto text-rose-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-900">Acesso Restrito ao Coordenador</h3>
            <p className="text-xs text-rose-700 mt-1">
              A tela de configuração da Integração Nativa HubSpot é acessível exclusivamente por usuários com perfil de Administrador (Gestão de Operações).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="bg-white p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#14262d] text-amber-300">
              <Network className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#14262d] tracking-tight">
                  Integração HubSpot CRM
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                  Nativo & Seguro
                </span>
              </div>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Configure as credenciais do Private App da HubSpot, monitore tabelas de espelhamento (sdr_metrics, sdr_tasks, sdr_calendar_blocks) e receba webhooks em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Global Connection Badge */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 ${
            isConfigured 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isConfigured ? 'Conexão Pronta (Token Configurado)' : 'Aguardando Token'}</span>
          </div>
        </div>
      </div>

      {syncFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{syncFeedback}</span>
          </div>
          <button onClick={() => setSyncFeedback(null)} className="text-emerald-700 font-bold hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 1: CREDENCIAIS & VALIDAÇÃO (PRIVATE APP TOKEN)   */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#d1d5d6]/60">
          <div>
            <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600" />
              <span>1. Credencial Segura: Private App Access Token da HubSpot</span>
            </h3>
            <p className="text-xs text-[#6a797c] mt-0.5">
              Insira o token de acesso gerado no painel da sua conta HubSpot (Configurações → Integrações → Private Apps).
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#6a797c] bg-slate-100 px-2.5 py-1 rounded">
            Header: Authorization: Bearer &lt;Token&gt;
          </span>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-[#14262d]">
            Private App Access Token (pat-na1-...):
          </label>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={tokenMasked || 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'}
                className="w-full bg-[#f8fafb] border border-[#d1d5d6] rounded-lg px-3.5 py-2.5 text-xs font-mono text-[#14262d] focus:outline-none focus:border-[#14262d] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-2.5 text-[#6a797c] hover:text-[#14262d] cursor-pointer"
                title={showToken ? 'Ocultar token' : 'Exibir token'}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSaveToken}
                disabled={!tokenInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#14262d] text-white hover:bg-[#1c3640] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Salvar Credencial</span>
              </button>

              <button
                onClick={handleTestConnection}
                disabled={isTesting || (!tokenInput.trim() && !isConfigured)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-[#14262d] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Validando na HubSpot...' : 'Testar Conexão'}</span>
              </button>
            </div>
          </div>

          {tokenMasked && (
            <p className="text-[11px] text-[#6a797c] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Token salvo e protegido no servidor: <strong className="font-mono text-[#14262d]">{tokenMasked}</strong></span>
            </p>
          )}

          {/* Validation Test Alert */}
          {testResult && (
            <div className={`p-4 rounded-xl border text-xs shadow-xs transition-all animate-in fade-in ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="font-bold text-sm">
                      {testResult.message}
                    </strong>
                    <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-white/70 border border-current">
                      HTTP {testResult.statusCode}
                    </span>
                  </div>
                  {testResult.error && (
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {testResult.error}
                    </p>
                  )}
                  {testResult.success && (
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      GET disparado com sucesso no endpoint de Contatos (https://api.hubapi.com/crm/v3/objects/contacts?limit=1). Permissões validadas.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: ROTINAS DE SINCRONIZAÇÃO EM SEGUNDO PLANO     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Routine A: Meetings & Calendar Blocks */}
        <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#d1d5d6]/50 pb-3">
            <h3 className="text-sm font-bold text-[#14262d] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>A) Mapeamento de Reuniões & Calendário</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-[#14262d]">
              GET /crm/v3/objects/meetings
            </span>
          </div>

          <p className="text-xs text-[#6a797c] leading-relaxed">
            Consome a API da HubSpot periodicamente para reconciliar horários de início e fim no <strong>sdr_calendar_blocks</strong>.
          </p>

          <div className="bg-[#f8fafb] p-3 rounded-lg border border-[#d1d5d6] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#6a797c]">Se hs_meeting_outcome = 'COMPLETED':</span>
              <strong className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                +1 reunioes_realizadas
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6a797c]">Se hs_meeting_outcome = 'SCHEDULED':</span>
              <strong className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                +1 reunioes_agendadas
              </strong>
            </div>
          </div>

          <button
            onClick={handleSyncMeetings}
            disabled={isSyncingMeetings}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold bg-[#14262d] text-white hover:bg-[#1c3640] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingMeetings ? 'animate-spin' : ''}`} />
            <span>{isSyncingMeetings ? 'Sincronizando Reuniões...' : 'Sincronizar Reuniões Agora'}</span>
          </button>
        </div>

        {/* Routine B: Tasks & Cadence */}
        <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#d1d5d6]/50 pb-3">
            <h3 className="text-sm font-bold text-[#14262d] flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-sky-600" />
              <span>B) Acompanhamento de Tarefas de Cadência</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-[#14262d]">
              GET /crm/v3/objects/tasks
            </span>
          </div>

          <p className="text-xs text-[#6a797c] leading-relaxed">
            Consome as tarefas de cadência da HubSpot e popula a tabela <strong>sdr_tasks</strong> com classificação em tempo de execução.
          </p>

          <div className="bg-[#f8fafb] p-3 rounded-lg border border-[#d1d5d6] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#6a797c]">Vencimento anterior a hoje e NOT_STARTED:</span>
              <strong className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Classificada como "Vencida"
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6a797c]">Vencimento na data de hoje e NOT_STARTED:</span>
              <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Classificada como "Tarefa do Dia"
              </strong>
            </div>
          </div>

          <button
            onClick={handleSyncTasks}
            disabled={isSyncingTasks}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold bg-[#14262d] text-white hover:bg-[#1c3640] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTasks ? 'animate-spin' : ''}`} />
            <span>{isSyncingTasks ? 'Sincronizando Tarefas...' : 'Sincronizar Tarefas de Cadência'}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 3: MODELAGEM DE BANCO DE DADOS (MIRROR TABLES)   */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-[#d1d5d6]/70 shadow-xs overflow-hidden">
        {/* Table Selector Tabs */}
        <div className="p-4 bg-[#f8fafb] border-b border-[#d1d5d6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#14262d] flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600" />
              <span>2. Tabelas Espelho de Usuários (SDRs/BDRs) por hubspot_owner_id</span>
            </h3>
            <p className="text-xs text-[#6a797c] mt-0.5">
              Estruturas de banco de dados sincronizadas em tempo real para alimentar a rotina inteligente.
            </p>
          </div>

          <div className="flex bg-white p-1 rounded-lg border border-[#d1d5d6]">
            <button
              onClick={() => setActiveTableTab('METRICS')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTableTab === 'METRICS'
                  ? 'bg-[#14262d] text-white shadow-2xs'
                  : 'text-[#6a797c] hover:text-[#14262d]'
              }`}
            >
              sdr_metrics ({sdrMetrics.length})
            </button>
            <button
              onClick={() => setActiveTableTab('TASKS')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTableTab === 'TASKS'
                  ? 'bg-[#14262d] text-white shadow-2xs'
                  : 'text-[#6a797c] hover:text-[#14262d]'
              }`}
            >
              sdr_tasks ({sdrTasks.length})
            </button>
            <button
              onClick={() => setActiveTableTab('CALENDAR')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTableTab === 'CALENDAR'
                  ? 'bg-[#14262d] text-white shadow-2xs'
                  : 'text-[#6a797c] hover:text-[#14262d]'
              }`}
            >
              sdr_calendar_blocks ({sdrCalendarBlocks.length})
            </button>
          </div>
        </div>

        {/* TAB 1: sdr_metrics */}
        {activeTableTab === 'METRICS' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafb] border-b border-[#d1d5d6] text-[#14262d] font-bold">
                  <th className="py-2.5 px-3">id_sdr</th>
                  <th className="py-2.5 px-3">hubspot_owner_id</th>
                  <th className="py-2.5 px-3 text-center">leads_recebidos_hoje</th>
                  <th className="py-2.5 px-3 text-center">reunioes_agendadas</th>
                  <th className="py-2.5 px-3 text-center">reunioes_realizadas</th>
                  <th className="py-2.5 px-3 text-right">updated_at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d1d5d6]/50">
                {sdrMetrics.map((metric) => (
                  <tr key={metric.id_sdr} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#14262d]">
                      {metric.id_sdr}
                    </td>
                    <td className="py-3 px-3 font-mono text-sky-700 bg-sky-50/50 rounded">
                      {metric.hubspot_owner_id}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {metric.leads_recebidos_hoje}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {metric.reunioes_agendadas}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {metric.reunioes_realizadas}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[11px] text-[#6a797c]">
                      {metric.updated_at ? new Date(metric.updated_at).toLocaleTimeString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: sdr_tasks */}
        {activeTableTab === 'TASKS' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6a797c] font-semibold">Filtrar Classificação:</span>
              {(['ALL', 'Vencida', 'Tarefa do Dia', 'Futura'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    taskFilter === f
                      ? 'bg-[#14262d] text-white'
                      : 'bg-[#f8fafb] border border-[#d1d5d6] text-[#6a797c] hover:bg-slate-100'
                  }`}
                >
                  {f === 'ALL' ? 'Todas' : f}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#f8fafb] border-b border-[#d1d5d6] text-[#14262d] font-bold">
                    <th className="py-2.5 px-3 w-28">id_tarefa</th>
                    <th className="py-2.5 px-3">titulo</th>
                    <th className="py-2.5 px-3 w-44">vencimento</th>
                    <th className="py-2.5 px-3 text-center w-28">status</th>
                    <th className="py-2.5 px-3 text-center w-36">classificacao</th>
                    <th className="py-2.5 px-3 w-32">id_sdr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1d5d6]/50">
                  {filteredTasks.map((task) => (
                    <tr key={task.id_tarefa} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#6a797c]">
                        {task.id_tarefa}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#14262d]">
                        {task.titulo}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#6a797c]">
                        {task.vencimento ? new Date(task.vencimento).toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          task.classificacao === 'Vencida'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : task.classificacao === 'Tarefa do Dia'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {task.classificacao}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-[#14262d]">
                        {task.id_sdr}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: sdr_calendar_blocks */}
        {activeTableTab === 'CALENDAR' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafb] border-b border-[#d1d5d6] text-[#14262d] font-bold">
                  <th className="py-2.5 px-3 w-28">id_evento</th>
                  <th className="py-2.5 px-3">titulo / descricao</th>
                  <th className="py-2.5 px-3 w-36">start_time</th>
                  <th className="py-2.5 px-3 w-36">end_time</th>
                  <th className="py-2.5 px-3 text-center w-24">tipo_bloco</th>
                  <th className="py-2.5 px-3 text-center w-28">outcome</th>
                  <th className="py-2.5 px-3 w-32">id_sdr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d1d5d6]/50">
                {sdrCalendarBlocks.map((block) => (
                  <tr key={block.id_evento} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#6a797c]">
                      {block.id_evento}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#14262d]">
                      {block.title || 'Reunião Comercial'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#6a797c]">
                      {block.start_time ? new Date(block.start_time).toLocaleTimeString('pt-BR') : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#6a797c]">
                      {block.end_time ? new Date(block.end_time).toLocaleTimeString('pt-BR') : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                        {block.tipo_bloco}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        block.outcome === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-sky-100 text-sky-800 border-sky-300'
                      }`}>
                        {block.outcome || 'SCHEDULED'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-[#14262d]">
                      {block.id_sdr}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECTION 4: WEBHOOK EM TEMPO REAL (CONTACT.CREATION)      */}
      {/* ======================================================== */}
      <div className="bg-[#14262d] text-white rounded-xl p-6 shadow-sm border border-[#1e343c] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e343c] pb-4">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                4. Webhook em Tempo Real: Entrada de Leads (contact.creation / lead.creation)
              </h3>
              <p className="text-xs text-[#d1d5d6]/80 mt-0.5">
                Rota pública backend que escuta novos leads da HubSpot e incrementa automaticamente o campo <strong>leads_recebidos_hoje</strong> (+1) do SDR responsável.
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            POST ATIVO 24/7
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-[#0e1d23] rounded-xl border border-[#1e343c] space-y-1.5 md:col-span-2">
            <span className="font-bold text-[#d1d5d6] text-[11px] uppercase">URL do Webhook para Cadastrar na HubSpot:</span>
            <div className="flex items-center gap-2 bg-[#14262d] p-2 rounded border border-[#1e343c] font-mono text-xs text-amber-300">
              <span className="truncate">{webhookUrl}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  setSyncFeedback('URL do Webhook copiada para a área de transferência!');
                  setTimeout(() => setSyncFeedback(null), 3000);
                }}
                className="p-1 hover:text-white cursor-pointer ml-auto"
                title="Copiar URL"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-[#d1d5d6]/70 pt-1">
              Configure a assinatura para os tópicos <strong>contact.creation</strong> ou <strong>lead.creation</strong>. O backend extrai o <em>hubspot_owner_id</em> do payload.
            </p>
          </div>

          <div className="p-3.5 bg-[#0e1d23] rounded-xl border border-[#1e343c] space-y-2 flex flex-col justify-between">
            <div>
              <span className="font-bold text-[#d1d5d6] text-[11px] uppercase">Simulador de Webhook:</span>
              <p className="text-[11px] text-[#d1d5d6]/70 mt-1">
                Dispare um evento de teste para validar o incremento de leads em tempo real.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleSimulateWebhook('hs_owner_mariana')}
                disabled={isTriggeringWebhook}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-[#14262d] transition-all cursor-pointer shadow-2xs text-center"
              >
                +1 Inbound (Mariana)
              </button>

              <button
                onClick={() => handleSimulateWebhook('hs_owner_lucas')}
                disabled={isTriggeringWebhook}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-all cursor-pointer shadow-2xs text-center"
              >
                +1 Outbound (Lucas)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
