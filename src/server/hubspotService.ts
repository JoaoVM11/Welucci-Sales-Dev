/**
 * Backend Service: HubSpot Native Integration & Sync Controller
 * Handles token storage, HubSpot API consumption, SDR mirror tables,
 * and real-time webhook listeners for lead creation events.
 */

export interface SdrMetricRecord {
  id_sdr: string;
  hubspot_owner_id: string;
  leads_recebidos_hoje: number;
  reunioes_agendadas: number;
  reunioes_realizadas: number;
  updated_at: string;
}

export interface SdrTaskRecord {
  id_tarefa: string;
  titulo: string;
  vencimento: string; // ISO string timestamp
  status: 'NOT_STARTED' | 'COMPLETED';
  id_sdr: string;
  hubspot_owner_id: string;
  classificacao: 'Vencida' | 'Tarefa do Dia' | 'Futura';
  tipo_tarefa?: string;
}

export interface SdrCalendarBlockRecord {
  id_evento: string;
  start_time: string; // ISO string or HH:mm
  end_time: string;   // ISO string or HH:mm
  tipo_bloco: 'reuniao' | 'tarefa';
  id_sdr: string;
  provedor: 'hubspot' | 'microsoft';
  hubspot_owner_id: string;
  outcome?: 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  title: string;
}

// In-Memory Secure Token Storage (initialized from process.env if present)
let storedHubspotToken: string = process.env.HUBSPOT_ACCESS_TOKEN || '';
let webhookSecret: string = process.env.HUBSPOT_WEBHOOK_SECRET || 'welucci_hubspot_webhook_secret_key';

// In-Memory Database Mirror Tables based on hubspot_owner_id
const sdrMetricsTable: Map<string, SdrMetricRecord> = new Map([
  [
    'user-sdr-inbound',
    {
      id_sdr: 'user-sdr-inbound',
      hubspot_owner_id: 'hs_owner_mariana',
      leads_recebidos_hoje: 8,
      reunioes_agendadas: 4,
      reunioes_realizadas: 3,
      updated_at: new Date().toISOString(),
    },
  ],
  [
    'user-sdr-outbound',
    {
      id_sdr: 'user-sdr-outbound',
      hubspot_owner_id: 'hs_owner_lucas',
      leads_recebidos_hoje: 5,
      reunioes_agendadas: 3,
      reunioes_realizadas: 2,
      updated_at: new Date().toISOString(),
    },
  ],
]);

const sdrTasksTable: SdrTaskRecord[] = [
  {
    id_tarefa: 'task-hs-101',
    titulo: '📞 Touch Point 1: Fila D-1 - Rodrigo Mendes (TecnoLog)',
    vencimento: '2026-10-21T09:15:00.000Z',
    status: 'NOT_STARTED',
    id_sdr: 'user-sdr-inbound',
    hubspot_owner_id: 'hs_owner_mariana',
    classificacao: 'Tarefa do Dia',
    tipo_tarefa: 'CALL',
  },
  {
    id_tarefa: 'task-hs-102',
    titulo: '⚡ SLA Crítico: Novo Lead Inbound - Camila Duarte (Nexus Consultoria)',
    vencimento: '2026-10-21T10:30:00.000Z',
    status: 'NOT_STARTED',
    id_sdr: 'user-sdr-inbound',
    hubspot_owner_id: 'hs_owner_mariana',
    classificacao: 'Tarefa do Dia',
    tipo_tarefa: 'CALL',
  },
  {
    id_tarefa: 'task-hs-103',
    titulo: '🔄 Follow-up Cadência D+3: André Silveira (Grupo Delta)',
    vencimento: '2026-10-20T17:00:00.000Z', // Yesterday
    status: 'NOT_STARTED',
    id_sdr: 'user-sdr-inbound',
    hubspot_owner_id: 'hs_owner_mariana',
    classificacao: 'Vencida',
    tipo_tarefa: 'CALL',
  },
  {
    id_tarefa: 'task-hs-104',
    titulo: '🎯 Cold Call Outbound: Diretor Operacional (Braslog Logística)',
    vencimento: '2026-10-21T11:00:00.000Z',
    status: 'NOT_STARTED',
    id_sdr: 'user-sdr-outbound',
    hubspot_owner_id: 'hs_owner_lucas',
    classificacao: 'Tarefa do Dia',
    tipo_tarefa: 'CALL',
  },
  {
    id_tarefa: 'task-hs-105',
    titulo: '💼 Social Selling LinkedIn: Envio de InMail para 5 Diretores Logística',
    vencimento: '2026-10-20T16:30:00.000Z',
    status: 'NOT_STARTED',
    id_sdr: 'user-sdr-outbound',
    hubspot_owner_id: 'hs_owner_lucas',
    classificacao: 'Vencida',
    tipo_tarefa: 'LINKEDIN_MESSAGE',
  },
  {
    id_tarefa: 'task-hs-106',
    titulo: '📞 Touch Point 2 Cadência: Reengajamento Diretor (Vanguardia)',
    vencimento: '2026-10-22T14:00:00.000Z', // Tomorrow
    status: 'NOT_STARTED',
    id_sdr: 'user-sdr-outbound',
    hubspot_owner_id: 'hs_owner_lucas',
    classificacao: 'Futura',
    tipo_tarefa: 'CALL',
  },
];

