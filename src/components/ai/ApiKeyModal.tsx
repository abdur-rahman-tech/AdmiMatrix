import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Activity,
  ExternalLink,
  Layers,
  Cpu
} from 'lucide-react';
import {
  getActiveApiKey,
  setActiveApiKey,
  clearActiveApiKey,
  testGeminiConnection
} from '../../lib/ai/geminiService';
import {
  getActiveGroqApiKey,
  setActiveGroqApiKey,
  clearActiveGroqApiKey,
  testGroqConnection
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
  const [activeTab, setActiveTab] = useState<'GEMINI' | 'GROQ'>('GROQ');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [groqKeyInput, setGroqKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    model?: string;
  } | null>(null);

  const hasEnvKey = Boolean(
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY)
  );

  const hasEnvGroqKey = Boolean(
    (import.meta as any).env?.VITE_GROQ_API_KEY ||
    (typeof process !== 'undefined' && process.env?.GROQ_API_KEY)
  );

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(getActiveApiKey());
      setGroqKeyInput(getActiveGroqApiKey());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setActiveApiKey(apiKeyInput);
    setActiveGroqApiKey(groqKeyInput);
    if (onKeySaved) onKeySaved();
    onClose();
  };

  const handleClear = () => {
    if (activeTab === 'GEMINI') {
      clearActiveApiKey();
      setApiKeyInput('');
    } else {
      clearActiveGroqApiKey();
      setGroqKeyInput('');
    }
    setTestResult(null);
    if (onKeySaved) onKeySaved();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      if (activeTab === 'GEMINI') {
        const result = await testGeminiConnection(apiKeyInput.trim());
        setTestResult(result);
      } else {
        const result = await testGroqConnection(groqKeyInput.trim(), 'llama-3.3-70b-versatile');
        setTestResult(result);
      }
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
            <div className={`p-2 rounded-xl text-white shadow-xs ${activeTab === 'GROQ' ? 'bg-orange-500' : 'bg-purple-600'}`}>
              {activeTab === 'GROQ' ? <Zap className="w-5 h-5" /> : <Key className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>{activeTab === 'GROQ' ? 'Groq LPU API Configuration' : 'Google Gemini API Configuration'}</span>
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-semibold border ${
                  activeTab === 'GROQ'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-700'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                }`}>
                  {activeTab === 'GROQ' ? 'Llama 3.3 LPU' : 'Live Engine'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTab === 'GROQ'
                  ? 'Ultra-low latency inference grounded strictly in the app forecast record.'
                  : 'Hackathon judge evaluation & runtime API key management.'}
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

        {/* Provider Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('GROQ');
              setTestResult(null);
            }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'GROQ'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-orange-500" />
            <span>Groq LPU (Llama 3.3)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('GEMINI');
              setTestResult(null);
            }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'GEMINI'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-purple-600" />
            <span>Google Gemini</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {activeTab === 'GROQ' ? (
            /* Groq Key Input */
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
                  className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline flex items-center space-x-1"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Groq answers queries strictly grounded in the active mathematical forecast model and backtest error metrics with zero hallucination.
              </p>
            </div>
          ) : (
            /* Gemini Key Input */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                  <span>Gemini API Key</span>
                  {hasEnvKey && !apiKeyInput && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                      (Defaulting to Environment Key)
                    </span>
                  )}
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={e => {
                    setApiKeyInput(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="AIzaSy... (Enter your Google Gemini API key)"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Your key is saved locally in your browser session for live evaluation and is never persisted to external databases.
              </p>
            </div>
          )}

          {/* Model Architecture Stack */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Multi-Tier Model Fallback Strategy:</span>
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">PRIMARY MODEL</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">gemini-3.8-flash</span>
                <p className="text-[10px] text-slate-400 mt-0.5">High-speed multimodal &amp; structured JSON</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">AUTO-FALLBACK</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">gemini-3.1-flash-lite</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Zero-latency fallback on rate limits</p>
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
                <p className="font-bold">{testResult.success ? 'API Key Verified' : 'Connection Failed'}</p>
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
            disabled={isTesting || (activeTab === 'GEMINI' ? (!apiKeyInput && !hasEnvKey) : (!groqKeyInput && !hasEnvGroqKey))}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
          >
            <Activity className={`w-3.5 h-3.5 ${activeTab === 'GROQ' ? 'text-orange-500' : 'text-purple-600'} ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing Ping...' : activeTab === 'GROQ' ? 'Test Groq LPU' : 'Test Gemini'}</span>
          </button>

          <div className="flex items-center space-x-2">
            {(activeTab === 'GEMINI' ? apiKeyInput : groqKeyInput) && (
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
              className={`px-4 py-2 rounded-lg text-white font-bold text-xs transition cursor-pointer shadow-xs active:scale-95 ${
                activeTab === 'GROQ' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
