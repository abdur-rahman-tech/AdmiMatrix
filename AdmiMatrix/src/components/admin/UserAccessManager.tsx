import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  UserCheck,
  UserX,
  KeyRound,
  Mail,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Edit,
  Trash2
} from 'lucide-react';
import { AdminUser, AccessRequest, UserRole, AuditLog } from '../../types';

interface UserAccessManagerProps {
  adminUsers: AdminUser[];
  setAdminUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  accessRequests: AccessRequest[];
  setAccessRequests: React.Dispatch<React.SetStateAction<AccessRequest[]>>;
  currentSessionUser: AdminUser;
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  onUpdateUserPin: (email: string, newPin: string) => void;
}

export const UserAccessManager: React.FC<UserAccessManagerProps> = ({
  adminUsers,
  setAdminUsers,
  accessRequests,
  setAccessRequests,
  currentSessionUser,
  setAuditLogs,
  onUpdateUserPin
}) => {
  const isOwner = currentSessionUser.isOwner;

  // Direct Grant State
  const [grantName, setGrantName] = useState('');
  const [grantEmail, setGrantEmail] = useState('');
  const [grantDepartment, setGrantDepartment] = useState('');
  const [grantRole, setGrantRole] = useState<UserRole>('ADMIN');
  const [grantPin, setGrantPin] = useState('4520');
  const [grantMsg, setGrantMsg] = useState<string | null>(null);

  // Approval Modal State
  const [approvingReq, setApprovingReq] = useState<AccessRequest | null>(null);
  const [approvalRole, setApprovalRole] = useState<UserRole>('ADMIN');
  const [approvalPin, setApprovalPin] = useState('1234');
  const [approvalSuccessMsg, setApprovalSuccessMsg] = useState<string | null>(null);

  // Change PIN modal
  const [pinChangeUser, setPinChangeUser] = useState<AdminUser | null>(null);
  const [newPinVal, setNewPinVal] = useState('');

  // Master PIN change
  const [ownerNewPin, setOwnerNewPin] = useState('');
  const [ownerPinMsg, setOwnerPinMsg] = useState<string | null>(null);

  // Generate random 4-digit PIN
  const handleGeneratePin = (setter: (val: string) => void) => {
    const p = Math.floor(1000 + Math.random() * 9000).toString();
    setter(p);
  };

  // 1. APPROVE ACCESS REQUEST
  const handleConfirmApproval = () => {
    if (!approvingReq) return;

    const newAdminUser: AdminUser = {
      id: `user-${Date.now()}`,
      email: approvingReq.email.toLowerCase(),
      name: approvingReq.name,
      role: approvalRole,
      pin: approvalPin,
      isOwner: false,
      isApproved: true,
      department: approvingReq.department || 'University of Chitral',
      createdAt: new Date().toISOString(),
      lastLoginAt: undefined
    };

    // Add or update in adminUsers
    setAdminUsers(prev => {
      const filtered = prev.filter(u => u.email.toLowerCase() !== approvingReq.email.toLowerCase());
      return [...filtered, newAdminUser];
    });

    // Update AccessRequest status to APPROVED
    setAccessRequests(prev =>
      prev.map(r =>
        r.id === approvingReq.id
          ? {
              ...r,
              status: 'APPROVED',
              reviewedAt: new Date().toISOString(),
              reviewedBy: currentSessionUser.name
            }
          : r
      )
    );

    // Audit Log
    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentSessionUser.name,
      role: currentSessionUser.role,
      action: 'APPROVE_ACCESSOR',
      targetEntity: approvingReq.email,
      details: `Owner approved ${approvingReq.name} (${approvingReq.email}) as ${approvalRole} with PIN ${approvalPin}.`
    };
    setAuditLogs(prev => [audit, ...prev]);

    setApprovalSuccessMsg(
      `Access Approved! ${approvingReq.name} (${approvingReq.email}) has been authorized as ${approvalRole} with Security PIN Code: ${approvalPin}. They can now unlock the Admin Panel using PIN ${approvalPin}.`
    );
    setApprovingReq(null);
  };

  // 2. REJECT ACCESS REQUEST
  const handleRejectRequest = (req: AccessRequest) => {
    setAccessRequests(prev =>
      prev.map(r =>
        r.id === req.id
          ? {
              ...r,
              status: 'REJECTED',
              reviewedAt: new Date().toISOString(),
              reviewedBy: currentSessionUser.name
            }
          : r
      )
    );

    setApprovalSuccessMsg(`Access request for ${req.name} (${req.email}) was rejected.`);

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentSessionUser.name,
      role: currentSessionUser.role,
      action: 'REJECT_ACCESSOR',
      targetEntity: req.email,
      details: `Owner rejected access request for ${req.name} (${req.email}).`
    };
    setAuditLogs(prev => [audit, ...prev]);
  };

  // 3. DIRECTLY GRANT ACCESS TO USER
  const handleDirectGrant = (e: React.FormEvent) => {
    e.preventDefault();
    setGrantMsg(null);

    const email = grantEmail.trim().toLowerCase();
    if (!email || !grantName.trim() || !grantPin.trim()) return;

    const newUser: AdminUser = {
      id: `user-${Date.now()}`,
      email,
      name: grantName.trim(),
      role: grantRole,
      pin: grantPin.trim(),
      isOwner: false,
      isApproved: true,
      department: grantDepartment.trim() || 'University of Chitral',
      createdAt: new Date().toISOString()
    };

    setAdminUsers(prev => {
      const filtered = prev.filter(u => u.email.toLowerCase() !== email);
      return [...filtered, newUser];
    });

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentSessionUser.name,
      role: currentSessionUser.role,
      action: 'GRANT_ACCESS_DIRECT',
      targetEntity: email,
      details: `Owner granted ${grantRole} privileges to ${newUser.name} with PIN ${grantPin}.`
    };
    setAuditLogs(prev => [audit, ...prev]);

    setGrantMsg(`Access granted successfully! ${newUser.name} can now sign in using PIN ${grantPin} or Gmail ${email}.`);
    setGrantName('');
    setGrantEmail('');
    setGrantDepartment('');
    handleGeneratePin(setGrantPin);
  };

  // 4. REVOKE USER ACCESS
  const handleRevokeUser = (user: AdminUser) => {
    if (user.isOwner) return;

    setAdminUsers(prev => prev.filter(u => u.id !== user.id));

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentSessionUser.name,
      role: currentSessionUser.role,
      action: 'REVOKE_ACCESSOR',
      targetEntity: user.email,
      details: `Owner revoked admin credentials for ${user.name} (${user.email}).`
    };
    setAuditLogs(prev => [audit, ...prev]);
  };

  // 5. UPDATE USER PIN
  const handleSaveUserPin = () => {
    if (!pinChangeUser || !newPinVal.trim()) return;

    onUpdateUserPin(pinChangeUser.email, newPinVal.trim());

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentSessionUser.name,
      role: currentSessionUser.role,
      action: 'RESET_USER_PIN',
      targetEntity: pinChangeUser.email,
      details: `Owner updated security PIN key for ${pinChangeUser.name}.`
    };
    setAuditLogs(prev => [audit, ...prev]);

    setPinChangeUser(null);
    setNewPinVal('');
  };

  // 6. UPDATE OWNER MASTER PIN
  const handleUpdateOwnerPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerNewPin.length < 4) {
      setOwnerPinMsg('PIN must be at least 4 digits.');
      return;
    }

    onUpdateUserPin(currentSessionUser.email, ownerNewPin);

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentSessionUser.name,
      role: currentSessionUser.role,
      action: 'UPDATE_OWNER_MASTER_PIN',
      targetEntity: currentSessionUser.email,
      details: `Owner successfully updated master security PIN.`
    };
    setAuditLogs(prev => [audit, ...prev]);

    setOwnerPinMsg('Owner Master PIN updated successfully.');
    setOwnerNewPin('');
  };

  const pendingRequests = accessRequests.filter(r => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* OWNER AUTHORITY BANNER */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-900 rounded-xl p-5 text-white border border-purple-800/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/30">
            <ShieldCheck className="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">
                Institutional Access &amp; Authority Governance
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Owner Sole Authority
              </span>
            </div>
            <p className="text-xs text-purple-200/80 mt-1 max-w-xl">
              As the platform Owner, you possess sole authority to grant administrative access, review and approve new accessor applications, issue PIN keys, and revoke system privileges.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-purple-300">Current Authenticated Owner</span>
          <p className="text-sm font-bold text-white font-mono">{currentSessionUser.name}</p>
          <span className="text-[11px] text-purple-200/70">{currentSessionUser.email}</span>
        </div>
      </div>

      {/* APPROVAL / REJECTION SUCCESS ALERT */}
      {approvalSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{approvalSuccessMsg}</p>
          </div>
          <button
            onClick={() => setApprovalSuccessMsg(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-bold text-xs cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* PENDING APPROVAL QUEUE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Pending Accessor Approval Queue
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              {pendingRequests.length} Pending
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Requires Owner verification
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/70 mb-2" />
            No pending access requests at this time. All submissions have been reviewed.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingRequests.map(req => (
              <div
                key={req.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {req.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {req.department || 'University of Chitral'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      Requested: {req.requestedRole}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                    <Mail className="w-3 h-3" />
                    <span>{req.email}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{new Date(req.requestedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-0.5">
                    "{req.reason}"
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      setApprovingReq(req);
                      setApprovalRole(req.requestedRole);
                      handleGeneratePin(setApprovalPin);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Access</span>
                  </button>

                  <button
                    onClick={() => handleRejectRequest(req)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition flex items-center space-x-1 border border-rose-200 dark:border-rose-900 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TWO COLUMNS: DIRECT GRANT & OWNER MASTER PIN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DIRECT GRANT TO OTHER USERS (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Directly Grant Access &amp; Issue PIN Key
            </h4>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Provision access directly to faculty, department chairs, or analysts. The generated PIN key and authorized Gmail will be active immediately.
          </p>

          <form onSubmit={handleDirectGrant} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sultan Ahmad"
                  value={grantName}
                  onChange={e => setGrantName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Google Gmail Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sultanchitral@gmail.com"
                  value={grantEmail}
                  onChange={e => setGrantEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Role Authority
                </label>
                <select
                  value={grantRole}
                  onChange={e => setGrantRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="ADMIN">Co-Administrator</option>
                  <option value="ANALYST">Data Analyst</option>
                  <option value="VIEWER">Auditor / Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Security PIN Key *
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={grantPin}
                    onChange={e => setGrantPin(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleGeneratePin(setGrantPin)}
                    className="absolute right-2 text-slate-400 hover:text-purple-600 cursor-pointer"
                    title="Generate new PIN"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Planning Cell"
                  value={grantDepartment}
                  onChange={e => setGrantDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {grantMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300">
                {grantMsg}
              </div>
            )}

            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Grant Access &amp; Issue PIN Key</span>
            </button>
          </form>
        </div>

        {/* OWNER MASTER PIN SETTINGS (1 col) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <KeyRound className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Owner Master PIN Key
              </h4>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Change the Owner Master PIN used to unlock the dashboard.
            </p>

            <form onSubmit={handleUpdateOwnerPin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Current PIN: <code className="font-mono text-purple-600 dark:text-purple-400 font-bold">{currentSessionUser.pin}</code>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new 4-6 digit master PIN"
                  value={ownerNewPin}
                  onChange={e => setOwnerNewPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {ownerPinMsg && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{ownerPinMsg}</p>
              )}

              <button
                type="submit"
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Update Master PIN</span>
              </button>
            </form>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Owner recovery address: <strong className="text-slate-700 dark:text-slate-300">{currentSessionUser.email}</strong>
          </div>
        </div>
      </div>

      {/* ACTIVE AUTHORIZED USERS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Authorized Institutional Accessors ({adminUsers.length})
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            Active credentials authorized by Owner
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Accessor Name</th>
                <th className="py-3 px-4">Google Gmail</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">PIN Key</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-right">Owner Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {adminUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <span>{user.name}</span>
                      {user.isOwner && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          PLATFORM OWNER
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {user.email}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      user.role === 'OWNER'
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                        : user.role === 'ADMIN'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-purple-700 dark:text-purple-400">
                    {user.pin}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {user.department || 'University of Chitral'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {user.isOwner ? (
                      <span className="text-[11px] text-slate-400 font-medium italic">Immutable Owner</span>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setPinChangeUser(user);
                            setNewPinVal('');
                          }}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold cursor-pointer"
                          title="Change user PIN"
                        >
                          Change PIN
                        </button>

                        <button
                          onClick={() => handleRevokeUser(user)}
                          className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-400 text-[11px] font-semibold cursor-pointer"
                          title="Revoke access"
                        >
                          Revoke
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPROVAL CONFIRMATION MODAL */}
      {approvingReq && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Approve Accessor Application
                </h3>
                <p className="text-xs text-slate-500">
                  Authorize {approvingReq.name} ({approvingReq.email})
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Assigned Authority Role
                </label>
                <select
                  value={approvalRole}
                  onChange={e => setApprovalRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="ADMIN">Co-Administrator (Full CRUD &amp; Data)</option>
                  <option value="ANALYST">Data Analyst (Analytics &amp; Ingestion)</option>
                  <option value="VIEWER">Auditor / Viewer (Read-only)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Issued Security PIN Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={approvalPin}
                    onChange={e => setApprovalPin(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleGeneratePin(setApprovalPin)}
                    className="absolute right-2 text-slate-400 hover:text-purple-600"
                    title="Generate new PIN"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setApprovingReq(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Confirm Approval &amp; Issue Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PIN MODAL */}
      {pinChangeUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Change PIN for {pinChangeUser.name}
            </h3>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                New PIN Key (Current: {pinChangeUser.pin})
              </label>
              <input
                type="text"
                placeholder="Enter new 4-6 digit PIN"
                value={newPinVal}
                onChange={e => setNewPinVal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setPinChangeUser(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUserPin}
                className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold cursor-pointer"
              >
                Save PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