const sdrCalendarBlocksTable: SdrCalendarBlockRecord[] = [
  {
    id_evento: 'hs-meet-001',
    start_time: '2026-10-21T10:00:00.000Z',
    end_time: '2026-10-21T10:30:00.000Z',
    tipo_bloco: 'reuniao',
    id_sdr: 'user-sdr-inbound',
    provedor: 'hubspot',
    hubspot_owner_id: 'hs_owner_mariana',
    outcome: 'COMPLETED',
    title: 'Diagnóstico Comercial B2B — TecnoLog x Closer Welucci',
  },
  {
    id_evento: 'hs-meet-002',
    start_time: '2026-10-21T14:30:00.000Z',
    end_time: '2026-10-21T15:00:00.000Z',
    tipo_bloco: 'reuniao',
    id_sdr: 'user-sdr-inbound',
    provedor: 'hubspot',
    hubspot_owner_id: 'hs_owner_mariana',
    outcome: 'SCHEDULED',
    title: 'Apresentação de Solução B2B — Prado & Associados',
  },
  {
    id_evento: 'hs-meet-003',
    start_time: '2026-10-21T16:00:00.000Z',
    end_time: '2026-10-21T16:30:00.000Z',
    tipo_bloco: 'reuniao',
    id_sdr: 'user-sdr-outbound',
    provedor: 'hubspot',
    hubspot_owner_id: 'hs_owner_lucas',
    outcome: 'SCHEDULED',
    title: 'Primeira Conversa Executiva Outbound — Braslog',
  },
];

// Helper: Mask token for UI presentation
export function maskToken(token: string): string {
  if (!token) return '';
  if (token.length <= 10) return '••••••••';
  return `${token.substring(0, 8)}••••••••••••${token.substring(token.length - 4)}`;
}

// Token Getters and Setters
export function getStoredHubspotToken(): string {
  return storedHubspotToken;
}

export function saveHubspotToken(token: string): { success: boolean; tokenMasked: string } {
  storedHubspotToken = (token || '').trim();
  // Also save to environment for process lifetime
  process.env.HUBSPOT_ACCESS_TOKEN = storedHubspotToken;
  console.log(`[HubSpot Service] Private App Access Token atualizado com sucesso (${maskToken(storedHubspotToken)})`);
  return {
    success: true,
    tokenMasked: maskToken(storedHubspotToken),
  };
}

/**
 * 1. Test Connection: Dispatches GET request to HubSpot Contacts API
 * Endpoint: https://api.hubapi.com/crm/v3/objects/contacts?limit=1
 */
