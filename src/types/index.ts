export type UserRole = 'ADMIN' | 'SDR';

export type SdrScope = 
  | 'Inbound Qualificação'
  | 'Outbound Prospecção'
  | 'Enterprise / Contas Estratégicas'
  | 'Mid-Market'
  | 'Recuperação & Reengajamento';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title?: string;
  active: boolean;
  hubspotOwnerId: string;
  microsoftUserId: string;
  avatarUrl?: string;
  scope?: SdrScope;
  password?: string;
  status?: 'ACTIVE' | 'PENDING_INVITE';
  invitedAt?: string;
  microsoftConnected?: boolean;
  microsoftConnectedAt?: string;
}

export interface SdrProfile {
  id: string;
  userId: string;
  workdayStart: string; // "09:00"
  workdayEnd: string;   // "19:00"
  lunchStart: string;   // "12:00"
  lunchDurationMinutes: number; // 60
  timezone: string;     // "America/Sao_Paulo"
  scope: SdrScope;
  active: boolean;
}

export type PeriodType = 'daily' | 'weekly' | 'monthly';

export interface Goal {
  id: string;
  targetId: string; // 'TEAM' or userId
  targetType: 'TEAM' | 'SDR';
  scope: SdrScope | 'Equipe Geral';
  dailyScheduledMeetings: number;
  weeklyScheduledMeetings: number;
  monthlyScheduledMeetings: number;
  expectedAttendanceRatePercent: number; // e.g. 75%
  validFrom: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  updatedBy: string;
  updatedAt: string;
  notes?: string;
}

export type TaskType = 
  | 'NEW_LEAD'
  | 'WAITING_QUEUE_LEAD'
  | 'OVERDUE_FOLLOWUP'
  | 'TOUCH_POINT'
  | 'CONFIRMATION'
  | 'HANDOFF'
  | 'NO_SHOW_RECOVERY'
  | 'CANCELLED_RECOVERY'
  | 'PROSPECT_ACTIVATION'
  | 'OUTBOUND_CADENCE'
  | 'SOCIAL_SELLING'
  | 'ADMINISTRATIVE';

export type TaskPriority = 'CRITICAL_SLA' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Task {
  id: string;
  externalHubspotId: string;
  ownerId: string;
  title: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string; // ISO string or YYYY-MM-DDTHH:mm
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
  associatedContactId: string;
  contactName: string;
  contactPhone?: string;
  companyName: string;
  dealValue?: number;
  requiresCall: boolean;
  callNotes?: string;
  hubspotUrl: string;
  lastSyncedAt: string;
  isWaitingQueue?: boolean; // Lead que virou o dia (D-1 backlog)
}

export type MeetingStatus = 'SCHEDULED' | 'HELD' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';

export interface Meeting {
  id: string;
  externalHubspotId: string;
  ownerId: string;
  title: string;
  scheduledAt: string; // ISO string
  endedAt: string;     // ISO string
  bookedAt: string;    // Date when meeting was created/booked
  status: MeetingStatus;
  meetingType: 'QUALIFICATION' | 'DEMO' | 'CLOSING_HANDOFF' | 'FOLLOWUP';
  contactName: string;
  contactEmail: string;
  companyName: string;
  dealValue?: number;
  source: 'INBOUND_FORM' | 'OUTBOUND_CADENCE' | 'WHATSAPP' | 'REFERRAL';
  closerName?: string;
  notes?: string;
  isConfirmed: boolean;
  lastSyncedAt: string;
}

export type CalendarEventType = 
  | 'DAILY' 
  | 'TEAM_MEETING' 
  | 'WORK_MEETING' 
  | 'ONE_ON_ONE' 
  | 'INTERNAL_WORK' 
  | 'LUNCH_BREAK' 
  | 'EXTERNAL_APPOINTMENT'
  | 'ORGANIC_MEETING'
  | 'CORPORATE_EVENT'
  | 'TRAINING'
  | 'ALL_HANDS'
  | 'CLOSING_MEETING';

export interface CalendarEvent {
  id: string;
  externalEventId: string;
  userId: string; // 'ALL' or specific SDR
  title: string;
  startsAt: string; // "09:30" or ISO
  endsAt: string;   // "10:00" or ISO
  blocksAvailability: boolean;
  eventType: CalendarEventType;
  recurrenceRule?: string; // e.g. "WEEKDAYS", "MONDAY", "WEDNESDAY", "BIWEEKLY_FRIDAY", "SINGLE"
  lastSyncedAt: string;
  source?: 'TEAMS' | 'HUBSPOT' | 'OUTLOOK' | 'INTERNAL';
  description?: string;
}

