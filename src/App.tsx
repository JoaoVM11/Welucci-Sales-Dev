import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AdminOverview } from './views/admin/AdminOverview';
import { GoalsManagement } from './views/admin/GoalsManagement';
import { TeamProductivity } from './views/admin/TeamProductivity';
import { MeetingsAnalysis } from './views/admin/MeetingsAnalysis';
import { OperationalPlanning } from './views/admin/OperationalPlanning';
import { ReportsView } from './views/admin/ReportsView';
import { IntegrationsView } from './views/admin/IntegrationsView';
import { HubspotIntegrationView } from './views/admin/HubspotIntegrationView';
import { SettingsView } from './views/admin/SettingsView';
import { TeamManagementView } from './views/admin/TeamManagementView';
import { GeminiCopilotDrawer } from './components/ai/GeminiCopilotDrawer';
import { SdrDashboard } from './views/sdr/SdrDashboard';
import { SdrRoutine } from './views/sdr/SdrRoutine';
import { SdrTasks } from './views/sdr/SdrTasks';
import { SdrMeetings } from './views/sdr/SdrMeetings';
import { SdrGoals } from './views/sdr/SdrGoals';
import { SdrHistory } from './views/sdr/SdrHistory';
import { SdrDetailModal } from './components/modals/SdrDetailModal';
import { store } from './services/store';

export default function App() {
  const [, setTick] = useState<number>(0);
  const [currentView, setCurrentView] = useState<string>('admin-overview');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Hoje');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [drilldownSdrId, setDrilldownSdrId] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  // Subscribe to reactive store changes
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => unsubscribe();
  }, []);

  const currentUser = store.getCurrentUser();
  const allUsers = store.getAllUsers();
  const isDemoMode = store.getIsDemoMode();

  // Handle switching user
  const handleSwitchUser = (userId: string) => {
    store.setCurrentUser(userId);
    const target = allUsers.find((u) => u.id === userId);
    if (target?.role === 'ADMIN') {
      if (!currentView.startsWith('admin-')) {
        setCurrentView('admin-overview');
      }
    } else {
      if (!currentView.startsWith('sdr-')) {
        setCurrentView('sdr-dashboard');
      }
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/integrations/hubspot/sync', { method: 'POST' });
      await fetch('/api/integrations/microsoft/sync', { method: 'POST' });
    } catch {
      // Local fallback
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleCompleteTask = (taskId: string) => {
    store.completeTask(taskId);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafb] font-sans text-[#14262d]">
      {/* Fixed Desktop Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => store.toggleDemoMode()}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          currentView={currentView}
          currentUser={currentUser}
          onNavigateToRoutine={() => setCurrentView('sdr-routine')}
          onNavigateToTasks={() => setCurrentView('sdr-tasks')}
          onManualSync={handleManualSync}
          isSyncing={isSyncing}
          selectedPeriod={selectedPeriod}
          onSelectPeriod={setSelectedPeriod}
          onOpenCopilot={() => setIsCopilotOpen(true)}
        />

        {/* Scrollable View Canvas */}
        <main className="flex-1 overflow-y-auto">
          {/* Admin Views */}
          {currentView === 'admin-overview' && (
            <AdminOverview
              onSelectSdr={(sdrId) => setDrilldownSdrId(sdrId)}
              onNavigateToGoals={() => setCurrentView('admin-goals')}
              onOpenCopilot={() => setIsCopilotOpen(true)}
            />
          )}

          {currentView === 'admin-goals' && <GoalsManagement />}

          {currentView === 'admin-users' && <TeamManagementView />}

          {currentView === 'admin-team' && (
            <AdminOverview
              onSelectSdr={(sdrId) => setDrilldownSdrId(sdrId)}
              onNavigateToGoals={() => setCurrentView('admin-goals')}
              onOpenCopilot={() => setIsCopilotOpen(true)}
            />
          )}

          {currentView === 'admin-productivity' && <TeamProductivity />}

          {currentView === 'admin-meetings' && <MeetingsAnalysis />}

          {currentView === 'admin-planning' && <OperationalPlanning />}

          {currentView === 'admin-reports' && <ReportsView />}

          {currentView === 'admin-integrations' && (
            <IntegrationsView onNavigateToHubspot={() => setCurrentView('admin-hubspot')} />
          )}

          {currentView === 'admin-hubspot' && <HubspotIntegrationView />}

          {currentView === 'admin-settings' && <SettingsView />}

          {/* SDR Views */}
          {currentView === 'sdr-dashboard' && (
            <SdrDashboard
              currentUser={currentUser}
              onNavigateToRoutine={() => setCurrentView('sdr-routine')}
              onNavigateToTasks={() => setCurrentView('sdr-tasks')}
              onNavigateToMeetings={() => setCurrentView('sdr-meetings')}
              onCompleteTask={handleCompleteTask}
            />
          )}

          {currentView === 'sdr-routine' && (
            <SdrRoutine
              currentUser={currentUser}
              onCompleteTask={handleCompleteTask}
            />
          )}

          {currentView === 'sdr-tasks' && (
            <SdrTasks
              currentUser={currentUser}
              onCompleteTask={handleCompleteTask}
            />
          )}

          {currentView === 'sdr-meetings' && (
            <SdrMeetings
              currentUser={currentUser}
            />
          )}

          {currentView === 'sdr-goals' && <SdrGoals currentUser={currentUser} />}

          {currentView === 'sdr-history' && <SdrHistory currentUser={currentUser} />}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <SdrDetailModal
        sdrId={drilldownSdrId}
        onClose={() => setDrilldownSdrId(null)}
        onSwitchToSdr={handleSwitchUser}
      />

      {/* Gemini AI Manager Copilot Drawer */}
      <GeminiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onNavigateToView={setCurrentView}
      />
    </div>
  );
}