export async function testHubspotConnection(tokenToTest?: string): Promise<{
  success: boolean;
  statusCode: number;
  message: string;
  error?: string;
  data?: any;
}> {
  const token = (tokenToTest || storedHubspotToken || '').trim();

  if (!token) {
    return {
      success: false,
      statusCode: 400,
      message: 'Token de Acesso não configurado.',
      error: 'Por favor, insira o Private App Access Token da HubSpot.',
    };
  }

  const endpoint = 'https://api.hubapi.com/crm/v3/objects/contacts?limit=1';

  try {
    console.log(`[HubSpot Service] Validando token na API da HubSpot: ${endpoint}...`);
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const statusCode = response.status;
    console.log(`[HubSpot Service] Resposta recebida da HubSpot: HTTP ${statusCode}`);

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        statusCode,
        message: 'Conexão estabelecida com sucesso!',
        data: {
          totalReturned: data.results?.length || 0,
          paging: data.paging,
        },
      };
    }

    // Handle authentication / permission errors
    if (statusCode === 401 || statusCode === 403) {
      const errorBody = await response.text();
      console.error(`[HubSpot Auth Error HTTP ${statusCode}]:`, errorBody);
      return {
        success: false,
        statusCode,
        message: 'Falha de autenticação na HubSpot.',
        error: 'Token inválido, expirado ou sem as permissões requeridas (crm.objects.contacts.read).',
      };
    }

    // Handle rate limiting
    if (statusCode === 429) {
      console.warn('[HubSpot Rate Limit Error HTTP 429]: Rate limit excedido');
      return {
        success: false,
        statusCode,
        message: 'Limite de requisições excedido.',
        error: 'A API da HubSpot atingiu o limite de chamadas simultâneas (Rate Limit 429). Tente novamente em alguns segundos.',
      };
    }

    const errorText = await response.text();
    return {
      success: false,
      statusCode,
      message: `Erro retornado pela API da HubSpot (HTTP ${statusCode}).`,
      error: errorText,
    };
  } catch (err: any) {
    console.error('[HubSpot Connection Exception]:', err);
    return {
      success: false,
      statusCode: 500,
      message: 'Erro de rede ou falha ao alcançar os servidores da HubSpot.',
      error: err?.message || String(err),
    };
  }
}

/**
 * 3.A) Sync Meetings and Calendar:
 * Endpoint: GET https://api.hubapi.com/crm/v3/objects/meetings
 * Updates 'sdr_calendar_blocks'. Increments 'reunioes_realizadas' if COMPLETED,
 * increments 'reunioes_agendadas' if SCHEDULED.
 */
export async function syncHubspotMeetings(tokenToUse?: string): Promise<{
  success: boolean;
  statusCode: number;
  message: string;
  calendarBlocks: SdrCalendarBlockRecord[];
  metrics: SdrMetricRecord[];
}> {
  const token = (tokenToUse || storedHubspotToken || '').trim();
  const endpoint = 'https://api.hubapi.com/crm/v3/objects/meetings?limit=50&properties=hs_meeting_start_time,hs_meeting_end_time,hs_meeting_title,hs_meeting_outcome,hubspot_owner_id';

  let rawMeetings: any[] = [];
  let isLiveCall = false;

  if (token) {
    try {
      console.log(`[HubSpot Service] Consumindo meetings da HubSpot: ${endpoint}...`);
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const json = await response.json();
        rawMeetings = json.results || [];
        isLiveCall = true;
        console.log(`[HubSpot Service] ${rawMeetings.length} reuniões importadas diretamente da API da HubSpot.`);
      } else {
        console.warn(`[HubSpot Meetings API Warning]: HTTP ${response.status}. Usando espelho local sincronizado.`);
      }
    } catch (err) {
      console.error('[HubSpot Meetings API Error]:', err);
    }
  }

  // If live records were retrieved, reconcile into sdrCalendarBlocksTable and sdrMetricsTable
  if (isLiveCall && rawMeetings.length > 0) {
    for (const m of rawMeetings) {
      const props = m.properties || {};
      const ownerId = props.hubspot_owner_id || 'hs_owner_mariana';
      const outcome = (props.hs_meeting_outcome || 'SCHEDULED').toUpperCase();

      // Find matching SDR
      const sdrId = ownerId === 'hs_owner_lucas' ? 'user-sdr-outbound' : 'user-sdr-inbound';

      // Check if block already exists or push
      const existingIdx = sdrCalendarBlocksTable.findIndex(b => b.id_evento === m.id);
      const newBlock: SdrCalendarBlockRecord = {
        id_evento: m.id || `hs-meet-${Date.now()}`,
        start_time: props.hs_meeting_start_time || new Date().toISOString(),
        end_time: props.hs_meeting_end_time || new Date(Date.now() + 30 * 60000).toISOString(),
        tipo_bloco: 'reuniao',
        id_sdr: sdrId,
        provedor: 'hubspot',
        hubspot_owner_id: ownerId,
        outcome: outcome as any,
        title: props.hs_meeting_title || 'Reunião Comercial HubSpot',
      };

      if (existingIdx >= 0) {
        sdrCalendarBlocksTable[existingIdx] = newBlock;
      } else {
        sdrCalendarBlocksTable.push(newBlock);
      }

      // Update counters in sdr_metrics
      const metric = sdrMetricsTable.get(sdrId);
      if (metric) {
        if (outcome === 'COMPLETED') {
          metric.reunioes_realizadas += 1;
        } else if (outcome === 'SCHEDULED') {
          metric.reunioes_agendadas += 1;
        }
        metric.updated_at = new Date().toISOString();
        sdrMetricsTable.set(sdrId, metric);
      }
    }
  } else {
    // Audit current blocks and update metrics counters
    for (const [, metric] of sdrMetricsTable.entries()) {
      const scheduled = sdrCalendarBlocksTable.filter(b => b.id_sdr === metric.id_sdr && b.outcome === 'SCHEDULED').length;
      const completed = sdrCalendarBlocksTable.filter(b => b.id_sdr === metric.id_sdr && b.outcome === 'COMPLETED').length;
      metric.reunioes_agendadas = Math.max(metric.reunioes_agendadas, scheduled);
      metric.reunioes_realizadas = Math.max(metric.reunioes_realizadas, completed);
      metric.updated_at = new Date().toISOString();
    }
  }

  return {
    success: true,
    statusCode: 200,
    message: isLiveCall 
      ? `Reuniões e blocos de calendário sincronizados com a API da HubSpot (${rawMeetings.length} registros).`
      : 'Reuniões e blocos de calendário reconciliados e métricas atualizadas.',
    calendarBlocks: [...sdrCalendarBlocksTable],
    metrics: Array.from(sdrMetricsTable.values()),
  };
}

