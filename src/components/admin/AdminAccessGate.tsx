import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Mail,
  Shield,
  ShieldAlert,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  UserCheck,
  RefreshCw,
  Eye,
  EyeOff,
  UserPlus,
  Delete,
  Sparkles
} from 'lucide-react';
import { AdminUser, AccessRequest, UserRole } from '../../types';

interface AdminAccessGateProps {
  adminUsers: AdminUser[];
  onLoginSuccess: (user: AdminUser) => void;
  accessRequests: AccessRequest[];
  onSubmitAccessRequest: (request: Omit<AccessRequest, 'id' | 'requestedAt' | 'status'>) => void;
  onUpdateUserPin: (email: string, newPin: string) => void;
}

export const AdminAccessGate: React.FC<AdminAccessGateProps> = ({
  adminUsers,
  onLoginSuccess,
  accessRequests,
  onSubmitAccessRequest,
  onUpdateUserPin
}) => {
  const [activeMode, setActiveMode] = useState<'PIN' | 'GMAIL' | 'REQUEST' | 'FORGOT'>('PIN');

  // PIN Form State
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Gmail Login State
  const [gmailInput, setGmailInput] = useState('');
  const [gmailPinInput, setGmailPinInput] = useState('');
  const [gmailError, setGmailError] = useState<string | null>(null);

  // Access Request Form State
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqDepartment, setReqDepartment] = useState('');
  const [reqRole, setReqRole] = useState<UserRole>('ADMIN');
  const [reqReason, setReqReason] = useState('');
  const [reqSuccess, setReqSuccess] = useState(false);
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState('');

  // Forgot PIN State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'ENTER_EMAIL' | 'VERIFY_CODE' | 'RESET_PIN'>('ENTER_EMAIL');
  const [simulatedCode, setSimulatedCode] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Find owner for display
  const ownerUser = adminUsers.find(u => u.isOwner) || adminUsers[0];

  // Quick PIN submit
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    const trimmedPin = pinInput.trim();
    if (!trimmedPin) {
      setPinError('Please enter your 4-digit security PIN code.');
      return;
    }

    const matchedUser = adminUsers.find(u => u.pin === trimmedPin && u.isApproved);
    if (matchedUser) {
      onLoginSuccess(matchedUser);
    } else {
      setPinError('Access Denied: Incorrect PIN code. This area is strictly restricted to authorized administrators. If you do not have a PIN code, please submit an Access Request below.');
    }
  };

  // Gmail + PIN submit
  const handleGmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGmailError(null);

    const trimmedEmail = gmailInput.trim().toLowerCase();
    if (!trimmedEmail) {
      setGmailError('Please enter your Google Gmail address.');
      return;
    }

    const matchedUser = adminUsers.find(
      u => u.email.toLowerCase() === trimmedEmail && u.isApproved
    );

    if (!matchedUser) {
      // Check if user has a pending request
      const pendingReq = accessRequests.find(
        r => r.email.toLowerCase() === trimmedEmail && r.status === 'PENDING'
      );
      if (pendingReq) {
        setGmailError('Your access request is currently PENDING approval by the Admin (Abdur Rahman). You will be issued a PIN code once approved.');
      } else {
        setGmailError('Access Denied: No approved administrator account found for this Google Gmail. Submit an Access Request to be approved by the Admin.');
      }
      return;
    }

    if (!gmailPinInput.trim()) {
      setGmailError('Please enter the security PIN code associated with this account.');
      return;
    }

    if (matchedUser.pin === gmailPinInput.trim()) {
      onLoginSuccess(matchedUser);
    } else {
      setGmailError('Incorrect PIN for this account. Use "Forgot PIN?" below or enter your registered PIN code.');
    }
  };

  // Submit Request for Admin Access
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim() || !reqEmail.trim() || !reqReason.trim()) {
      return;
    }

    const email = reqEmail.trim().toLowerCase();
    onSubmitAccessRequest({
      name: reqName.trim(),
      email,
      requestedRole: reqRole,
      department: reqDepartment.trim() || 'University of Chitral',
      reason: reqReason.trim()
    });

    setLastSubmittedEmail(email);
    setReqSuccess(true);
    setReqName('');
    setReqEmail('');
    setReqDepartment('');
    setReqReason('');
  };

  // Forgot PIN: Request verification code to Google Gmail
  const handleForgotSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const trimmed = forgotEmail.trim().toLowerCase();
    if (!trimmed) {
      setForgotError('Please enter your registered Google Gmail.');
      return;
    }

    const user = adminUsers.find(u => u.email.toLowerCase() === trimmed && u.isApproved);
    if (!user) {
      setForgotError('No approved administrator account exists with this Gmail address.');
      return;
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedCode(code);
    setForgotStep('VERIFY_CODE');
  };

  // Verify OTP code
  const handleForgotVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (enteredCode.trim() !== simulatedCode) {
      setForgotError('Invalid verification code. Please check and try again.');
      return;
    }

    setForgotStep('RESET_PIN');
  };

  // Save new PIN
  const handleForgotResetPin = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (newPin.length < 4) {
      setForgotError('New PIN key must be at least 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setForgotError('PIN keys do not match.');
      return;
    }

    onUpdateUserPin(forgotEmail.trim().toLowerCase(), newPin);
    setForgotSuccess(true);

    const user = adminUsers.find(u => u.email.toLowerCase() === forgotEmail.trim().toLowerCase());
    if (user) {
      setTimeout(() => {
        onLoginSuccess({ ...user, pin: newPin });
      }, 1200);
    }
  };

  const pendingRequestsCount = accessRequests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="max-w-xl mx-auto my-6 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Top Header Badge */}
        <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 p-6 text-white text-center relative">
          <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 ring-2 ring-cyan-500/60 shadow-md mb-3 flex items-center justify-center">
            <img
              src="/skyler_official_logo.jpg"
              alt="Official Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/uoch-logo.png';
              }}
            />
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 mb-2">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Restricted Access • PIN Code Required</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            UOCH Institutional Admin Portal
          </h2>
          <p className="text-xs text-purple-200/80 mt-1 max-w-md mx-auto leading-relaxed">
            This area is restricted for anyone without an authorized security PIN code. Authorized administrators can unlock the panel, manage demographic and admission records, give access to other team members, and approve access requests.
          </p>

          {/* Owner Identity pill */}
          {ownerUser && (
            <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Admin &amp; Platform Owner: <strong>{ownerUser.name}</strong></span>
            </div>
          )}
        </div>

        {/* Navigation Mode Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveMode('PIN');
              setPinError(null);
            }}
            className={`py-3 text-center transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeMode === 'PIN'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 font-bold border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Enter PIN</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('REQUEST');
              setReqSuccess(false);
            }}
            className={`py-3 text-center transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer relative ${
              activeMode === 'REQUEST'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 font-bold border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Request Access</span>
            {pendingRequestsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveMode('GMAIL');
              setGmailError(null);
            }}
            className={`py-3 text-center transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeMode === 'GMAIL'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 font-bold border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gmail + PIN</span>
          </button>
        </div>

        <div className="p-6">
          {/* Preset Helper Card for Quick Evaluation */}
          <div className="mb-5 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 text-xs text-purple-900 dark:text-purple-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold flex items-center space-x-1.5 text-purple-700 dark:text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Authorized Administrator PIN Keys</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Click to autofill</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setPinInput('7860');
                  setPinError(null);
                  setActiveMode('PIN');
                }}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-purple-900/60 border border-purple-300 dark:border-purple-700 text-xs font-mono font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 transition flex items-center space-x-1 cursor-pointer"
              >
                <span>Owner:</span>
                <span className="text-emerald-700 dark:text-emerald-400">7860</span>
                <span className="text-[10px] text-slate-500 font-sans font-normal">(Abdur Rahman)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPinInput('4321');
                  setPinError(null);
                  setActiveMode('PIN');
                }}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-purple-900/60 border border-purple-300 dark:border-purple-700 text-xs font-mono font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 transition flex items-center space-x-1 cursor-pointer"
              >
                <span>Admin:</span>
                <span className="text-blue-700 dark:text-blue-400">4321</span>
                <span className="text-[10px] text-slate-500 font-sans font-normal">(Prof. Inam)</span>
              </button>
            </div>
          </div>

          {/* MODE 1: PIN CODE LOGIN */}
          {activeMode === 'PIN' && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Enter 4-Digit Security PIN Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPin ? 'Hide PIN' : 'Reveal PIN'}</span>
                  </button>
                </div>

                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={8}
                    placeholder="••••"
                    value={pinInput}
                    onChange={e => {
                      setPinInput(e.target.value);
                      setPinError(null);
                    }}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xl tracking-[0.35em] text-center font-mono font-black focus:ring-2 focus:ring-purple-500 focus:outline-none transition shadow-inner"
                    autoFocus
                  />
                </div>
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span className="leading-relaxed">{pinError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-900/30 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer shadow-md"
              >
                <Lock className="w-4 h-4" />
                <span>Unlock Admin Panel</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('REQUEST');
                    setReqSuccess(false);
                  }}
                  className="text-purple-600 dark:text-purple-400 hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Don't have a PIN? Request Access from Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('FORGOT');
                    setForgotEmail(ownerUser?.email || '');
                    setForgotStep('ENTER_EMAIL');
                    setForgotError(null);
                  }}
                  className="hover:underline text-slate-500 cursor-pointer"
                >
                  Forgot PIN?
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: GOOGLE GMAIL LOGIN */}
          {activeMode === 'GMAIL' && (
            <form onSubmit={handleGmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Google Gmail Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="e.g. abdurrahman17180@gmail.com"
                    value={gmailInput}
                    onChange={e => setGmailInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Account Security PIN Key
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Enter your security PIN"
                    value={gmailPinInput}
                    onChange={e => setGmailPinInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-mono tracking-wider focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {gmailError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{gmailError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-900/30 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Verify Google Gmail &amp; Login</span>
              </button>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('FORGOT');
                    setForgotEmail(gmailInput || ownerUser?.email || '');
                    setForgotStep('ENTER_EMAIL');
                    setForgotError(null);
                  }}
                  className="text-purple-600 dark:text-purple-400 hover:underline font-medium cursor-pointer"
                >
                  Forgot PIN? Reset via Gmail
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('PIN')}
                  className="text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  Back to PIN Login
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: REQUEST ACCESS (FOR NEW ACCESSORS) */}
          {activeMode === 'REQUEST' && (
            <div>
              {reqSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-3 shadow-inner">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Access Request Submitted to Admin!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Your application has been received. The Admin (<strong>{ownerUser?.name}</strong>) can now review and approve your request in the Admin Dashboard, and issue you a personal PIN code to unlock the Admin Panel.
                  </p>
                  {lastSubmittedEmail && (
                    <div className="inline-block px-3 py-1 rounded-md bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                      Applicant Email: {lastSubmittedEmail}
                    </div>
                  )}
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveMode('PIN')}
                      className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                    >
                      Back to PIN Login
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRequestSubmit} className="space-y-3.5">
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pb-1">
                    Submit your application for administrative access. The Admin reviews incoming requests and approves them by assigning an authorized PIN code.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Karim Shah"
                        value={reqName}
                        onChange={e => setReqName(e.target.value)}
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
                        placeholder="e.g. user@gmail.com"
                        value={reqEmail}
                        onChange={e => setReqEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Department / Affiliation
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dept of CS / Admissions Office"
                        value={reqDepartment}
                        onChange={e => setReqDepartment(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Requested Authority Level
                      </label>
                      <select
                        value={reqRole}
                        onChange={e => setReqRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="ADMIN">Co-Administrator (Full CRUD &amp; Data)</option>
                        <option value="ANALYST">Data Analyst (Analytics &amp; Ingestion)</option>
                        <option value="VIEWER">Auditor / Viewer (Read-only)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Reason for Access / Justification *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Explain your operational need to access Chitral demographic & university data..."
                      value={reqReason}
                      onChange={e => setReqReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-purple-900/30 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Access Request to Owner</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveMode('PIN')}
                      className="text-xs text-slate-500 hover:underline cursor-pointer"
                    >
                      Already have an approved PIN? Log in here
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE 4: FORGOT PIN VIA GOOGLE GMAIL */}
          {activeMode === 'FORGOT' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs text-purple-600 dark:text-purple-400 font-bold border-b border-purple-100 dark:border-purple-900/40 pb-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Google Gmail PIN Recovery Protocol</span>
              </div>

              {forgotSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    PIN Key Successfully Updated!
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Signing you into the Admin Governance Portal now...
                  </p>
                </div>
              ) : (
                <>
                  {/* Step 1: Enter Gmail */}
                  {forgotStep === 'ENTER_EMAIL' && (
                    <form onSubmit={handleForgotSendCode} className="space-y-3.5">
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Enter your registered Google Gmail to receive a one-time verification security code.
                      </p>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          Registered Google Gmail
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. abdurrahman17180@gmail.com"
                          value={forgotEmail}
                          onChange={e => setForgotEmail(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>

                      {forgotError && (
                        <p className="text-xs text-rose-600 dark:text-rose-400">{forgotError}</p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-purple-900/30 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Verification Code</span>
                      </button>
                    </form>
                  )}

                  {/* Step 2: Verify Code */}
                  {forgotStep === 'VERIFY_CODE' && (
                    <form onSubmit={handleForgotVerifyCode} className="space-y-3.5">
                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200">
                        <p className="font-semibold">Security Alert Sent to: {forgotEmail}</p>
                        <p className="text-[11px] mt-1 text-emerald-800 dark:text-emerald-300">
                          One-time Google verification code: <code className="font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded cursor-pointer transition-all hover:bg-emerald-200" onClick={() => setEnteredCode(simulatedCode)} title="Click to autofill">{simulatedCode}</code>
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          Enter 6-Digit Code
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="e.g. 849201"
                          value={enteredCode}
                          onChange={e => setEnteredCode(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center text-lg font-mono tracking-widest font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>

                      {forgotError && (
                        <p className="text-xs text-rose-600 dark:text-rose-400">{forgotError}</p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-purple-900/30 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify &amp; Proceed to Reset PIN</span>
                      </button>
                    </form>
                  )}

                  {/* Step 3: Set New PIN */}
                  {forgotStep === 'RESET_PIN' && (
                    <form onSubmit={handleForgotResetPin} className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                            New Security PIN Key
                          </label>
                          <input
                            type="password"
                            required
                            maxLength={10}
                            placeholder="4-6 digits"
                            value={newPin}
                            onChange={e => setNewPin(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                            Confirm New PIN
                          </label>
                          <input
                            type="password"
                            required
                            maxLength={10}
                            placeholder="Re-enter PIN"
                            value={confirmPin}
                            onChange={e => setConfirmPin(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {forgotError && (
                        <p className="text-xs text-rose-600 dark:text-rose-400">{forgotError}</p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Save New PIN &amp; Login</span>
                      </button>
                    </form>
                  )}

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveMode('PIN')}
                      className="text-xs text-slate-500 hover:underline cursor-pointer"
                    >
                      Back to PIN Login
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
