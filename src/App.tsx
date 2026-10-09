import React, { useState, useMemo, useEffect } from 'react';
import {
  INITIAL_POPULATION_DATA,
  INITIAL_ADMISSION_DATA,
  INITIAL_DATA_SOURCES
} from './data/defaultDatasets';
import {
  PopulationRecord,
  AdmissionRecord,
  DataSource,
  AuditLog,
  UserRole,
  VerificationStatus,
  AdminUser,
  AccessRequest
} from './types';
import { generateForecast } from './lib/ml/forecastingEngine';

// Components
import { Navbar } from './components/layout/Navbar';
import { DashboardOverview } from './components/overview/DashboardOverview';
import { PopulationAnalytics } from './components/analytics/PopulationAnalytics';
import { AdmissionAnalytics } from './components/analytics/AdmissionAnalytics';
import { HistoricalTrends } from './components/analytics/HistoricalTrends';
import { ForecastingControlRoom } from './components/forecast/ForecastingControlRoom';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DocumentationModal } from './components/docs/DocumentationModal';
import { AskTheData } from './components/query/AskTheData';
import { ApiKeyModal } from './components/ai/ApiKeyModal';
import skylerOfficialLogo from './assets';
import { Heart, GraduationCap, ExternalLink } from 'lucide-react';

