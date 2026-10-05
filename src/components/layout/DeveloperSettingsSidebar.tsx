import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  ExternalLink,
  Key,
  RefreshCw,
  Sliders,
  X,
  Zap
} from 'lucide-react';
import {
  getPreferredGroqModel,
  GroqModelId,
  setPreferredGroqModel,
  getGroqApiKey,
  saveGroqApiKey,
  clearGroqApiKey,
  testGroqConnection
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
  const [selectedModel, setSelectedModel] = useState<GroqModelId>(getPreferredGroqModel());
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedModel(getPreferredGroqModel());
    setApiKeyInput(getGroqApiKey());
    setTestResult(null);

    fetch('/api/ai/config')
      .then(async response => {
        if (!response.ok) throw new Error(`Configuration request failed (${response.status}).`);
        const config = await response.json();
        setConfigured(Boolean(config.groqConfigured));
      })
      .catch(() => setConfigured(false));
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleModelChange = (model: GroqModelId) => {
    setSelectedModel(model);
    setPreferredGroqModel(model);
    setTestResult(null);
    onConfigUpdated?.();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      setTestResult(await testGroqConnection(selectedModel, apiKeyInput.trim() || undefined));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveKey = async () => {
    setIsSaving(true);
    setTestResult(null);
    try {
      setPreferredGroqModel(selectedModel);
      if (apiKeyInput.trim()) {
        const result = await saveGroqApiKey(apiKeyInput.trim());
        setTestResult(result);
        if (result.success) {
          setConfigured(true);
          onConfigUpdated?.();
        }
      } else {
        clearGroqApiKey();
        setTestResult({
          success: true,
          message: 'Local key cleared. Using server environment key.'
        });
        onConfigUpdated?.();
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <button
        type="button"
        aria-label="Close settings"
        className="flex-1 cursor-default"
        onClick={onClose}
      />
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col overflow-y-auto">
        <header className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500 text-white">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Groq AI Settings</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ultra-fast LPU inference &amp; institutional reasoning engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-5 space-y-6 flex-1 text-xs text-slate-700 dark:text-slate-300">
          {/* Status info */}
          <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-900 dark:text-white">
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              <span>Groq Cloud Configuration</span>
            </h4>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${configured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <p className="leading-relaxed">
                {configured === null
                  ? 'Checking server configuration…'
                  : configured
                    ? 'GROQ_API_KEY is active and ready.'
                    : 'GROQ_API_KEY is not configured. Enter your key below or save it to .env.'}
              </p>
            </div>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-orange-600 dark:text-orange-400 hover:underline text-[11px] font-semibold"
            >
              <span>Manage Groq API keys</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </section>

          {/* API Key Input */}
          <section className="space-y-2">
            <label className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-900 dark:text-white">
              <Key className="w-3.5 h-3.5 text-orange-500" />
              <span>Groq API Key (gsk_...)</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={e => {
                  setApiKeyInput(e.target.value);
                  setTestResult(null);
                }}
                placeholder="gsk_... (Paste your Groq API key)"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSaveKey}
              disabled={isSaving}
              className="w-full py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-xs transition cursor-pointer"
            >
              {isSaving ? 'Saving…' : 'Save & Sync API Key'}
            </button>
          </section>

          {/* Preferred Model */}
          <section className="space-y-2">
            <label className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-900 dark:text-white">
              <Cpu className="w-3.5 h-3.5 text-orange-500" />
              <span>Preferred Groq Model</span>
            </label>
            <select
              value={selectedModel}
              onChange={event => handleModelChange(event.target.value as GroqModelId)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Deep Reasoning)</option>
              <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (Fast Instant)</option>
            </select>
          </section>

          {/* Test Connection Button */}
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || (!configured && !apiKeyInput)}
            className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 disabled:opacity-50 transition cursor-pointer flex items-center justify-center space-x-2"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Testing Groq Ping…</span>
              </>
            ) : (
              <span>Test Groq Connection</span>
            )}
          </button>

          {testResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}>
              {testResult.success
                ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />}
              <div className="space-y-0.5">
                <p className="font-bold">{testResult.success ? 'Groq Connected' : 'Connection Failed'}</p>
                <p className="text-[11px] leading-relaxed">{testResult.message}</p>
                {testResult.latencyMs !== undefined && (
                  <p className="text-[10px] font-mono opacity-80">Latency: {testResult.latencyMs}ms</p>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
