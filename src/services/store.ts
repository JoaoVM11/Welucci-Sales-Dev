import { 
  User, SdrProfile, Goal, Task, Meeting, CalendarEvent, 
  IntegrationStatus, OperationalAlert, AuditLog, PlanningBlock, SdrScope, AppNotification,
  SdrMetric, SdrTaskItem, SdrCalendarBlock 
} from '../types';
import { 
  INITIAL_USERS, INITIAL_PROFILES, INITIAL_GOALS, 
  INITIAL_TASKS, INITIAL_MEETINGS, INITIAL_CALENDAR_EVENTS, 
  INITIAL_INTEGRATIONS, INITIAL_ALERTS, INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS 
} from './mockData';
import { 
  calculateAvailableCapacityMinutes, calculateWorkloadMinutes, 
  calculateCapacityUtilization, calculateGapD0, calculateAttainment, 
  calculateAttendanceRate, calculatePaceRequired, generateDailyPlan, 
  getIdealDayBlueprints, getWeekdayInfo, RoutineBlockBlueprint, 
  SdrKpiSummary, TeamKpiSummary 
} from './calculationEngine';
import { 
  db, doc, setDoc, deleteDoc, getDocs, collection, onSnapshot, 
  handleFirestoreError, OperationType, isCloudDatabaseConfigured 
} from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'welucci_current_user_id',
  USERS: 'welucci_users',
  PROFILES: 'welucci_profiles',
  GOALS: 'welucci_goals',
  TASKS: 'welucci_tasks',
  MEETINGS: 'welucci_meetings',
  CALENDAR: 'welucci_calendar',
  INTEGRATIONS: 'welucci_integrations',
  ALERTS: 'welucci_alerts',
  AUDIT: 'welucci_audit',
  NOTIFICATIONS: 'welucci_notifications',
  PLANNING_BLOCKS: 'welucci_planning_blocks',
  IS_DEMO: 'welucci_is_demo_mode',
  DELETED_USER_IDS: 'welucci_deleted_user_ids',
  CUSTOM_ROUTINES: 'welucci_custom_routines',
  SDR_METRICS: 'welucci_sdr_metrics',
  SDR_TASKS: 'welucci_sdr_tasks',
  SDR_CALENDAR_BLOCKS: 'welucci_sdr_calendar_blocks',
};

class StoreService {
  private users: User[] = [];
  private profiles: SdrProfile[] = [];
  private goals: Goal[] = [];
  private tasks: Task[] = [];
  private meetings: Meeting[] = [];
  private calendarEvents: CalendarEvent[] = [];
  private integrations: IntegrationStatus[] = [];
  private alerts: OperationalAlert[] = [];
  private auditLogs: AuditLog[] = [];
  private notifications: AppNotification[] = [];
  private planningBlocks: Record<string, PlanningBlock[]> = {};
  private customRoutines: Record<string, RoutineBlockBlueprint[]> = {};
  private sdrMetrics: SdrMetric[] = [];
  private sdrTasks: SdrTaskItem[] = [];
  private sdrCalendarBlocks: SdrCalendarBlock[] = [];
  private deletedUserIds: string[] = [];
  private currentUserId: string = 'user-admin';
  private isDemoMode: boolean = true;
  private listeners: Array<() => void> = [];
  
  // Cloud Database status
  private isCloudConnected: boolean = false;
  private lastCloudSync: string | null = null;
  private isSyncingFromCloud: boolean = false;

  constructor() {
    this.loadState();
    if (typeof window !== 'undefined' && isCloudDatabaseConfigured) {
      this.initFirestoreSync();
    }
  }

