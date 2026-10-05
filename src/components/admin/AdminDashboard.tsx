import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  FileCheck,
  ShieldCheck,
  Database,
  History,
  FileText,
  Users,
  Lock,
  LogOut,
  KeyRound,
  ShieldAlert,
  SlidersHorizontal,
  GraduationCap
} from 'lucide-react';
import {
  AdmissionRecord,
  PopulationRecord,
  DataSource,
  ValidationError,
  AuditLog,
  UserRole,
  AdminUser,
  AccessRequest
} from '../../types';
import { AdminAccessGate } from './AdminAccessGate';
import { PopulationCRUD } from './PopulationCRUD';
import { AdmissionsCRUD } from './AdmissionsCRUD';
import { UserAccessManager } from './UserAccessManager';

interface AdminDashboardProps {
  populationData: PopulationRecord[];
  setPopulationData: React.Dispatch<React.SetStateAction<PopulationRecord[]>>;
  admissionsData: AdmissionRecord[];
  setAdmissionsData: React.Dispatch<React.SetStateAction<AdmissionRecord[]>>;
  dataSources: DataSource[];
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  userRole: UserRole;
  onResetDemo: () => void;
  adminUsers: AdminUser[];
  setAdminUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  accessRequests: AccessRequest[];
  setAccessRequests: React.Dispatch<React.SetStateAction<AccessRequest[]>>;
  currentSessionUser: AdminUser | null;
  setCurrentSessionUser: (user: AdminUser | null) => void;
  onUpdateUserPin: (email: string, newPin: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  populationData,
  setPopulationData,
  admissionsData,
  setAdmissionsData,
  dataSources,
  auditLogs,
  setAuditLogs,
  userRole,
  onResetDemo,
  adminUsers,
  setAdminUsers,
  accessRequests,
  setAccessRequests,
  currentSessionUser,
  setCurrentSessionUser,
  onUpdateUserPin
}) => {
  // If not logged in, show Owner Security Gate
  if (!currentSessionUser) {
    return (
      <div id="admin-dashboard-container" className="py-2">
        <AdminAccessGate
          adminUsers={adminUsers}
          onLoginSuccess={user => {
            setCurrentSessionUser(user);
            const newAudit: AuditLog = {
              id: `audit-${Date.now()}`,
              timestamp: new Date().toISOString(),
              user: user.name,
              role: user.role,
              action: 'ADMIN_LOGIN_SUCCESS',
              targetEntity: 'admin_panel',
              details: `Authorized login for ${user.email} (${user.isOwner ? 'Platform Owner' : 'Approved Accessor'}).`
            };
            setAuditLogs(prev => [newAudit, ...prev]);
          }}
          accessRequests={accessRequests}
          onSubmitAccessRequest={req => {
            const newReq: AccessRequest = {
              id: `req-${Date.now()}`,
              ...req,
              requestedAt: new Date().toISOString(),
              status: 'PENDING'
            };
            setAccessRequests(prev => [newReq, ...prev]);

            const audit: AuditLog = {
              id: `audit-${Date.now()}`,
              timestamp: new Date().toISOString(),
              user: req.name,
              role: 'VIEWER',
              action: 'ACCESS_REQUEST_SUBMITTED',
              targetEntity: req.email,
              details: `Submitted access request for role ${req.requestedRole}.`
            };
            setAuditLogs(prev => [audit, ...prev]);
          }}
          onUpdateUserPin={onUpdateUserPin}
        />
      </div>
    );
  }

  // Authenticated Dashboard Navigation Tabs
  const [activeMainTab, setActiveMainTab] = useState<'POPULATION' | 'ADMISSIONS' | 'GOVERNANCE' | 'AUDIT'>('POPULATION');

  const pendingCount = accessRequests.filter(r => r.status === 'PENDING').length;

  return (
    <div id="admin-dashboard-container" className="space-y-6">
      {/* AUTHENTICATED OWNER SESSION HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 ring-2 ring-cyan-500/60 shrink-0 shadow-xs flex items-center justify-center">
            <img
              src="/logo.jpg"
              alt="Official Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.jpg';
              }}
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Institutional Data &amp; Governance Center
              </h2>
              {currentSessionUser.isOwner ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  PLATFORM OWNER
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {currentSessionUser.role}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              The Heartbeat of University of Chitral • Governing Chitral Demographics &amp; Academic Ingestion
            </p>
          </div>
        </div>

        {/* User Session Info & Lock Button */}
        <div className="flex items-center space-x-3 self-end md:self-center">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 dark:text-white">{currentSessionUser.name}</p>
            <p className="text-[11px] text-slate-500 font-mono">{currentSessionUser.email}</p>
          </div>

          <button
            onClick={() => {
              const audit: AuditLog = {
                id: `audit-${Date.now()}`,
                timestamp: new Date().toISOString(),
                user: currentSessionUser.name,
                role: currentSessionUser.role,
                action: 'ADMIN_LOGOUT',
                targetEntity: 'admin_panel',
                details: 'User logged out and locked admin session.'
              };
              setAuditLogs(prev => [audit, ...prev]);
              setCurrentSessionUser(null);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs active:scale-95 flex items-center space-x-1.5 cursor-pointer"
            title="Lock admin session"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock &amp; Sign Out</span>
          </button>
        </div>
      </div>

      {/* PENDING APPROVAL NOTIFICATION BANNER */}
      {pendingCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Action Required: {pendingCount} Pending Access Request{pendingCount > 1 ? 's' : ''}
              </h4>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90">
                Team member(s) have requested admin access. Review their submissions and approve them with an assigned PIN code.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveMainTab('GOVERNANCE')}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            Review &amp; Approve Now
          </button>
        </div>
      )}

      {/* TOP NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4 text-xs font-semibold overflow-x-auto pb-1">
        {/* Tab 1: Chitral Population CRUD */}
        <button
          id="tab-btn-population-crud"
          onClick={() => setActiveMainTab('POPULATION')}
          className={`pb-2.5 px-3 flex items-center space-x-2 transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 border-b-2 whitespace-nowrap cursor-pointer rounded-t-lg ${
            activeMainTab === 'POPULATION'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold bg-purple-50/50 dark:bg-purple-950/20'
              : 'border-transparent text-slate-500 hover:text-purple-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Chitral Population CRUD</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeMainTab === 'POPULATION'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
          }`}>
            {populationData.length}
          </span>
        </button>

        {/* Tab 2: Admissions Ingestion & CRUD */}
        <button
          onClick={() => setActiveMainTab('ADMISSIONS')}
          className={`pb-2.5 px-2 flex items-center space-x-2 transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 border-b-2 whitespace-nowrap cursor-pointer ${
            activeMainTab === 'ADMISSIONS'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-purple-600 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Admissions Records CRUD</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
            {admissionsData.length}
          </span>
        </button>

        {/* Tab 3: Access Governance (Owner Authority) */}
        <button
          onClick={() => setActiveMainTab('GOVERNANCE')}
          className={`pb-2.5 px-2 flex items-center space-x-2 transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 border-b-2 whitespace-nowrap cursor-pointer ${
            activeMainTab === 'GOVERNANCE'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-purple-600 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Access Governance (Owner Authority)</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>

        {/* Tab 4: Audit & Provenance */}
        <button
          onClick={() => setActiveMainTab('AUDIT')}
          className={`pb-2.5 px-2 flex items-center space-x-2 transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 border-b-2 whitespace-nowrap cursor-pointer ${
            activeMainTab === 'AUDIT'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-purple-600 dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: CHITRAL POPULATION MASTER CRUD */}
      {activeMainTab === 'POPULATION' && (
        <PopulationCRUD
          populationData={populationData}
          setPopulationData={setPopulationData}
          dataSources={dataSources}
          setAuditLogs={setAuditLogs}
          userRole={currentSessionUser.role}
          currentUserName={currentSessionUser.name}
        />
      )}

      {/* TAB CONTENT 2: ADMISSIONS RECORDS MASTER CRUD */}
      {activeMainTab === 'ADMISSIONS' && (
        <AdmissionsCRUD
          admissionsData={admissionsData}
          setAdmissionsData={setAdmissionsData}
          dataSources={dataSources}
          setAuditLogs={setAuditLogs}
          userRole={currentSessionUser.role}
          currentUserName={currentSessionUser.name}
        />
      )}

      {/* TAB CONTENT 3: ACCESS GOVERNANCE (OWNER SOLE AUTHORITY) */}
      {activeMainTab === 'GOVERNANCE' && (
        <UserAccessManager
          adminUsers={adminUsers}
          setAdminUsers={setAdminUsers}
          accessRequests={accessRequests}
          setAccessRequests={setAccessRequests}
          currentSessionUser={currentSessionUser}
          setAuditLogs={setAuditLogs}
          onUpdateUserPin={onUpdateUserPin}
        />
      )}

      {/* TAB CONTENT 4: AUDIT LOGS & PROVENANCE REGISTRY */}
      {activeMainTab === 'AUDIT' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Immutable Governance Audit Trail
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">{auditLogs.length} Events Logged</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {auditLogs.map(log => (
                <div key={log.id} className="p-3.5 text-xs flex items-start justify-between space-x-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        [{log.action}]
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        {log.role}
                      </span>
                      <span className="text-slate-500 font-mono">{log.user}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{log.details}</p>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Target: {log.targetEntity}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Data Sources Provenance Registry */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Data Sources Provenance Registry ({dataSources.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dataSources.map(source => (
                <div key={source.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                        {source.status}
                      </span>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {source.sourceName}
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        {source.organization} • Pub Year: {source.publicationYear}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {source.methodologyNotes}
                  </p>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Ref: <span className="text-purple-600 dark:text-purple-400">{source.sourceUrl}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
