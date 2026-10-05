import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Zap,
  Activity,
  ExternalLink,
  Layers,
  Cpu
} from 'lucide-react';
import {
  getActiveGroqApiKey,
  setActiveGroqApiKey,
  clearActiveGroqApiKey,
  testGroqConnection,
  getPreferredGroqModel
} from '../../lib/ai/groqService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved
}) => {
  const [groqKeyInput, setGroqKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
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
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setActiveGroqApiKey(groqKeyInput);
    if (onKeySaved) onKeySaved();
    onClose();
  };

  const handleClear = () => {
    clearActiveGroqApiKey();
    setGroqKeyInput('');
    setTestResult(null);
    if (onKeySaved) onKeySaved();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const preferred = getPreferredGroqModel();
      const result = await testGroqConnection(groqKeyInput.trim(), preferred);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Connection ping failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl transition-all">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl text-white shadow-xs bg-orange-500">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Groq LPU API Configuration</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-semibold border bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-700">
                  LPU Inference
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ultra-low latency institutional inference grounded strictly in the forecast record.
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

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Groq Key Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-orange-500" />
                <span>Groq API Key (LPU)</span>
                {hasEnvGroqKey && !groqKeyInput && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                    (Defaulting to Environment Key)
                  </span>
                )}
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
                type={showKey ? 'text' : 'password'}
                value={groqKeyInput}
                onChange={e => {
                  setGroqKeyInput(e.target.value);
                  setTestResult(null);
                }}
                placeholder="gsk_... (Enter your Groq API key)"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Groq answers queries strictly grounded in the active mathematical forecast model and backtest error metrics with zero hallucination.
            </p>
          </div>

          {/* Model Architecture Stack */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-orange-500" />
              <span>Supported Groq LPU Models:</span>
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold block">FLAGSHIP REASONING</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">llama-3.3-70b-versatile</span>
                <p className="text-[10px] text-slate-400 mt-0.5">High-intelligence demographic forecasting</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">SUB-SECOND INSTANT</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">llama-3.1-8b-instant</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Sub-second query responses &amp; low latency</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">MOE ARCHITECTURE</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">mixtral-8x7b-32768</span>
                <p className="text-[10px] text-slate-400 mt-0.5">High-throughput mixture of experts</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">COMPACT REASONING</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">gemma2-9b-it</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Optimized instruction following</p>
              </div>
            </div>
          </div>

          {/* Test Connection Result */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start space-x-2.5 text-xs ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-bold">{testResult.success ? 'Groq LPU Verified' : 'Connection Failed'}</p>
                <p className="text-[11px] leading-relaxed">{testResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || (!groqKeyInput && !hasEnvGroqKey)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
          >
            <Activity className={`w-3.5 h-3.5 text-orange-500 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing Ping...' : 'Test Groq LPU'}</span>
          </button>

          <div className="flex items-center space-x-2">
            {groqKeyInput && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 transition cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-white font-bold text-xs transition cursor-pointer shadow-xs active:scale-95 bg-orange-500 hover:bg-orange-600"
            >
              Save Groq Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