/**
 * 3.B) Sync Cadence Tasks:
 * Endpoint: GET https://api.hubapi.com/crm/v3/objects/tasks
 * Classifies tasks:
 * - If hs_timestamp < now && hs_task_status == 'NOT_STARTED' => "Vencida"
 * - If hs_timestamp is today && hs_task_status == 'NOT_STARTED' => "Tarefa do Dia"
 * - Otherwise => "Futura"
 */
export async function syncHubspotTasks(tokenToUse?: string): Promise<{
  success: boolean;
  statusCode: number;
  message: string;
  tasks: SdrTaskRecord[];
}> {
  const token = (tokenToUse || storedHubspotToken || '').trim();
  const endpoint = 'https://api.hubapi.com/crm/v3/objects/tasks?limit=50&properties=hs_task_subject,hs_timestamp,hs_task_status,hs_task_type,hubspot_owner_id';

  let rawTasks: any[] = [];
  let isLiveCall = false;

  if (token) {
    try {
      console.log(`[HubSpot Service] Consumindo tasks da HubSpot: ${endpoint}...`);
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const json = await response.json();
        rawTasks = json.results || [];
        isLiveCall = true;
        console.log(`[HubSpot Service] ${rawTasks.length} tarefas de cadência importadas da HubSpot.`);
      } else {
        console.warn(`[HubSpot Tasks API Warning]: HTTP ${response.status}. Usando espelho local.`);
      }
    } catch (err) {
      console.error('[HubSpot Tasks API Error]:', err);
    }
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  if (isLiveCall && rawTasks.length > 0) {
    for (const t of rawTasks) {
      const props = t.properties || {};
      const ownerId = props.hubspot_owner_id || 'hs_owner_mariana';
      const sdrId = ownerId === 'hs_owner_lucas' ? 'user-sdr-outbound' : 'user-sdr-inbound';
      const timestamp = props.hs_timestamp || now.toISOString();
      const taskDate = new Date(timestamp);
      const taskDateStr = taskDate.toISOString().slice(0, 10);
      const rawStatus = (props.hs_task_status || 'NOT_STARTED').toUpperCase();
      const status: 'NOT_STARTED' | 'COMPLETED' = rawStatus === 'COMPLETED' ? 'COMPLETED' : 'NOT_STARTED';

      // Classification Logic:
      let classificacao: 'Vencida' | 'Tarefa do Dia' | 'Futura' = 'Futura';
      if (status === 'NOT_STARTED') {
        if (taskDate < now && taskDateStr < todayStr) {
          classificacao = 'Vencida';
        } else if (taskDateStr === todayStr) {
          classificacao = 'Tarefa do Dia';
        } else {
          classificacao = 'Futura';
        }
      }

      const existingIdx = sdrTasksTable.findIndex(task => task.id_tarefa === t.id);
      const taskRecord: SdrTaskRecord = {
        id_tarefa: t.id,
        titulo: props.hs_task_subject || 'Tarefa de Cadência HubSpot',
        vencimento: timestamp,
        status,
        id_sdr: sdrId,
        hubspot_owner_id: ownerId,
        classificacao,
        tipo_tarefa: props.hs_task_type || 'CALL',
      };

      if (existingIdx >= 0) {
        sdrTasksTable[existingIdx] = taskRecord;
      } else {
        sdrTasksTable.push(taskRecord);
      }
    }
  } else {
    // Re-classify existing tasks with current time
    for (const task of sdrTasksTable) {
      if (task.status === 'NOT_STARTED') {
        const taskDate = new Date(task.vencimento);
        const taskDateStr = taskDate.toISOString().slice(0, 10);
        if (taskDate < now && taskDateStr < todayStr) {
          task.classificacao = 'Vencida';
        } else if (taskDateStr === todayStr) {
          task.classificacao = 'Tarefa do Dia';
        } else {
          task.classificacao = 'Futura';
        }
      }
    }
  }

  return {
    success: true,
    statusCode: 200,
    message: isLiveCall 
      ? `Tarefas importadas e classificadas com sucesso (${rawTasks.length} registros).`
      : 'Tarefas de cadência reclassificadas com sucesso.',
    tasks: [...sdrTasksTable],
  };
}