export interface TaskAllocation {
  id: string;
  taskId: string;
  planningBlockId: string;
  allocationOrder: number;
  estimatedMinutes: number;
  recommendationStatus: 'ACCEPTED' | 'PENDING' | 'REJECTED';
  rationale: string;
}

export type PlanningBlockType = 
  | 'WAITING_QUEUE_AND_NEW_LEADS'
  | 'TOUCH_POINTS'
  | 'CONFIRMATIONS_AND_HANDOFF'
  | 'RECOVERY_NO_SHOW'
  | 'PROSPECT_ACTIVATION'
  | 'OUTBOUND_CADENCE'
  | 'SOCIAL_SELLING'
  | 'FIXED_DAILY'
  | 'FIXED_TEAM_MEETING'
  | 'FIXED_WORK_MEETING'
  | 'FIXED_ONE_ON_ONE'
  | 'CALENDAR_EVENT'
  | 'LUNCH'
  | 'CRITICAL_SLA'
  | 'CALLS_CADENCE'
  | 'NEW_LEADS'
  | 'RECOVERY'
  | 'CONFIRMATIONS'
  | 'WRAP_UP';

export interface PlanningBlock {
  id: string;
  userId: string;
  planDate: string; // YYYY-MM-DD
  startsAt: string; // "09:00"
  endsAt: string;   // "10:00"
  availableMinutes: number;
  allocatedMinutes: number;
  blockType: PlanningBlockType;
  title: string;
  description?: string;
  category: 'INBOUND' | 'OUTBOUND' | 'CALENDAR_FIXED' | 'CALENDAR_ORGANIC' | 'LUNCH';
  requiresMandatoryCall?: boolean;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  allocations: TaskAllocation[];
  isAdaptiveAdjusted?: boolean;
  adjustmentReason?: string;
}

export interface IntegrationStatus {
  provider: 'HUBSPOT' | 'MICROSOFT_GRAPH';
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'CONFIGURING';
  isDemoMode: boolean;
  lastSuccessAt: string | null;
  lastError: string | null;
  recordsImported: number;
  apiKeyOrSecretSet: boolean;
  details: {
    portalId?: string;
    accountEmail?: string;
    webhookEventsReceived?: number;
    endpointsChecked?: string[];
  };
}

export interface OperationalAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  sdrId?: string;
  sdrName?: string;
  reason: string;
  estimatedImpact: string;
  recommendedAction: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export type NotificationType = 'NEW_INBOUND_LEAD' | 'NEW_OUTBOUND_LIST' | 'GOAL_ALERT' | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetUserId: string; // 'ALL' or specific SDR userId
  meta?: {
    contactName?: string;
    companyName?: string;
    listName?: string;
    leadsCount?: number;
    priority?: string;
    slaMinutes?: number;
    sdrName?: string;
    email?: string;
    scope?: string;
    dailyGoal?: number;
  };
}

// --- HubSpot & Microsoft Native Integration Models ---
export interface SdrMetric {
  id_sdr: string;
  hubspot_owner_id: string;
  leads_recebidos_hoje: number;
  reunioes_agendadas: number;
  reunioes_realizadas: number;
  updated_at: string;
}

export interface SdrTaskItem {
  id_tarefa: string;
  titulo: string;
  vencimento: string; // ISO timestamp
  status: 'NOT_STARTED' | 'COMPLETED';
  id_sdr: string;
  hubspot_owner_id?: string;
  classificacao: 'Vencida' | 'Tarefa do Dia' | 'Futura';
  tipo_tarefa?: string;
}

export interface SdrCalendarBlock {
  id_evento: string; // Accepts Microsoft ID or HubSpot ID
  start_time: string; // ISO timestamp or HH:mm
  end_time: string;   // ISO timestamp or HH:mm
  tipo_bloco: 'reuniao' | 'tarefa';
  id_sdr: string;
  provedor: 'hubspot' | 'microsoft'; // Required column
  hubspot_owner_id?: string;
  outcome?: 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  title?: string;
  isUnifiedDeduped?: boolean; // Set to true when consolidated between HubSpot and Outlook
  unifiedProviders?: ('hubspot' | 'microsoft')[];
}

export interface MicrosoftUserConnection {
  userId: string;
  userEmail?: string;
  isConnected: boolean;
  connectedAt?: string;
  expiresAt?: string;
  scope?: string;
}

export interface HubspotConnectionConfig {
  isConfigured: boolean;
  tokenMasked: string;
  portalId?: string;
  lastTestedAt?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastError?: string;
  lastSyncMeetingsAt?: string;
  lastSyncTasksAt?: string;
}
