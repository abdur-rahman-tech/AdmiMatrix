import React, { useState, useEffect } from 'react';
import {
  Sliders,
  X,
  Eye,
  EyeOff,
  Activity,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  Database
} from 'lucide-react';
import {
  getActiveGroqApiKey,
  setActiveGroqApiKey,
  clearActiveGroqApiKey,
  getPreferredGroqModel,
  setPreferredGroqModel,
  testGroqConnection,
  GroqModelId
} from '../../lib/ai/groqService';

interface DeveloperSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: () => void;
}

export const DeveloperSettingsSidebar: React.FC<DeveloperSettingsSidebarProps> = ({
  isOpen,
  onClose,
  onConfigUpdated
}) => {
  const [groqKeyInput, setGroqKeyInput] = useState('');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GroqModelId>('llama-3.3-70b-versatile');
  const [isTestingGroq, setIsTestingGroq] = useState(false);
  const [groqTestResult, setGroqTestResult] = useState<{
    success: boolean;
    message: string;
    model?: string;
    latencyMs?: number;
  } | null>(null);

  const hasEnvGroqKey = Boolean(
    (import.meta as any).env?.VITE_GROQ_API_KEY ||
    (typeof process !== 'undefined' && process.env?.GROQ_API_KEY)
  );

  useEffect(() => {
    if (isOpen) {
      setGroqKeyInput(getActiveGroqApiKey());
      setSelectedModel(getPreferredGroqModel());
      setGroqTestResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSaveKey = () => {
    setActiveGroqApiKey(groqKeyInput);
    setPreferredGroqModel(selectedModel);
    if (onConfigUpdated) onConfigUpdated();
  };

  const handleClearGroqKey = () => {
    clearActiveGroqApiKey();
    setGroqKeyInput('');
    setGroqTestResult(null);
    if (onConfigUpdated) onConfigUpdated();
  };

  const handleModelChange = (model: GroqModelId) => {
    setSelectedModel(model);
    setPreferredGroqModel(model);
    if (onConfigUpdated) onConfigUpdated();
  };

  const handleTestGroqPing = async () => {
    setIsTestingGroq(true);
    setGroqTestResult(null);
    try {
      const res = await testGroqConnection(groqKeyInput.trim(), selectedModel);
      setGroqTestResult(res);
    } catch (err: any) {
      setGroqTestResult({
        success: false,
        message: err?.message || 'Groq ping failed.',
        latencyMs: 0
      });
    } finally {
      setIsTestingGroq(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Panel */}
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-orange-500 text-white shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Developer &amp; Groq LPU Settings</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 font-bold border border-orange-300 dark:border-orange-700">
                  Groq Cloud
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Runtime model selection, Groq API key management, and LPU inference telemetry.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Controls */}
        <div className="p-5 space-y-6 flex-1 text-xs text-slate-700 dark:text-slate-300">
          {/* Section 1: Groq API Key Management */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-orange-500" />
                <span>Groq LPU API Key</span>
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <span>Get Free Groq Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showGroqKey ? 'text' : 'password'}
                value={groqKeyInput}
                onChange={e => {
                  setGroqKeyInput(e.target.value);
                  setGroqTestResult(null);
                }}
                onBlur={handleSaveKey}
                placeholder="gsk_... (Enables Llama 3.3 on Groq LPU)"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowGroqKey(!showGroqKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">
                {hasEnvGroqKey ? '✓ Groq .env key detected' : 'No Groq key saved'}
              </span>
              <div className="flex items-center space-x-3">
                {groqKeyInput && (
                  <button
                    type="button"
                    onClick={handleTestGroqPing}
                    disabled={isTestingGroq}
                    className="text-orange-600 dark:text-orange-400 hover:underline font-bold cursor-pointer"
                  >
                    {isTestingGroq ? 'Testing...' : 'Test Groq'}
                  </button>
                )}
                {groqKeyInput && (
                  <button
                    type="button"
                    onClick={handleClearGroqKey}
                    className="text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Clear Groq Key
                  </button>
                )}
              </div>
            </div>

            {groqTestResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start space-x-2 ${
                  groqTestResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                {groqTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <span className="font-bold block">
                    {groqTestResult.success ? 'Groq LPU Connected' : 'Groq Connection Error'}
                  </span>
                  <p className="text-[11px] font-mono leading-tight">{groqTestResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Active Groq Model Selection */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-orange-500" />
              <span>Active Groq LPU Model Target</span>
            </label>

            <select
              value={selectedModel}
              onChange={e => handleModelChange(e.target.value as GroqModelId)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Flagship Deep Reasoning — Recommended)</option>
              <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Sub-second Instant)</option>
              <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (High Throughput MoE)</option>
              <option value="gemma2-9b-it">gemma2-9b-it (Compact Reasoning on Groq LPU)</option>
            </select>
          </div>

          {/* Section 3: Connection Ping Test */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
                Groq Connection Health
              </span>
              <button
                type="button"
                onClick={handleTestGroqPing}
                disabled={isTestingGroq || (!groqKeyInput && !hasEnvGroqKey)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold transition disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
              >
                <Activity className={`w-3.5 h-3.5 ${isTestingGroq ? 'animate-spin' : ''}`} />
                <span>{isTestingGroq ? 'Pinging...' : 'Test Groq LPU'}</span>
              </button>
            </div>
          </div>

          {/* Section 4: Database Memory Engine Architecture */}
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2 text-[11px]">
            <span className="font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Recommended Database Memory Architecture</span>
            </span>
            <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <strong>Active Client Memory:</strong> IndexedDB transactional engine carrying 2017–2026 admissions, PBS census tables, and multi-horizon forecast snapshots with zero UI blocking.
            </p>
            <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <strong>Enterprise Backend:</strong> Pre-configured PostgreSQL / Cloud SQL relational DDL schema with ACID headcount invariance constraints (<code className="font-mono text-emerald-950 dark:text-emerald-100">male + female = total</code>).
            </p>
          </div>

          {/* Section 5: Architecture Guarantee Pill */}
          <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-2 text-[11px]">
            <span className="font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Mathematical Integrity Separation</span>
            </span>
            <p className="text-purple-800 dark:text-purple-300 leading-relaxed">
              AdmiMatrix strictly executes all numerical time-series forecasting (Logit-Linked Asymptotic Trend, Holt-Winters, Monte Carlo intervals) in local TypeScript modules (<code className="font-mono text-purple-900 dark:text-purple-200">src/lib/ml</code>). Groq models are used exclusively for rapid natural language synthesis and multimodal document inspection.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400">
            AdmiMatrix • Groq LPU Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs transition cursor-pointer"
          >
            Close Settings
          </button>
        </div>
      </aside>
    </div>
  );
};