  private loadState() {
    try {
      this.currentUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user-admin';
      this.isDemoMode = localStorage.getItem(STORAGE_KEYS.IS_DEMO) !== 'false';

      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      this.users = storedUsers ? JSON.parse(storedUsers) : [...INITIAL_USERS];

      const storedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      this.profiles = storedProfiles ? JSON.parse(storedProfiles) : [...INITIAL_PROFILES];

      const storedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
      this.goals = storedGoals ? JSON.parse(storedGoals) : [...INITIAL_GOALS];

      const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      this.tasks = storedTasks ? JSON.parse(storedTasks) : [...INITIAL_TASKS];

      const storedMeetings = localStorage.getItem(STORAGE_KEYS.MEETINGS);
      this.meetings = storedMeetings ? JSON.parse(storedMeetings) : [...INITIAL_MEETINGS];

      const storedCalendar = localStorage.getItem(STORAGE_KEYS.CALENDAR);
      this.calendarEvents = storedCalendar ? JSON.parse(storedCalendar) : [...INITIAL_CALENDAR_EVENTS];

      const storedIntegrations = localStorage.getItem(STORAGE_KEYS.INTEGRATIONS);
      this.integrations = storedIntegrations ? JSON.parse(storedIntegrations) : [...INITIAL_INTEGRATIONS];

      const storedAlerts = localStorage.getItem(STORAGE_KEYS.ALERTS);
      this.alerts = storedAlerts ? JSON.parse(storedAlerts) : [...INITIAL_ALERTS];

      const storedAudit = localStorage.getItem(STORAGE_KEYS.AUDIT);
      this.auditLogs = storedAudit ? JSON.parse(storedAudit) : [...INITIAL_AUDIT_LOGS];

      const storedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      this.notifications = storedNotifs ? JSON.parse(storedNotifs) : [...INITIAL_NOTIFICATIONS];

      const storedBlocks = localStorage.getItem(STORAGE_KEYS.PLANNING_BLOCKS);
      this.planningBlocks = storedBlocks ? JSON.parse(storedBlocks) : {};

      const storedCustom = localStorage.getItem(STORAGE_KEYS.CUSTOM_ROUTINES);
      this.customRoutines = storedCustom ? JSON.parse(storedCustom) : {};

      const storedDeleted = localStorage.getItem(STORAGE_KEYS.DELETED_USER_IDS);
      this.deletedUserIds = storedDeleted ? JSON.parse(storedDeleted) : [];

      const storedMetrics = localStorage.getItem(STORAGE_KEYS.SDR_METRICS);
      this.sdrMetrics = storedMetrics ? JSON.parse(storedMetrics) : [
        {
          id_sdr: 'user-sdr-inbound',
          hubspot_owner_id: 'hs_owner_mariana',
          leads_recebidos_hoje: 8,
          reunioes_agendadas: 4,
          reunioes_realizadas: 3,
          updated_at: new Date().toISOString(),
        },
        {
          id_sdr: 'user-sdr-outbound',
          hubspot_owner_id: 'hs_owner_lucas',
          leads_recebidos_hoje: 5,
          reunioes_agendadas: 3,
          reunioes_realizadas: 2,
          updated_at: new Date().toISOString(),
        },
      ];

      const storedSdrTasks = localStorage.getItem(STORAGE_KEYS.SDR_TASKS);
      this.sdrTasks = storedSdrTasks ? JSON.parse(storedSdrTasks) : [
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
          titulo: '⚡ SLA Crítico: Novo Lead Inbound - Camila Duarte (Nexus)',
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
          vencimento: '2026-10-20T17:00:00.000Z',
          status: 'NOT_STARTED',
          id_sdr: 'user-sdr-inbound',
          hubspot_owner_id: 'hs_owner_mariana',
          classificacao: 'Vencida',
          tipo_tarefa: 'CALL',
        },
        {
          id_tarefa: 'task-hs-104',
          titulo: '🎯 Cold Call Outbound: Diretor Operacional (Braslog)',
          vencimento: '2026-10-21T11:00:00.000Z',
          status: 'NOT_STARTED',
          id_sdr: 'user-sdr-outbound',
          hubspot_owner_id: 'hs_owner_lucas',
          classificacao: 'Tarefa do Dia',
          tipo_tarefa: 'CALL',
        },
        {
          id_tarefa: 'task-hs-105',
          titulo: '💼 Social Selling LinkedIn: Envio de InMail para 5 Diretores',
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
          vencimento: '2026-10-22T14:00:00.000Z',
          status: 'NOT_STARTED',
          id_sdr: 'user-sdr-outbound',
          hubspot_owner_id: 'hs_owner_lucas',
          classificacao: 'Futura',
          tipo_tarefa: 'CALL',
        },
      ];

      const storedSdrCalendar = localStorage.getItem(STORAGE_KEYS.SDR_CALENDAR_BLOCKS);
      this.sdrCalendarBlocks = storedSdrCalendar ? JSON.parse(storedSdrCalendar) : [
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
        {
          id_evento: 'ms-cal-outlook-001',
          start_time: '2026-10-21T09:30:00.000Z',
          end_time: '2026-10-21T10:00:00.000Z',
          tipo_bloco: 'reuniao',
          id_sdr: 'user-sdr-inbound',
          provedor: 'microsoft',
          outcome: 'SCHEDULED',
          title: 'Daily Matinal de Operações Welucci',
        },
      ];

      // Ensure João V. Batista is strictly the active Admin
      const adminExists = this.users.find(u => u.id === 'user-admin' || u.email === 'joao.batista@welucci.com');
      if (!adminExists) {
        this.users.unshift({ ...INITIAL_USERS[0] });
      } else {
        const idx = this.users.findIndex(u => u.id === adminExists.id);
        this.users[idx] = {
          ...this.users[idx],
          name: 'João V. Batista',
          email: 'joao.batista@welucci.com',
          role: 'ADMIN',
          title: 'Coordenador de Sales Dev B2B',
          password: 'Jhony21012001*',
        };
      }

      // Ensure Welucci SDR team members are present IF NOT deleted by user
      if (!this.deletedUserIds.includes('user-sdr-inbound') && !this.users.some(u => u.id === 'user-sdr-inbound')) {
        this.users.push({ ...INITIAL_USERS[1] });
      }
      if (!this.deletedUserIds.includes('user-bdr-outbound') && !this.users.some(u => u.id === 'user-bdr-outbound')) {
        this.users.push({ ...INITIAL_USERS[2] });
      }

      // Ensure SDR profiles exist
      for (const prof of INITIAL_PROFILES) {
        if (!this.profiles.some(p => p.userId === prof.userId)) {
          this.profiles.push({ ...prof });
        }
      }

      // Ensure goals exist
      for (const g of INITIAL_GOALS) {
        if (!this.goals.some(item => item.id === g.id)) {
          this.goals.push({ ...g });
        }
      }

      // Ensure Welucci competency tasks are loaded if empty or outdated
      if (this.tasks.length === 0 || !this.tasks.some(t => t.taskType === 'WAITING_QUEUE_LEAD' || t.taskType === 'TOUCH_POINT')) {
        this.tasks = [...INITIAL_TASKS];
      }

      // Ensure calendar events are populated with the official Welucci schedule
      if (this.calendarEvents.length <= 1 || !this.calendarEvents.some(e => e.eventType === 'TEAM_MEETING' || e.eventType === 'WORK_MEETING')) {
        this.calendarEvents = [...INITIAL_CALENDAR_EVENTS];
      }

      this.persist();
    } catch {
      this.resetToDefaults();
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId);
      localStorage.setItem(STORAGE_KEYS.IS_DEMO, String(this.isDemoMode));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(this.profiles));
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(this.goals));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
      localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(this.meetings));
      localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(this.calendarEvents));
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(this.integrations));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(this.alerts));
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
      localStorage.setItem(STORAGE_KEYS.PLANNING_BLOCKS, JSON.stringify(this.planningBlocks));
      localStorage.setItem(STORAGE_KEYS.DELETED_USER_IDS, JSON.stringify(this.deletedUserIds));
      localStorage.setItem(STORAGE_KEYS.CUSTOM_ROUTINES, JSON.stringify(this.customRoutines));
      localStorage.setItem(STORAGE_KEYS.SDR_METRICS, JSON.stringify(this.sdrMetrics));
      localStorage.setItem(STORAGE_KEYS.SDR_TASKS, JSON.stringify(this.sdrTasks));
      localStorage.setItem(STORAGE_KEYS.SDR_CALENDAR_BLOCKS, JSON.stringify(this.sdrCalendarBlocks));
    } catch (e) {
      console.warn('Storage quota or serialization issue:', e);
    }
    this.notify();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // --- Cloud Database (Firestore) Sync Engine ---
  private async initFirestoreSync() {
    try {
      // 1. Realtime listener for Goals collection (Admin set targets & scopes)
      const goalsCol = collection(db, 'goals');
      onSnapshot(goalsCol, (snapshot) => {
        if (!snapshot.empty) {
          const cloudGoals: Goal[] = [];
          snapshot.forEach(docSnap => {
            cloudGoals.push(docSnap.data() as Goal);
          });
          if (cloudGoals.length > 0) {
            this.goals = cloudGoals;
            this.isCloudConnected = true;
            this.lastCloudSync = new Date().toISOString();
            this.persistLocalOnly();
          }
        } else {
          this.seedInitialCloudData();
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'goals');
      });

      // 2. Realtime listener for SDR Profiles
      const profilesCol = collection(db, 'sdr_profiles');
      onSnapshot(profilesCol, (snapshot) => {
        if (!snapshot.empty) {
          const cloudProfiles: SdrProfile[] = [];
          snapshot.forEach(docSnap => {
            cloudProfiles.push(docSnap.data() as SdrProfile);
          });
          if (cloudProfiles.length > 0) {
            this.profiles = cloudProfiles;
            this.isCloudConnected = true;
            this.lastCloudSync = new Date().toISOString();
            this.persistLocalOnly();
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'sdr_profiles');
      });

      // 3. Realtime listener for Tasks
      const tasksCol = collection(db, 'tasks');
      onSnapshot(tasksCol, (snapshot) => {
        if (!snapshot.empty) {
          const cloudTasks: Task[] = [];
          snapshot.forEach(docSnap => {
            cloudTasks.push(docSnap.data() as Task);
          });
          if (cloudTasks.length > 0) {
            this.tasks = cloudTasks;
            this.isCloudConnected = true;
            this.lastCloudSync = new Date().toISOString();
            this.persistLocalOnly();
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'tasks');
      });

      // 4. Realtime listener for Meetings
      const meetingsCol = collection(db, 'meetings');
      onSnapshot(meetingsCol, (snapshot) => {
        if (!snapshot.empty) {
          const cloudMeetings: Meeting[] = [];
          snapshot.forEach(docSnap => {
            cloudMeetings.push(docSnap.data() as Meeting);
          });
          if (cloudMeetings.length > 0) {
            this.meetings = cloudMeetings;
            this.isCloudConnected = true;
            this.lastCloudSync = new Date().toISOString();
            this.persistLocalOnly();
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'meetings');
      });

      // 5. Realtime listener for Notifications
      const notifsCol = collection(db, 'notifications');
      onSnapshot(notifsCol, (snapshot) => {
        if (!snapshot.empty) {
          const cloudNotifs: AppNotification[] = [];
          snapshot.forEach(docSnap => {
            cloudNotifs.push(docSnap.data() as AppNotification);
          });
          if (cloudNotifs.length > 0) {
            this.notifications = cloudNotifs;
            this.isCloudConnected = true;
            this.lastCloudSync = new Date().toISOString();
            this.persistLocalOnly();
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'notifications');
      });

      this.isCloudConnected = true;
      this.lastCloudSync = new Date().toISOString();
    } catch (err) {
      console.warn('Initial Firestore listener setup deferred:', err);
    }
  }

  private persistLocalOnly() {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(this.profiles));
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(this.goals));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
      localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(this.meetings));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
    } catch {
      // quota fallback
    }
    this.notify();
  }

  private async seedInitialCloudData() {
    try {
      for (const goal of this.goals) {
        await setDoc(doc(db, 'goals', goal.id), goal);
      }
      for (const profile of this.profiles) {
        await setDoc(doc(db, 'sdr_profiles', profile.id), profile);
      }
      for (const task of this.tasks.slice(0, 10)) {
        await setDoc(doc(db, 'tasks', task.id), task);
      }
      for (const meeting of this.meetings.slice(0, 10)) {
        await setDoc(doc(db, 'meetings', meeting.id), meeting);
      }
      for (const notif of this.notifications.slice(0, 10)) {
        await setDoc(doc(db, 'notifications', notif.id), notif);
      }
    } catch (e) {
      console.warn('Seeding initial cloud data encountered:', e);
    }
  }

  public getCloudStatus() {
    return {
      isCloudConnected: this.isCloudConnected,
      lastCloudSync: this.lastCloudSync,
      databaseId: firebaseConfig.firestoreDatabaseId || 'default',
      projectId: firebaseConfig.projectId || 'welucci-cloud',
    };
  }

  public resetToDefaults() {
    this.currentUserId = 'user-admin';
    this.isDemoMode = true;
    this.users = [...INITIAL_USERS];
    this.profiles = [...INITIAL_PROFILES];
    this.goals = [...INITIAL_GOALS];
    this.tasks = [...INITIAL_TASKS];
    this.meetings = [...INITIAL_MEETINGS];
    this.calendarEvents = [...INITIAL_CALENDAR_EVENTS];
    this.integrations = [...INITIAL_INTEGRATIONS];
    this.alerts = [...INITIAL_ALERTS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.planningBlocks = {};
    this.persist();
  }

  // --- Auth & Profile Management ---
  public getCurrentUser(): User {
    const user = this.users.find(u => u.id === this.currentUserId);
    return user || this.users[0];
  }

  public setCurrentUser(userId: string) {
    this.currentUserId = userId;
    this.persist();
  }

  public getAllUsers(): User[] {
    return [...this.users];
  }

  public getSdrUsers(): User[] {
    return this.users.filter(u => u.role === 'SDR');
  }

  public getProfiles(): SdrProfile[] {
    return [...this.profiles];
  }

  public updateProfile(profile: SdrProfile) {
    const index = this.profiles.findIndex(p => p.id === profile.id);
    if (index >= 0) {
      this.profiles[index] = profile;
    } else {
      this.profiles.push(profile);
    }
    this.persist();
  }

  // --- Team User Invitation & Management (Admin Requirement) ---
  public async inviteUser(params: {
    name: string;
    email: string;
    title: string;
    scope: SdrScope;
    dailyGoal?: number;
    workdayStart?: string;
    workdayEnd?: string;
  }): Promise<{ user: User; profile: SdrProfile; goal: Goal; inviteUrl: string }> {
    const id = `user-sdr-${Date.now()}`;
    const newUser: User = {
      id,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      role: 'SDR',
      title: params.title || 'SDR Comercial B2B',
      scope: params.scope,
      active: true,
      status: 'PENDING_INVITE',
      invitedAt: new Date().toISOString(),
      hubspotOwnerId: `hs-owner-${Date.now().toString().slice(-4)}`,
      microsoftUserId: `ms-user-${Date.now().toString().slice(-4)}`,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    };

    const newProfile: SdrProfile = {
      id: `prof-${Date.now()}`,
      userId: id,
      workdayStart: params.workdayStart || '09:00',
      workdayEnd: params.workdayEnd || '19:00',
      lunchStart: '12:00',
      lunchDurationMinutes: 60,
      timezone: 'America/Sao_Paulo',
      scope: params.scope,
      active: true,
    };

    const dailyGoal = params.dailyGoal || (params.scope === 'Enterprise / Contas Estratégicas' ? 2 : 4);
    const newGoal: Goal = {
      id: `goal-sdr-${id}`,
      targetId: id,
      targetType: 'SDR',
      scope: params.scope,
      dailyScheduledMeetings: dailyGoal,
      weeklyScheduledMeetings: dailyGoal * 5,
      monthlyScheduledMeetings: dailyGoal * 20,
      expectedAttendanceRatePercent: 75,
      validFrom: '2026-10-01',
      validUntil: '2026-10-31',
      updatedBy: this.getCurrentUser().name,
      updatedAt: new Date().toISOString(),
      notes: `Meta definida por ${this.getCurrentUser().name} no momento do cadastro do membro.`,
    };

    this.users.push(newUser);
    this.profiles.push(newProfile);
    this.goals.push(newGoal);

    // Call server mailer simulation
    let inviteUrl = `https://sdr.welucci.com/auth/definir-senha?email=${encodeURIComponent(params.email)}`;
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: params.name,
          email: params.email,
          title: params.title,
          scope: params.scope,
        })
      });
      const data = await res.json();
      if (data.user?.inviteUrl) {
        inviteUrl = data.user.inviteUrl;
      }
    } catch {
      // offline fallback
    }

    // Add Audit Log
    const actor = this.getCurrentUser();
    this.addAuditLog(
      'CADASTRO_NOVO_USUARIO',
      `Gestor ${actor.name} cadastrou o usuário ${params.name} (${params.email}) com cargo '${params.title}', escopo '${params.scope}' e meta diária de ${dailyGoal} reuniões. Convite de ativação de senha enviado.`
    );

    // Notification
    this.addNotification({
      type: 'GOAL_ALERT',
      title: '👥 Novo Membro Cadastrado na Equipe',
      message: `${params.name} (${params.title}) foi adicionado(a) com escopo ${params.scope}. E-mail de convite enviado.`,
      targetUserId: 'user-admin',
      meta: {
        sdrName: params.name,
        email: params.email,
        scope: params.scope,
        dailyGoal,
      }
    });

    // Cloud sync to Firestore
    setDoc(doc(db, 'sdr_profiles', newProfile.id), newProfile).catch(() => {});
    setDoc(doc(db, 'goals', newGoal.id), newGoal).catch(() => {});

    this.persist();
    return { user: newUser, profile: newProfile, goal: newGoal, inviteUrl };
  }

  public deleteUser(
    userId: string,
    options?: { reassignTasksToId?: string }
  ): { success: boolean; message: string; deletedUser?: User } {
    if (userId === 'user-admin') {
      return { 
        success: false, 
        message: 'O perfil do Administrador principal (João V. Batista) não pode ser excluído.' 
      };
    }

    const removedUser = this.users.find(u => u.id === userId);
    if (!removedUser) {
      return { success: false, message: 'Usuário não encontrado na equipe.' };
    }

    // Register into deletedUserIds tracker
    if (!this.deletedUserIds.includes(userId)) {
      this.deletedUserIds.push(userId);
    }

    // Remove user from active roster
    this.users = this.users.filter(u => u.id !== userId);

    // Remove SDR profile
    const removedProfile = this.profiles.find(p => p.userId === userId);
    this.profiles = this.profiles.filter(p => p.userId !== userId);

    // Remove individual goals
    const removedGoal = this.goals.find(g => g.targetId === userId);
    this.goals = this.goals.filter(g => g.targetId !== userId);

    // Reassign or clean up tasks and meetings
    if (options?.reassignTasksToId) {
      const targetUser = this.users.find(u => u.id === options.reassignTasksToId) || this.users[0];
      this.tasks.forEach(t => {
        if (t.ownerId === userId) {
          t.ownerId = targetUser.id;
          t.lastSyncedAt = new Date().toISOString();
        }
      });
      this.meetings.forEach(m => {
        if (m.ownerId === userId) {
          m.ownerId = targetUser.id;
          m.lastSyncedAt = new Date().toISOString();
        }
      });
    } else {
      this.tasks = this.tasks.filter(t => t.ownerId !== userId);
      this.meetings = this.meetings.filter(m => m.ownerId !== userId);
    }

    // Invalidate cached routine plans so the daily routine recalculates
    this.planningBlocks = {};

    // If current viewed profile was deleted, switch back to Admin
    if (this.currentUserId === userId) {
      this.currentUserId = 'user-admin';
    }

    // Firestore Cloud Deletion
    deleteDoc(doc(db, 'users', userId)).catch(() => {});
    if (removedProfile) {
      deleteDoc(doc(db, 'sdr_profiles', removedProfile.id)).catch(() => {});
    }
    if (removedGoal) {
      deleteDoc(doc(db, 'goals', removedGoal.id)).catch(() => {});
    }

    const actor = this.getCurrentUser();
    this.addAuditLog(
      'REMOCAO_USUARIO',
      `Gestor ${actor.name} excluiu o usuário ${removedUser.name} (${removedUser.email} - ${removedUser.title || 'SDR'}) da equipe comercial.`
    );

    this.addNotification({
      type: 'SYSTEM',
      title: '🗑️ Membro Removido da Equipe',
      message: `${removedUser.name} (${removedUser.title || 'SDR'}) foi removido(a) da operação pelo gestor ${actor.name}.`,
      targetUserId: 'user-admin',
    });

    this.persist();
    return {
      success: true,
      message: `Usuário ${removedUser.name} foi excluído da equipe com sucesso!`,
      deletedUser: removedUser,
    };
  }

  public updateUser(userId: string, partial: Partial<User>): { success: boolean; message: string } {
    const idx = this.users.findIndex(u => u.id === userId);
    if (idx === -1) {
      return { success: false, message: 'Usuário não localizado.' };
    }

    this.users[idx] = { ...this.users[idx], ...partial };

    // Update associated sdr_profile if scope changed
    const pIdx = this.profiles.findIndex(p => p.userId === userId);
    if (pIdx >= 0) {
      if (partial.scope) this.profiles[pIdx].scope = partial.scope;
      setDoc(doc(db, 'sdr_profiles', this.profiles[pIdx].id), this.profiles[pIdx], { merge: true }).catch(() => {});
    }

    const actor = this.getCurrentUser();
    this.addAuditLog(
      'ATUALIZACAO_PERFIL',
      `Usuário ${actor.name} atualizou dados cadastrais do seu perfil.`
    );

    // Sync to Cloud Firestore
    setDoc(doc(db, 'users', userId), this.users[idx], { merge: true }).catch(() => {});
    this.persist();
    return { success: true, message: 'Dados cadastrais atualizados com sucesso!' };
  }

  public updateUserPassword(userId: string, currentPass: string, newPass: string): { success: boolean; message: string } {
    const user = this.users.find(u => u.id === userId);
    if (!user) {
      return { success: false, message: 'Usuário não localizado.' };
    }

    if (user.password && user.password !== currentPass) {
      return { success: false, message: 'A senha atual informada está incorreta.' };
    }

    if (newPass.length < 8) {
      return { success: false, message: 'A nova senha deve ter no mínimo 8 caracteres.' };
    }

    user.password = newPass;
    const actor = this.getCurrentUser();
    this.addAuditLog(
      'ALTERACAO_SENHA',
      `Usuário ${actor.name} alterou sua senha de acesso com sucesso.`
    );

    // Sync to Cloud Firestore
    setDoc(doc(db, 'users', userId), { password: newPass, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    this.persist();
    return { success: true, message: 'Sua senha foi alterada com sucesso!' };
  }

  // --- Goals & Scopes Management (Core Requirement) ---
  public getGoals(): Goal[] {
    return [...this.goals];
  }

  public getTeamGoal(): Goal {
    const teamGoal = this.goals.find(g => g.targetType === 'TEAM');
    return teamGoal || {
      id: 'goal-team',
      targetId: 'TEAM',
      targetType: 'TEAM',
      scope: 'Equipe Geral',
      dailyScheduledMeetings: 14,
      weeklyScheduledMeetings: 70,
      monthlyScheduledMeetings: 280,
      expectedAttendanceRatePercent: 75,
      validFrom: '2026-10-01',
      validUntil: '2026-10-31',
      updatedBy: 'Renan Rocha',
      updatedAt: new Date().toISOString(),
    };
  }

  public getSdrGoal(sdrId: string): Goal | undefined {
    return this.goals.find(g => g.targetId === sdrId && g.targetType === 'SDR');
  }

  public saveTeamAndSdrGoals(
    teamGoalData: Partial<Goal>,
    sdrGoalsList: Array<{
      sdrId: string;
      scope: SdrScope;
      daily: number;
      weekly: number;
      monthly: number;
      expectedAttendanceRatePercent: number;
      validFrom: string;
      validUntil: string;
      notes?: string;
    }>
  ) {
    const actor = this.getCurrentUser();
    const now = new Date().toISOString();

    // 1. Update or Create Team Goal
    const teamIndex = this.goals.findIndex(g => g.targetType === 'TEAM');
    if (teamIndex >= 0) {
      this.goals[teamIndex] = {
        ...this.goals[teamIndex],
        ...teamGoalData,
        updatedBy: actor.name,
        updatedAt: now,
      };
    } else {
      this.goals.push({
        id: `goal-team-${Date.now()}`,
        targetId: 'TEAM',
        targetType: 'TEAM',
        scope: 'Equipe Geral',
        dailyScheduledMeetings: teamGoalData.dailyScheduledMeetings || 14,
        weeklyScheduledMeetings: teamGoalData.weeklyScheduledMeetings || 70,
        monthlyScheduledMeetings: teamGoalData.monthlyScheduledMeetings || 280,
        expectedAttendanceRatePercent: teamGoalData.expectedAttendanceRatePercent || 75,
        validFrom: teamGoalData.validFrom || '2026-10-01',
        validUntil: teamGoalData.validUntil || '2026-10-31',
        updatedBy: actor.name,
        updatedAt: now,
        notes: teamGoalData.notes,
      });
    }

    // 2. Update each SDR's Goal and Scope
    for (const item of sdrGoalsList) {
      // Update scope in user model
      const userIndex = this.users.findIndex(u => u.id === item.sdrId);
      if (userIndex >= 0) {
        this.users[userIndex].scope = item.scope;
      }

      // Update scope in profile
      const profIndex = this.profiles.findIndex(p => p.userId === item.sdrId);
      if (profIndex >= 0) {
        this.profiles[profIndex].scope = item.scope;
      }

      // Update goal
      const gIndex = this.goals.findIndex(g => g.targetId === item.sdrId && g.targetType === 'SDR');
      const updatedGoal: Goal = {
        id: gIndex >= 0 ? this.goals[gIndex].id : `goal-sdr-${item.sdrId}`,
        targetId: item.sdrId,
        targetType: 'SDR',
        scope: item.scope,
        dailyScheduledMeetings: item.daily,
        weeklyScheduledMeetings: item.weekly,
        monthlyScheduledMeetings: item.monthly,
        expectedAttendanceRatePercent: item.expectedAttendanceRatePercent,
        validFrom: item.validFrom,
        validUntil: item.validUntil,
        updatedBy: actor.name,
        updatedAt: now,
        notes: item.notes,
      };

      if (gIndex >= 0) {
        this.goals[gIndex] = updatedGoal;
      } else {
        this.goals.push(updatedGoal);
      }
    }

    // 3. Append Audit Log
    this.addAuditLog(
      'DEFINICAO_METAS_E_ESCOPOS',
      `Gestor ${actor.name} atualizou a meta da equipe (${teamGoalData.dailyScheduledMeetings || 'inalterada'}/dia) e escopos/metas de ${sdrGoalsList.length} SDRs.`
    );

    // 4. Cloud Sync to Firestore
    try {
      const currentTeamGoal = this.getTeamGoal();
      setDoc(doc(db, 'goals', currentTeamGoal.id), currentTeamGoal).catch(err => {
        console.warn('Firestore team goal write:', err);
      });
      for (const g of this.goals.filter(item => item.targetType === 'SDR')) {
        setDoc(doc(db, 'goals', g.id), g).catch(() => {});
      }
      for (const p of this.profiles) {
        setDoc(doc(db, 'sdr_profiles', p.id), p).catch(() => {});
      }
    } catch {
      // offline fallback
    }

    this.persist();
  }

  // --- Tasks ---
  public getTasks(filter?: { ownerId?: string; status?: string }): Task[] {
    let result = [...this.tasks];
    if (filter?.ownerId) {
      result = result.filter(t => t.ownerId === filter.ownerId);
    }
    if (filter?.status) {
      result = result.filter(t => t.status === filter.status);
    }
    return result;
  }

  public completeTask(taskId: string, actualMinutes?: number) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index >= 0) {
      this.tasks[index].status = 'COMPLETED';
      if (actualMinutes) {
        this.tasks[index].actualDurationMinutes = actualMinutes;
      }
      this.tasks[index].lastSyncedAt = new Date().toISOString();
      
      const actor = this.getCurrentUser();
      this.addAuditLog('CONCLUSAO_TAREFA_HUBSPOT', `SDR ${actor.name} completou a tarefa '${this.tasks[index].title}' vinculada ao HubSpot ID ${this.tasks[index].externalHubspotId}.`);
      
      // Cloud sync
      setDoc(doc(db, 'tasks', taskId), this.tasks[index]).catch(() => {});
      this.persist();
    }
  }

  public addTask(task: Omit<Task, 'id' | 'lastSyncedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: `tsk-${Date.now()}`,
      lastSyncedAt: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    
    // Cloud sync
    setDoc(doc(db, 'tasks', newTask.id), newTask).catch(() => {});
    this.persist();
    return newTask;
  }

  // --- Meetings ---
  public getMeetings(filter?: { ownerId?: string; date?: string }): Meeting[] {
    let result = [...this.meetings];
    if (filter?.ownerId) {
      result = result.filter(m => m.ownerId === filter.ownerId);
    }
    if (filter?.date) {
      result = result.filter(m => m.scheduledAt.startsWith(filter.date!));
    }
    return result;
  }

  public addMeeting(meeting: Omit<Meeting, 'id' | 'lastSyncedAt'>): Meeting {
    const newMeeting: Meeting = {
      ...meeting,
      id: `mtg-${Date.now()}`,
      lastSyncedAt: new Date().toISOString(),
    };
    this.meetings.push(newMeeting);
    
    // Cloud sync
    setDoc(doc(db, 'meetings', newMeeting.id), newMeeting).catch(() => {});
    
    // Add audit log
    const actor = this.getCurrentUser();
    this.addAuditLog('NOVO_AGENDAMENTO_D0', `Nova reunião agendada por ${actor.name} com ${meeting.contactName} (${meeting.companyName}). Contabilizada para D0.`);
    this.persist();
    return newMeeting;
  }

  public updateMeetingStatus(meetingId: string, status: Meeting['status'], notes?: string) {
    const index = this.meetings.findIndex(m => m.id === meetingId);
    if (index >= 0) {
      this.meetings[index].status = status;
      if (notes) {
        this.meetings[index].notes = notes;
      }
      this.meetings[index].lastSyncedAt = new Date().toISOString();
      this.persist();
    }
  }

  // --- Calendar Events ---
  public getCalendarEvents(userId?: string): CalendarEvent[] {
    if (!userId) return [...this.calendarEvents];
    return this.calendarEvents.filter(ev => ev.userId === 'ALL' || ev.userId === userId);
  }

  public addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'lastSyncedAt'>): CalendarEvent {
    const newEvent: CalendarEvent = {
      ...event,
      id: `cal-evt-${Date.now()}`,
      lastSyncedAt: new Date().toISOString(),
    };
    this.calendarEvents.push(newEvent);

    // Invalidate cached daily plans so routines auto-adjust immediately
    this.planningBlocks = {};

    // Audit log
    const actor = this.getCurrentUser();
    this.addAuditLog(
      'SINCRONIZACAO_AGENDA_TEAMS',
      `Novo compromisso '${newEvent.title}' (${newEvent.startsAt} - ${newEvent.endsAt}) adicionado à agenda. O motor de rotinas realizou auto-ajuste adaptativo dos blocos operacionais.`
    );

    // Alert notification
    this.addNotification({
      type: 'SYSTEM',
      title: '🔄 Agenda Atualizada — Rotina Auto-Ajustada!',
      message: `Compromisso '${newEvent.title}' inserido. O motor adaptou automaticamente os blocos operacionais livres do expediente.`,
      targetUserId: 'ALL',
    });

    this.persist();
    return newEvent;
  }

  public removeCalendarEvent(eventId: string) {
    const target = this.calendarEvents.find(e => e.id === eventId);
    if (target) {
      this.calendarEvents = this.calendarEvents.filter(e => e.id !== eventId);
      this.planningBlocks = {};
      this.addAuditLog('REMOCAO_COMPROMISSO_AGENDA', `Compromisso '${target.title}' removido da agenda. Rotina auto-recalculada.`);
      this.persist();
    }
  }

  // --- Custom Operational Routine Management ---
  public getCustomRoutine(targetKey: string, dayName?: string): RoutineBlockBlueprint[] | null {
    if (dayName) {
      const specific = this.customRoutines[`${targetKey}_${dayName}`];
      if (specific) return JSON.parse(JSON.stringify(specific));
    }
    const general = this.customRoutines[targetKey];
    return general ? JSON.parse(JSON.stringify(general)) : null;
  }

  public saveCustomRoutine(targetKey: string, blocks: RoutineBlockBlueprint[], dayName?: string): void {
    const key = dayName ? `${targetKey}_${dayName}` : targetKey;
    this.customRoutines[key] = JSON.parse(JSON.stringify(blocks));
    // Clear planning block cache so schedules recalculate immediately
    this.planningBlocks = {};

    const actor = this.getCurrentUser();
    const dayLabel = dayName ? ` (${dayName})` : '';
    this.addAuditLog(
      'EDICAO_ROTINA_OPERACIONAL',
      `Gestor ${actor.name} editou e salvou a grade personalizada de blocos operacionais para '${targetKey}'${dayLabel}.`
    );

    this.addNotification({
      type: 'SYSTEM',
      title: '📋 Rotina Operacional Atualizada!',
      message: `A rotina de atividades para '${targetKey}'${dayLabel} foi redefinida e aplicada aos cronogramas da equipe.`,
      targetUserId: 'ALL',
    });

    this.persist();
  }

  public saveWeeklyCustomRoutine(targetKey: string, weeklyBlocks: Record<string, RoutineBlockBlueprint[]>): void {
    for (const [dayName, dayBlocks] of Object.entries(weeklyBlocks)) {
      const key = `${targetKey}_${dayName}`;
      this.customRoutines[key] = JSON.parse(JSON.stringify(dayBlocks));
    }
    this.planningBlocks = {};

    const actor = this.getCurrentUser();
    this.addAuditLog(
      'EDICAO_ROTINA_SEMANAL',
      `Gestor ${actor.name} salvou a grade semanal completa (Segunda a Sexta) para '${targetKey}'.`
    );

    this.addNotification({
      type: 'SYSTEM',
      title: '📅 Grade Semanal Atualizada!',
      message: `A grade operacional semanal completa de '${targetKey}' foi redefinida e sincronizada.`,
      targetUserId: 'ALL',
    });

    this.persist();
  }

  public resetCustomRoutine(targetKey: string, dayName?: string): void {
    const keysToDelete: string[] = [];
    if (dayName) {
      keysToDelete.push(`${targetKey}_${dayName}`);
    } else {
      keysToDelete.push(targetKey);
      const days = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
      for (const d of days) {
        keysToDelete.push(`${targetKey}_${d}`);
      }
    }

    let changed = false;
    for (const k of keysToDelete) {
      if (this.customRoutines[k]) {
        delete this.customRoutines[k];
        changed = true;
      }
    }

    if (changed) {
      this.planningBlocks = {};
      const actor = this.getCurrentUser();
      const label = dayName ? ` para ${dayName}` : ' (completa)';
      this.addAuditLog(
        'RESET_ROTINA_OPERACIONAL',
        `Gestor ${actor.name} restaurou a grade padrão original da Welucci para '${targetKey}'${label}.`
      );
      this.persist();
    }
  }

  public getRoutineBlocksForEditing(
    targetKey: string, 
    dateStr: string = '2026-10-21', 
    scope: SdrScope = 'Inbound Qualificação'
  ): RoutineBlockBlueprint[] {
    const weekday = getWeekdayInfo(dateStr);
    const daySpecific = this.getCustomRoutine(targetKey, weekday.dayName);
    if (daySpecific && daySpecific.length > 0) {
      return daySpecific;
    }

    const custom = this.getCustomRoutine(targetKey);
    if (custom && custom.length > 0) {
      return custom;
    }

    const isOutbound = scope === 'Outbound Prospecção';
    return getIdealDayBlueprints(weekday.dayName, weekday.isBiweeklyFriday, isOutbound ? 'OUTBOUND' : 'INBOUND');
  }

  // --- Daily Planning Engine ---
  public getDailyPlan(
    userId: string, 
    date: string = '2026-10-21', 
    options?: { scope?: SdrScope; forceBiweeklyFriday?: boolean }
  ): PlanningBlock[] {
    // If admin is viewing, and has no direct SDR tasks, inspect representative SDR or designated user
    let targetId = userId;
    if (userId === 'user-admin') {
      const sdrList = this.getSdrUsers();
      if (sdrList.length > 0) {
        targetId = sdrList[0].id;
      }
    }

    const key = `${targetId}_${date}_${options?.scope || 'DEF'}_${options?.forceBiweeklyFriday ?? 'DEF'}`;
    if (!this.planningBlocks[key]) {
      const targetUser = this.users.find(u => u.id === targetId);
      const userScope = options?.scope || targetUser?.scope || 'Inbound Qualificação';
      const userTasks = this.tasks.filter(t => t.ownerId === targetId);
      const userEvents = this.getCalendarEvents(targetId);
      const weekday = getWeekdayInfo(date);

      // Hierarchical custom blueprints lookup:
      // 1. Specific SDR on this day of week
      // 2. Specific SDR general
      // 3. Scope on this day of week
      // 4. Scope general
      const customBlueprints = 
        this.customRoutines[`${targetId}_${weekday.dayName}`] ||
        this.customRoutines[targetId] ||
        this.customRoutines[`${userScope}_${weekday.dayName}`] ||
        this.customRoutines[userScope];

      this.planningBlocks[key] = generateDailyPlan(
        targetId, 
        date, 
        userTasks, 
        userEvents, 
        { 
          scope: userScope, 
          forceBiweeklyFriday: options?.forceBiweeklyFriday,
          customBlueprints 
        }
      );
      this.persist();
    }
    return this.planningBlocks[key];
  }

  public regenerateDailyPlan(
    userId: string, 
    date: string = '2026-10-21', 
    options?: { scope?: SdrScope; forceBiweeklyFriday?: boolean }
  ): PlanningBlock[] {
    let targetId = userId;
    if (userId === 'user-admin') {
      const sdrList = this.getSdrUsers();
      if (sdrList.length > 0) {
        targetId = sdrList[0].id;
      }
    }

    const key = `${targetId}_${date}_${options?.scope || 'DEF'}_${options?.forceBiweeklyFriday ?? 'DEF'}`;
    const targetUser = this.users.find(u => u.id === targetId);
    const userScope = options?.scope || targetUser?.scope || 'Inbound Qualificação';
    const userTasks = this.tasks.filter(t => t.ownerId === targetId);
    const userEvents = this.getCalendarEvents(targetId);
    const weekday = getWeekdayInfo(date);

    const customBlueprints = 
      this.customRoutines[`${targetId}_${weekday.dayName}`] ||
      this.customRoutines[targetId] ||
      this.customRoutines[`${userScope}_${weekday.dayName}`] ||
      this.customRoutines[userScope];

    this.planningBlocks[key] = generateDailyPlan(
      targetId, 
      date, 
      userTasks, 
      userEvents, 
      { 
        scope: userScope, 
        forceBiweeklyFriday: options?.forceBiweeklyFriday,
        customBlueprints 
      }
    );
    this.persist();
    return this.planningBlocks[key];
  }

  // --- Integrations & Diagnostics ---
  public getIntegrations(): IntegrationStatus[] {
    return [...this.integrations];
  }

  public updateIntegration(provider: IntegrationStatus['provider'], updates: Partial<IntegrationStatus>) {
    const index = this.integrations.findIndex(i => i.provider === provider);
    if (index >= 0) {
      this.integrations[index] = { ...this.integrations[index], ...updates };
      this.persist();
    }
  }

  public toggleDemoMode(enabled?: boolean) {
    this.isDemoMode = enabled !== undefined ? enabled : !this.isDemoMode;
    this.integrations.forEach(i => i.isDemoMode = this.isDemoMode);
    this.persist();
  }

  public getIsDemoMode(): boolean {
    return this.isDemoMode;
  }

  // --- Alerts & Audit ---
  public getAlerts(): OperationalAlert[] {
    return [...this.alerts];
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public addAuditLog(action: string, details: string) {
    const user = this.getCurrentUser();
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    // Cloud sync
    setDoc(doc(db, 'audit_logs', newLog.id), newLog).catch(() => {});
  }

  // --- KPI Calculation Engines ---
  public getSdrKpiSummary(sdrId: string, referenceDate: string = '2026-10-21'): SdrKpiSummary {
    const sdr = this.users.find(u => u.id === sdrId) || this.users[0];
    const sdrGoal = this.getSdrGoal(sdrId);
    const dailyGoal = sdrGoal?.dailyScheduledMeetings || 4;

    const sdrTasks = this.tasks.filter(t => t.ownerId === sdrId);
    const pendingTasks = sdrTasks.filter(t => t.status !== 'COMPLETED');
    const overdueTasks = pendingTasks.filter(t => t.dueAt < `${referenceDate}T00:00:00`);
    const todayTasks = pendingTasks.filter(t => t.dueAt.startsWith(referenceDate));

    const sdrEvents = this.getCalendarEvents(sdrId);
    const availableCapacity = calculateAvailableCapacityMinutes(sdrEvents);
    const workloadMinutes = calculateWorkloadMinutes(pendingTasks);
    const { percent: capacityUtilPercent, status: capStatus } = calculateCapacityUtilization(workloadMinutes, availableCapacity);

    // Meetings
    const sdrMeetings = this.meetings.filter(m => m.ownerId === sdrId);
    const scheduled = sdrMeetings.filter(m => m.status === 'SCHEDULED').length;
    const held = sdrMeetings.filter(m => m.status === 'HELD').length;
    const cancelled = sdrMeetings.filter(m => m.status === 'CANCELLED').length;
    const noShow = sdrMeetings.filter(m => m.status === 'NO_SHOW').length;
    const attendanceRate = calculateAttendanceRate(held, noShow, cancelled);

    // Booked TODAY (D0): meetings created on referenceDate
    const bookedToday = sdrMeetings.filter(m => m.bookedAt === referenceDate).length;
    const gapD0 = calculateGapD0(dailyGoal, bookedToday);
    const attainment = calculateAttainment(bookedToday, dailyGoal);
    const paceRequired = calculatePaceRequired(gapD0, 10, 19);

    const hasSlaRisk = pendingTasks.some(t => t.priority === 'CRITICAL_SLA' || t.dueAt < `${referenceDate}T00:00:00`);

    let statusLabel = 'Operação Equilibrada';
    if (capStatus === 'SOBRECARGA' || hasSlaRisk) {
      statusLabel = 'Atenção / Risco de SLA';
    } else if (gapD0 > 2) {
      statusLabel = 'Necessita Aceleração de Agendamentos';
    } else if (gapD0 === 0) {
      statusLabel = 'Meta Diária Atingida';
    }

    return {
      sdrId,
      sdrName: sdr.name,
      scope: sdr.scope || 'Prospecção Geral',
      pendingTasksCount: pendingTasks.length,
      overdueTasksCount: overdueTasks.length,
      todayTasksCount: todayTasks.length,
      workloadMinutes,
      availableCapacityMinutes: availableCapacity,
      capacityUtilizationPercent: capacityUtilPercent,
      capacityStatus: capStatus,
      scheduledMeetingsCount: scheduled,
      heldMeetingsCount: held,
      cancelledMeetingsCount: cancelled,
      noShowMeetingsCount: noShow,
      attendanceRatePercent: attendanceRate,
      dailyGoal,
      bookedTodayCount: bookedToday,
      gapD0,
      attainmentPercent: attainment,
      paceRequiredPerHour: paceRequired,
      hasSlaRisk,
      statusLabel,
    };
  }

  public getTeamKpiSummary(referenceDate: string = '2026-10-21'): TeamKpiSummary {
    const sdrUsers = this.getSdrUsers();
    const summaries = sdrUsers.map(u => this.getSdrKpiSummary(u.id, referenceDate));
    const teamGoal = this.getTeamGoal();

    const totalPending = summaries.reduce((acc, s) => acc + s.pendingTasksCount, 0);
    const totalOverdue = summaries.reduce((acc, s) => acc + s.overdueTasksCount, 0);
    const totalToday = summaries.reduce((acc, s) => acc + s.todayTasksCount, 0);
    const totalWorkload = summaries.reduce((acc, s) => acc + s.workloadMinutes, 0);
    const totalCapacity = summaries.reduce((acc, s) => acc + s.availableCapacityMinutes, 0);
    const avgUtil = totalCapacity > 0 ? Math.round((totalWorkload / totalCapacity) * 100) : 0;

    const totalScheduled = summaries.reduce((acc, s) => acc + s.scheduledMeetingsCount, 0);
    const totalHeld = summaries.reduce((acc, s) => acc + s.heldMeetingsCount, 0);
    const totalNoShow = summaries.reduce((acc, s) => acc + s.noShowMeetingsCount, 0);
    const totalCancelled = summaries.reduce((acc, s) => acc + s.cancelledMeetingsCount, 0);
    const totalAttendanceRate = calculateAttendanceRate(totalHeld, totalNoShow, totalCancelled);

    const teamDailyGoal = teamGoal.dailyScheduledMeetings || 14;
    const teamBookedToday = summaries.reduce((acc, s) => acc + s.bookedTodayCount, 0);
    // Team GAP D0 = Sum of individual gaps as defined in spec
    const teamGapD0 = summaries.reduce((acc, s) => acc + s.gapD0, 0);
    const teamAttainment = calculateAttainment(teamBookedToday, teamDailyGoal);

    const sdrsAtRisk = summaries.filter(s => s.capacityStatus === 'SOBRECARGA' || s.hasSlaRisk).length;

    return {
      activeSdrsCount: sdrUsers.length,
      totalPendingTasks: totalPending,
      totalOverdueTasks: totalOverdue,
      totalTodayTasks: totalToday,
      totalWorkloadMinutes: totalWorkload,
      totalCapacityMinutes: totalCapacity,
      averageCapacityUtilization: avgUtil,
      totalScheduledMeetings: totalScheduled,
      totalHeldMeetings: totalHeld,
      totalAttendanceRatePercent: totalAttendanceRate,
      teamDailyGoal,
      teamBookedToday,
      teamGapD0,
      teamAttainmentPercent: teamAttainment,
      sdrsAtOperationalRiskCount: sdrsAtRisk,
    };
  }

  // --- Notification System & Pipeline Inflow Triggers ---
  public getNotifications(userId?: string): AppNotification[] {
    if (!userId) return [...this.notifications];
    return this.notifications.filter(n => n.targetUserId === 'ALL' || n.targetUserId === userId);
  }

  public getUnreadNotificationCount(userId?: string): number {
    return this.getNotifications(userId).filter(n => !n.read).length;
  }

  public markNotificationAsRead(id: string) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index >= 0) {
      this.notifications[index].read = true;
      this.persist();
    }
  }

  public markAllNotificationsAsRead(userId?: string) {
    this.notifications.forEach(n => {
      if (!userId || n.targetUserId === 'ALL' || n.targetUserId === userId) {
        n.read = true;
      }
    });
    this.persist();
  }

  public addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.notifications.unshift(newNotif);
    
    // Cloud sync
    setDoc(doc(db, 'notifications', newNotif.id), newNotif).catch(() => {});
    
    this.persist();
    return newNotif;
  }

  /**
   * Pipeline Inflow Trigger 1: Chegou lead novo no funil do inbound!
   */
  public triggerNewInboundLead(data?: { contactName?: string; companyName?: string; phone?: string; dealValue?: number }) {
    const contactName = data?.contactName || 'Marcelo Prado';
    const companyName = data?.companyName || 'Prado & Associados Inteligência';
    const phone = data?.phone || '+55 11 99122-3344';
    const dealValue = data?.dealValue || 85000;

    // Find Inbound SDR (Mariana Costa or fallback)
    const inboundSdr = this.users.find(u => u.scope === 'Inbound Qualificação') || this.users[1];

    // 1. Add Task in HubSpot Pipeline with Critical SLA (< 15 min)
    const newTask = this.addTask({
      externalHubspotId: `HS-INB-${Date.now().toString().slice(-4)}`,
      ownerId: inboundSdr.id,
      title: `⚡ NOVO LEAD INBOUND: ${contactName} (${companyName}) - SLA 15 min`,
      taskType: 'NEW_LEAD',
      status: 'PENDING',
      priority: 'CRITICAL_SLA',
      dueAt: '2026-10-21T10:30:00',
      estimatedDurationMinutes: 10,
      associatedContactId: `ct-inb-${Date.now().toString().slice(-3)}`,
      contactName,
      contactPhone: phone,
      companyName,
      dealValue,
      requiresCall: true,
      hubspotUrl: 'https://app.hubspot.com/contacts/welucci',
    });

    // 2. Dispatch Notification to Inbound SDR & Management
    this.addNotification({
      type: 'NEW_INBOUND_LEAD',
      title: '⚡ Novo Lead Chegou no Funil Inbound!',
      message: `${contactName} (${companyName}) enviou formulário de interesse no site. SLA de primeiro atendimento: 15 minutos!`,
      targetUserId: inboundSdr.id,
      meta: {
        contactName,
        companyName,
        priority: 'CRITICAL_SLA',
        slaMinutes: 15,
      },
    });

    // 3. Re-calculate daily plan for Inbound SDR to insert urgent block
    this.regenerateDailyPlan(inboundSdr.id);

    // 4. Audit Log
    this.addAuditLog(
      'ENTRADA_LEAD_INBOUND',
      `Webhook HubSpot: Novo lead inbound '${contactName}' alocado para ${inboundSdr.name} com SLA crítico.`
    );

    return newTask;
  }

  /**
   * Pipeline Inflow Trigger 2: Gestor subiu lista nova no funil do outbound!
   */
  public triggerNewOutboundList(params: {
    listName: string;
    leadsCount: number;
    targetSdrId: string;
    segment: string;
    priority?: Task['priority'];
  }) {
    const actor = this.getCurrentUser();
    const targetSdr = this.users.find(u => u.id === params.targetSdrId) || this.users[1];

    // 1. Add Touch Point tasks to target SDR
    const sampleCompanies = [
      'Transportes Braslog', 'Vanguardia Metalúrgica', 'RodoSul Cargas', 
      'Atlas Agroindústria', 'Apex Distribuição'
    ];

    for (let i = 0; i < Math.min(params.leadsCount, 3); i++) {
      const comp = sampleCompanies[i % sampleCompanies.length];
      this.addTask({
        externalHubspotId: `HS-OUT-${Date.now().toString().slice(-4)}-${i}`,
        ownerId: targetSdr.id,
        title: `Touch Point 1 (Lista ${params.listName}): Cold Call Diretoria`,
        taskType: 'TOUCH_POINT',
        status: 'PENDING',
        priority: params.priority || 'HIGH',
        dueAt: '2026-10-21T11:00:00',
        estimatedDurationMinutes: 12,
        associatedContactId: `ct-out-${Date.now().toString().slice(-3)}-${i}`,
        contactName: `Diretor Comercial (${comp})`,
        contactPhone: '+55 11 97600-1122',
        companyName: comp,
        dealValue: 60000,
        requiresCall: true,
        hubspotUrl: 'https://app.hubspot.com/contacts/welucci',
      });
    }

    // 2. Dispatch Notification to Outbound SDR
    this.addNotification({
      type: 'NEW_OUTBOUND_LIST',
      title: '📂 Nova Lista de Outbound Carregada pela Gestão',
      message: `O gestor ${actor.name} subiu a lista "${params.listName}" com ${params.leadsCount} contas do segmento ${params.segment} para sua cadência.`,
      targetUserId: targetSdr.id,
      meta: {
        listName: params.listName,
        leadsCount: params.leadsCount,
        priority: params.priority || 'HIGH',
      },
    });

    // 3. Re-calculate daily plan for Outbound SDR
    this.regenerateDailyPlan(targetSdr.id);

    // 4. Audit Log
    this.addAuditLog(
      'CARGA_LISTA_OUTBOUND',
      `Gestor ${actor.name} carregou a lista outbound '${params.listName}' (${params.leadsCount} contatos) para o SDR ${targetSdr.name}.`
    );
  }

  // --- HubSpot Native Integration Mirror Table Methods ---
  public getSdrMetrics(): SdrMetric[] {
    return [...this.sdrMetrics];
  }

  public getSdrMetric(id_sdr: string): SdrMetric | undefined {
    return this.sdrMetrics.find(m => m.id_sdr === id_sdr || m.hubspot_owner_id === id_sdr);
  }

  public updateSdrMetric(id_sdr: string, partial: Partial<SdrMetric>): void {
    const idx = this.sdrMetrics.findIndex(m => m.id_sdr === id_sdr || m.hubspot_owner_id === id_sdr);
    if (idx >= 0) {
      this.sdrMetrics[idx] = {
        ...this.sdrMetrics[idx],
        ...partial,
        updated_at: new Date().toISOString(),
      };
      this.persist();
    }
  }

  public incrementLeadsReceived(id_sdrOrOwnerId: string): void {
    const metric = this.sdrMetrics.find(m => m.id_sdr === id_sdrOrOwnerId || m.hubspot_owner_id === id_sdrOrOwnerId);
    if (metric) {
      metric.leads_recebidos_hoje += 1;
      metric.updated_at = new Date().toISOString();
      this.persist();
    }
  }

  public getSdrTasks(id_sdr?: string): SdrTaskItem[] {
    if (!id_sdr) return [...this.sdrTasks];
    return this.sdrTasks.filter(t => t.id_sdr === id_sdr || t.hubspot_owner_id === id_sdr);
  }

  public getSdrTasksByClassification(classification: 'Vencida' | 'Tarefa do Dia' | 'Futura', id_sdr?: string): SdrTaskItem[] {
    const tasks = this.getSdrTasks(id_sdr);
    return tasks.filter(t => t.classificacao === classification);
  }

  public getSdrCalendarBlocks(id_sdr?: string): SdrCalendarBlock[] {
    if (!id_sdr) return [...this.sdrCalendarBlocks];
    return this.sdrCalendarBlocks.filter(b => b.id_sdr === id_sdr || b.hubspot_owner_id === id_sdr);
  }

  public setHubspotMirrorData(data: { metrics?: SdrMetric[]; tasks?: SdrTaskItem[]; calendarBlocks?: SdrCalendarBlock[] }): void {
    if (data.metrics && data.metrics.length > 0) {
      this.sdrMetrics = [...data.metrics];
    }
    if (data.tasks && data.tasks.length > 0) {
      this.sdrTasks = [...data.tasks];
    }
    if (data.calendarBlocks && data.calendarBlocks.length > 0) {
      this.sdrCalendarBlocks = [...data.calendarBlocks];
    }
    this.persist();
  }

  public async fetchHubspotDataFromServer(): Promise<void> {
    try {
      const res = await fetch('/api/integrations/hubspot/data');
      if (res.ok) {
        const json = await res.json();
        this.setHubspotMirrorData(json);
      }
    } catch (err) {
      console.warn('[Store] Could not sync HubSpot data from server:', err);
    }
  }

  // --- Export CSV ---
  public exportTeamDataToCsv(): string {
    const sdrUsers = this.getSdrUsers();
    const headers = [
      'SDR', 'Escopo', 'Meta Diária', 'Agendados Hoje (D0)', 'GAP D0', 
      'Atingimento (%)', 'Tarefas Pendentes', 'Tarefas Atrasadas', 
      'Carga (min)', 'Capacidade (min)', 'Utilização (%)', 'Status'
    ];

    const rows = sdrUsers.map(user => {
      const kpi = this.getSdrKpiSummary(user.id);
      return [
        `"${user.name}"`,
        `"${user.scope || 'Geral'}"`,
        kpi.dailyGoal,
        kpi.bookedTodayCount,
        kpi.gapD0,
        `${kpi.attainmentPercent}%`,
        kpi.pendingTasksCount,
        kpi.overdueTasksCount,
        kpi.workloadMinutes,
        kpi.availableCapacityMinutes,
        `${kpi.capacityUtilizationPercent}%`,
        `"${kpi.statusLabel}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

export const store = new StoreService();