const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: 'user-owner-001',
    email: 'abdurrahman17180@gmail.com',
    name: 'Abdur Rahman',
    role: 'OWNER',
    pin: '',
    isOwner: true,
    isApproved: true,
    department: 'Directorate of Institutional Planning & Census Affairs',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const DEFAULT_ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: 'req-001',
    name: 'Dr. Karim Shah',
    email: 'karim.shah@uoch.edu.pk',
    requestedRole: 'ADMIN',
    department: 'Department of Computer Science',
    reason: 'Need to ingest Fall 2026 CS applicant batches and calibrate projection algorithms.',
    requestedAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'PENDING'
  },
  {
    id: 'req-002',
    name: 'Shazia Parveen',
    email: 'shazia.parveen@hed.kp.gov.pk',
    requestedRole: 'ANALYST',
    department: 'Khyber Pakhtunkhwa Higher Education Dept',
    reason: 'Reviewing Chitral Valley gender parity metrics for provincial census synthesis report.',
    requestedAt: new Date(Date.now() - 172800000).toISOString(),
    status: 'PENDING'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [userRole, setUserRole] = useState<UserRole>('VIEWER');
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  // Admin users and Access Requests with local storage persistence
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    try {
      const saved = localStorage.getItem('uochpulse_admin_users_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(user => ({ ...user, pin: '' }));
      }
      localStorage.removeItem('uochpulse_admin_users');
      return DEFAULT_ADMIN_USERS;
    } catch {
      return DEFAULT_ADMIN_USERS;
    }
  });

  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(() => {
    try {
      const saved = localStorage.getItem('uochpulse_access_requests');
      return saved ? JSON.parse(saved) : DEFAULT_ACCESS_REQUESTS;
    } catch {
      return DEFAULT_ACCESS_REQUESTS;
    }
  });

  // Admin session user - defaults to null to strictly restrict Admin Panel
  const [currentSessionUser, setCurrentSessionUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/session')
      .then(async response => {
        if (!response.ok) throw new Error(`Admin session check failed (${response.status}).`);
        const result = await response.json();
        const user = result.user;
        const validAdmin = user?.role === 'OWNER' && user.isApproved === true &&
          typeof user.email === 'string';
        if (!cancelled) setCurrentSessionUser(validAdmin ? user : null);
      })
      .catch(error => {
        console.error('Could not verify the administrator session:', error);
        if (!cancelled) setCurrentSessionUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Dark mode state - defaulting to false (Light Mode)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('uochpulse_dark_mode_preference');
      return saved === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.removeItem('admi_groq_api_key');
      localStorage.removeItem('admi_groq_preferred_model');
    } catch (error) {
      console.warn('Could not clear obsolete AI provider settings:', error);
    }
  }, []);

  // Sync darkMode with document root
  useEffect(() => {
    try {
      localStorage.setItem('uochpulse_dark_mode_preference', darkMode ? 'dark' : 'light');
      localStorage.removeItem('uochpulse_dark_mode');
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  }, [darkMode]);

  // Keep userRole strictly in sync with session
  useEffect(() => {
    if (currentSessionUser) {
      setUserRole(currentSessionUser.role);
    } else {
      setUserRole('VIEWER');
    }
  }, [currentSessionUser]);

  // Sync users, requests, and session
  useEffect(() => {
    try {
      localStorage.setItem(
        'uochpulse_admin_users_v2',
        JSON.stringify(adminUsers.map(user => ({ ...user, pin: '' })))
      );
    } catch {}
  }, [adminUsers]);

  useEffect(() => {
    try {
      localStorage.setItem('uochpulse_access_requests', JSON.stringify(accessRequests));
    } catch {}
  }, [accessRequests]);

  // Update a user's PIN
  const handleUpdateUserPin = (email: string, newPin: string) => {
    setAdminUsers(prev =>
      prev.map(u => (u.email.toLowerCase() === email.toLowerCase() ? { ...u, pin: newPin } : u))
    );
    if (currentSessionUser && currentSessionUser.email.toLowerCase() === email.toLowerCase()) {
      setCurrentSessionUser(prev => (prev ? { ...prev, pin: newPin } : null));
    }
  };

  // Persistence in local storage for interactive testing
  const [populationData, setPopulationData] = useState<PopulationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('uochpulse_pop_data');
      return saved ? JSON.parse(saved) : INITIAL_POPULATION_DATA;
    } catch {
      return INITIAL_POPULATION_DATA;
    }
  });

  const [admissionsData, setAdmissionsData] = useState<AdmissionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('uochpulse_adm_data_v3');
      if (saved) return JSON.parse(saved);
      // Clean legacy synthetic storage to ensure official updated data loads
      localStorage.removeItem('uochpulse_adm_data');
      localStorage.removeItem('uochpulse_adm_data_v2');
      return INITIAL_ADMISSION_DATA;
    } catch {
      return INITIAL_ADMISSION_DATA;
    }
  });

  const [dataSources] = useState<DataSource[]>(INITIAL_DATA_SOURCES);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => [
    {
      id: 'audit-init-0',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: 'system@admimatrix.org',
      role: 'ADMIN',
      action: 'SYSTEM_BOOTSTRAP',
      targetEntity: 'system',
      details: 'Initialized AdmiMatrix platform with 1998-2023 Census and official 2017-2026 UOCH admissions.'
    }
  ]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('uochpulse_pop_data', JSON.stringify(populationData));
    } catch {}
  }, [populationData]);

  useEffect(() => {
    try {
      localStorage.setItem('uochpulse_adm_data_v3', JSON.stringify(admissionsData));
    } catch {}
  }, [admissionsData]);

  // Determine active verification status (if all records are verified or synthetic)
  const activeDatasetStatus: VerificationStatus = useMemo(() => {
    const hasSynthetic = admissionsData.some(r => r.status === 'SYNTHETIC');
    return hasSynthetic ? 'SYNTHETIC' : 'VERIFIED';
  }, [admissionsData]);

  // Precompute default forecast for global overview
  const defaultForecast = useMemo(() => {
    return generateForecast(admissionsData, 5, 'AUTO', 'BASELINE', 3000, populationData);
  }, [admissionsData, populationData]);
  const isAdminSession = Boolean(
    currentSessionUser?.isApproved &&
    (currentSessionUser.role === 'OWNER' || currentSessionUser.role === 'ADMIN')
  );

  useEffect(() => {
    if (activeTab === 'admin' && !isAdminSession) {
      setActiveTab('overview');
    } else if (activeTab === 'admin-login' && isAdminSession) {
      setActiveTab('admin');
    }
  }, [activeTab, isAdminSession]);

  const handleResetDemo = () => {
    setPopulationData(INITIAL_POPULATION_DATA);
    setAdmissionsData(INITIAL_ADMISSION_DATA);
    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'admin@uoch.edu.pk',
        role: userRole,
        action: 'RESET_DEMO_DATASET',
        targetEntity: 'all_datasets',
        details: 'Restored initial calibrated synthetic demonstration profile.'
      },
      ...prev
    ]);
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      } flex flex-col font-sans antialiased selection:bg-purple-600 selection:text-white transition-colors`}
    >
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        setUserRole={setUserRole}
        datasetStatus={activeDatasetStatus}
        onResetDemo={handleResetDemo}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        currentSessionUser={currentSessionUser}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <DashboardOverview
            populationData={populationData}
            admissionsData={admissionsData}
            forecastResult={defaultForecast}
            onNavigate={setActiveTab}
            auditLogs={auditLogs}
            userRole={userRole}
          />
        )}

        {activeTab === 'population' && (
          <PopulationAnalytics
            populationData={populationData}
            dataSources={dataSources}
          />
        )}

        {activeTab === 'admissions' && (
          <AdmissionAnalytics
            admissionsData={admissionsData}
            dataSources={dataSources}
            onNavigateToAdmin={isAdminSession ? () => setActiveTab('admin') : undefined}
          />
        )}

        {activeTab === 'trends' && (
          <HistoricalTrends
            populationData={populationData}
            admissionsData={admissionsData}
          />
        )}

        {activeTab === 'forecast' && (
          <ForecastingControlRoom
            admissionsData={admissionsData}
            populationData={populationData}
          />
        )}

        {activeTab === 'ai-assistant' && (
          <AskTheData
            admissionsData={admissionsData}
            populationData={populationData}
            forecastResult={defaultForecast}
          />
        )}

        {(activeTab === 'admin' && isAdminSession || activeTab === 'admin-login' && !isAdminSession) && (
          <AdminDashboard
            populationData={populationData}
            setPopulationData={setPopulationData}
            admissionsData={admissionsData}
            setAdmissionsData={setAdmissionsData}
            dataSources={dataSources}
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
            userRole={userRole}
            onResetDemo={handleResetDemo}
            adminUsers={adminUsers}
            setAdminUsers={setAdminUsers}
            accessRequests={accessRequests}
            setAccessRequests={setAccessRequests}
            currentSessionUser={currentSessionUser}
            setCurrentSessionUser={setCurrentSessionUser}
            onUpdateUserPin={handleUpdateUserPin}
            onLoginSuccess={() => setActiveTab('admin')}
            forecastResult={defaultForecast}
          />
        )}
      </main>

      {/* Documentation & Methodology Modal */}
      <DocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />

      {/* AI Key Configuration Modal */}
      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} />

      {/* Platform Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 ring-2 ring-purple-500/40 group-hover:ring-purple-400 shrink-0 flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 group-hover:-translate-y-0.5 shadow-sm group-hover:shadow-purple-500/25">
              <img
                src={skylerOfficialLogo}
                alt="AdmiMatrix Official Logo"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                AdmiMatrix — University of Chitral Analytics Platform
              </p>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                Demographic &amp; Admissions Analytics Matrix
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <button
              onClick={() => setIsDocsOpen(true)}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition"
            >
              Methodology &amp; Mathematical Constraints
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('admin')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition"
            >
              Data Ingestion
            </button>
            <span>•</span>
            <span className="text-slate-400">
              Chitral, KP, Pakistan
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
