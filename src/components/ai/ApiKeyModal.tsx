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
  Zap,
  X
} from 'lucide-react';
import {
  getPreferredGroqModel,
  setPreferredGroqModel,
  GroqModelId,
  GROQ_MODELS,
  getGroqApiKey,
  setGroqApiKey,
  clearGroqApiKey,
  saveGroqApiKey,
  testGroqConnection
} from '../../lib/ai/groqService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const [groqKeyInput, setGroqKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GroqModelId>(getPreferredGroqModel());
  const [hasServerKey, setHasServerKey] = useState<boolean | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setGroqKeyInput(getGroqApiKey());
    setSelectedModel(getPreferredGroqModel());
    setTestResult(null);

    fetch('/api/ai/config')
      .then(async response => {
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const config = await response.json();
        setHasServerKey(Boolean(config.groqConfigured));
      })
      .catch(() => setHasServerKey(false));
  }, [isOpen]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testGroqConnection(selectedModel, groqKeyInput.trim() || undefined);
      setTestResult(result);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setTestResult(null);
    try {
      setPreferredGroqModel(selectedModel);

      if (groqKeyInput.trim()) {
        const result = await saveGroqApiKey(groqKeyInput.trim());
        setTestResult(result);
        if (result.success) {
          setHasServerKey(true);
          onKeySaved?.();
        }
      } else {
        clearGroqApiKey();
        setTestResult({
          success: true,
          message: 'Saved configuration. Server environment key will be used by default.'
        });
        onKeySaved?.();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setGroqKeyInput('');
    clearGroqApiKey();
    setTestResult({
      success: true,
      message: 'Browser-stored API key cleared.'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="groq-config-title"
        className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5"
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 id="groq-config-title" className="font-bold text-base text-slate-900 dark:text-white">
                Groq AI API Configuration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                LPU inference for zero-hallucination institutional demographic reasoning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Server & Key Status Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${hasServerKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {hasServerKey === null
                ? 'Checking server key…'
                : hasServerKey
                  ? 'Server GROQ_API_KEY: Configured & Ready'
                  : 'Server GROQ_API_KEY: Not detected (enter key below)'}
            </span>
          </div>
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1 text-orange-600 dark:text-orange-400 hover:underline font-semibold"
          >
            <span>Get Free Key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <label className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-orange-500" />
              <span>Groq API Key</span>
            </span>
            {hasServerKey && !groqKeyInput && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium lowercase">
                (active via server .env)
              </span>
            )}
          </label>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={groqKeyInput}
              onChange={e => {
                setGroqKeyInput(e.target.value);
                setTestResult(null);
              }}
              placeholder="gsk_... (Paste your Groq API key)"
              className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Keys are validated with Groq's high-speed LPU cloud and saved securely to your workspace environment.
          </p>
        </div>

        {/* Preferred Reasoning Model Selection */}
        <div className="space-y-2">
          <label className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-orange-500" />
            <span>Active Groq LPU Reasoning Model</span>
          </label>
          <select
            value={selectedModel}
            onChange={e => {
              setSelectedModel(e.target.value as GroqModelId);
              setTestResult(null);
            }}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Primary Deep Reasoning)</option>
            <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (Low Latency Instant)</option>
            <option value="qwen/qwen3.8-27b">qwen/qwen3.8-27b (Alternative Open-Weight)</option>
          </select>
        </div>

        {/* Test Result Callout */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border flex items-start space-x-2.5 text-xs transition-all ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="font-bold">{testResult.success ? 'Groq LPU Verified' : 'Connection Error'}</p>
              <p className="text-[11px] leading-relaxed">{testResult.message}</p>
              {testResult.latencyMs !== undefined && (
                <p className="text-[10px] font-mono opacity-80">Ping latency: {testResult.latencyMs}ms</p>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || (!groqKeyInput && !hasServerKey)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 disabled:opacity-50 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Pinging Groq…' : 'Test Ping'}</span>
          </button>

          <div className="flex items-center space-x-2">
            {groqKeyInput && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 transition cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