/**
 * 4. Webhook Receiver for Real-Time Lead Inflow:
 * Endpoint: POST /api/webhooks/hubspot
 * Listens to: 'contact.creation' or 'lead.creation'
 * Extracts 'hubspot_owner_id', locates matching SDR, and increments 'leads_recebidos_hoje' by +1.
 */
export function handleHubspotWebhook(payload: any, secretParam?: string): {
  success: boolean;
  message: string;
  processedCount: number;
  matchedSdr?: string;
  newLeadsCount?: number;
} {
  console.log('[HubSpot Webhook Event Received]:', JSON.stringify(payload, null, 2));

  // Basic validation check
  if (secretParam && webhookSecret && secretParam !== webhookSecret) {
    console.warn('[HubSpot Webhook Warning]: Invalid secret signature provided.');
    return {
      success: false,
      message: 'Assinatura ou secret inválido para o Webhook.',
      processedCount: 0,
    };
  }

  // Handle both array of events (standard HubSpot payload) and single event
  const events = Array.isArray(payload) ? payload : [payload];
  let processedCount = 0;
  let lastMatchedSdr = '';
  let updatedLeadsTotal = 0;

  for (const ev of events) {
    const eventType = ev.subscriptionType || ev.eventType || ev.type || 'contact.creation';
    
    // Check if event is contact or lead creation
    if (
      eventType.includes('contact.creation') || 
      eventType.includes('lead.creation') ||
      eventType.includes('contact.propertyChange') ||
      eventType.includes('LEAD_INFLOW')
    ) {
      // Extract hubspot_owner_id
      const ownerId = 
        ev.properties?.hubspot_owner_id?.value ||
        ev.propertyValue ||
        ev.hubspot_owner_id ||
        ev.ownerId ||
        'hs_owner_mariana'; // Default to inbound SDR

      // Match SDR
      const targetSdrId = ownerId === 'hs_owner_lucas' ? 'user-sdr-outbound' : 'user-sdr-inbound';
      const metric = sdrMetricsTable.get(targetSdrId);

      if (metric) {
        metric.leads_recebidos_hoje += 1;
        metric.updated_at = new Date().toISOString();
        sdrMetricsTable.set(targetSdrId, metric);

        lastMatchedSdr = targetSdrId;
        updatedLeadsTotal = metric.leads_recebidos_hoje;
        processedCount += 1;

        console.log(`[HubSpot Webhook] Lead incrementado para SDR ${targetSdrId} (Owner: ${ownerId}). Total hoje: ${metric.leads_recebidos_hoje}`);
      }
    }
  }

  return {
    success: true,
    message: processedCount > 0 
      ? `Webhook processado com sucesso. +${processedCount} lead(s) adicionados ao SDR responsável.`
      : 'Webhook recebido, nenhum evento de contact.creation ou lead.creation elegível.',
    processedCount,
    matchedSdr: lastMatchedSdr,
    newLeadsCount: updatedLeadsTotal,
  };
}

// Data accessors for frontend querying
export function getAllSdrMetrics(): SdrMetricRecord[] {
  return Array.from(sdrMetricsTable.values());
}

export function getAllSdrTasks(): SdrTaskRecord[] {
  return [...sdrTasksTable];
}

export function getAllSdrCalendarBlocks(): SdrCalendarBlockRecord[] {
  return [...sdrCalendarBlocksTable];
}
